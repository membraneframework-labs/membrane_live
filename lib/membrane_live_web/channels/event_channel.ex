defmodule MembraneLiveWeb.EventChannel do
  @moduledoc """
  Channel for communicating in each event.
  """
  use Phoenix.Channel

  import Ecto.Query, only: [from: 2]
  import MembraneLiveWeb.Helpers.EtsHelper

  require Logger

  alias MembraneLive.Accounts
  alias MembraneLive.Chats
  alias MembraneLive.EventController
  alias MembraneLive.Repo
  alias MembraneLive.Room
  alias MembraneLive.Tokens
  alias MembraneLive.Webinars
  alias MembraneLive.Webinars.Webinar
  alias MembraneLiveWeb.Presence
  alias Phoenix.Socket

  @impl true
  def join("event:" <> id, %{"username" => name}, socket) do
    case webinar_exists(id) do
      {:ok, false} ->
        {:error, %{reason: "This event doesn't exists."}}

      {:ok, true} ->
        :ets.insert_new(:banned_from_chat, {id, MapSet.new()})

        EventController.update_event(:join, id)

        with gen_key <- UUID.uuid1(),
             {:ok, is_banned_from_chat} <- check_if_banned_from_chat(gen_key, id) do
          Presence.track(socket, gen_key, %{
            name: name,
            is_moderator: false,
            is_presenter: false,
            is_auth: false,
            is_banned_from_chat: is_banned_from_chat
          })

          {:ok, %{generated_key: gen_key},
           Phoenix.Socket.assign(socket, %{event_id: id, user_email: gen_key, event_pid: nil})}
        end

      {:error, _error} ->
        {:error, %{reason: "This link is wrong."}}
    end
  end

  @impl true
  def join(
        "event:" <> id,
        %{
          "token" => token,
          "presenter" => should_be_presenter,
          "requestPresenting" => requests_presenting
        },
        socket
      ) do
    case webinar_exists(id) do
      {:ok, false} ->
        {:error, %{reason: "This event doesn't exists."}}

      {:ok, true} ->
        :ets.insert_new(:presenters, {id, MapSet.new()})
        :ets.insert_new(:presenting_requests, {id, MapSet.new()})
        :ets.insert_new(:banned_from_chat, {id, MapSet.new()})
        :ets.insert_new(:main_presenters, {id, MapSet.new()})

        EventController.update_event(:join, id)

        with {:ok, %{"user_id" => uuid}} <- Tokens.auth_decode(token),
             {:ok, name} <- Accounts.get_username(uuid),
             {:ok, email} <- Accounts.get_email(uuid),
             is_moderator <- Webinars.check_is_user_moderator!(uuid, id),
             socket <-
               Socket.assign(socket, %{
                 is_moderator: is_moderator,
                 event_id: id,
                 user_email: email
               }),
             [] <- Presence.get_by_key(socket, email),
             {:ok, socket} <- create_event(socket),
             {:ok, is_presenter} <-
               check_if_presenter(
                 email,
                 should_be_presenter && can_be_presenter(id, socket, email),
                 id
               ),
             {:ok, is_banned_from_chat} <- check_if_banned_from_chat(email, id),
             {:ok, is_request_presenting} <-
               check_if_request_presenting(email, requests_presenting, id) do
          {:ok, socket} = if is_presenter, do: join_event(socket), else: {:ok, socket}

          {:ok, _ref} =
            Presence.track(socket, email, %{
              name: name,
              is_moderator: is_moderator,
              is_presenter: is_presenter,
              is_request_presenting: is_request_presenting,
              is_auth: true,
              is_banned_from_chat: is_banned_from_chat
            })

          if is_moderator, do: send(socket.assigns.event_pid, {:moderator, self()})

          {:ok, %{is_moderator: is_moderator}, socket}
        else
          %{metas: _presence} ->
            {:error,
             %{
               reason: "This app can be opened in only one window"
             }}

          _error ->
            {:error,
             %{
               reason: "Error occured while creating event stream or adding user to presence"
             }}
        end

      {:error, _error} ->
        {:error, %{reason: "This link is wrong."}}
    end
  end

  @impl true
  def join("private:" <> _subtopic, _data, socket) do
    {:ok, socket}
  end

  @impl true
  def join(_topic, _params, _socket) do
    {:error, %{reason: "This link is wrong."}}
  end

  defp can_be_presenter(id, socket, email) do
    can_be_main_presenter(id, email) || get_number_of_basic_presenters(id, socket) < 2
  end

  defp can_be_main_presenter(id, email) do
    stored_presenter = get_main_presenter(id)
    is_nil(stored_presenter) || stored_presenter == email
  end

  defp get_number_of_basic_presenters(id, socket) do
    main_presenter = get_main_presenter(id)

    Presence.list(socket)
    |> Enum.map(fn {email, %{metas: [meta | _rest]}} -> {email, meta} end)
    |> Enum.filter(fn {email, %{is_presenter: is_presenter}} ->
      is_presenter and email != main_presenter
    end)
    |> length()
  end

  @impl true
  def terminate(_reason, %Socket{topic: "event:" <> id}) do
    EventController.update_event(:leave, id)
    :ok
  end

  def terminate(_reason, _socket), do: :ok

  @impl true
  def handle_info({:media_event, event}, socket) do
    push(socket, "mediaEvent", %{data: event})

    {:noreply, socket}
  end

  @impl true
  def handle_info(:endpoint_crashed, socket) do
    push(socket, "error", %{
      message: "WebRTC Endpoint has crashed. Please refresh the page to reconnect"
    })

    {:stop, :normal, socket}
  end

  def handle_in("finish_event", %{}, socket) do
    "event:" <> event_id = socket.topic

    EventController.send_kill(event_id)

    {:noreply, socket}
  end

  def handle_in("sync_presence", _data, socket) do
    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  def handle_in("reaction_" <> animation_type, _data, socket)
      when animation_type in ["confetti", "heart"] do
    broadcast(socket, "animation_" <> animation_type, %{})
    {:noreply, socket}
  end

  def handle_in(
        "am_i_main_presenter",
        %{"is_presenter" => is_presenter},
        %{topic: "private:" <> topic_id} = socket
      ) do
    [id, email] = String.split(topic_id, ":")
    {:ok, is_main_presenter} = check_if_main_presenter(email, is_presenter, id)
    {:reply, {:ok, %{"main_presenter" => is_main_presenter}}, socket}
  end

  def handle_in("chat_message", %{"content" => content}, %{topic: "event:" <> id} = socket) do
    email = socket.assigns.user_email
    {:ok, is_banned_from_chat} = check_if_banned_from_chat(email, id)

    if not is_banned_from_chat do
      %{metas: [%{name: name, is_auth: is_auth}]} = Presence.get_by_key(socket, email)

      {:ok, is_presenter} = check_if_presenter(email, true, id)

      key = if is_auth and is_presenter, do: :start_timestamps, else: :client_start_timestamps

      offset =
        case :ets.lookup(key, id) do
          [{_key, timestamp}] ->
            System.monotonic_time(:millisecond) - timestamp

          [] ->
            0
        end

      Chats.add_chat_message(id, name, email, is_auth, content, offset)

      broadcast(socket, "chat_message", %{
        "email" => email,
        "name" => name,
        "content" => content,
        "offset" => offset
      })
    end

    {:noreply, socket}
  end

  # removing works in 4 stages: moderator (chooses presenter to remove and sends message) ->
  # server (sends information to presenter) -> presenter (shows alert that it's been removed
  # and sends message back) -> server (updates presenter in Presence)
  # such design is caused by user Presence that can be updated only with its socket-channel combination
  # (socket parameter in function below)
  def handle_in("presenter_remove", %{"email" => email}, socket) do
    {:ok, _ref} = Presence.update(socket, email, &Map.put(&1, :is_presenter, false))

    "event:" <> id = socket.topic
    remove_from_presenters(email, id)
    remove_from_main_presenters(email, id)

    if Map.has_key?(socket.assigns, :peer_id),
      do: send(socket.assigns.event_pid, {:remove_peer_channel, self(), socket.assigns.peer_id})

    {:noreply, socket}
  end

  def handle_in("presenter_remove", %{"presenterTopic" => presenter_topic}, socket) do
    props =
      presenter_topic
      |> String.split(":")
      |> List.last()
      |> then(&Presence.get_by_key(socket, &1))

    case props do
      %{metas: [%{is_presenter: true}]} ->
        MembraneLiveWeb.Endpoint.broadcast_from!(self(), presenter_topic, "presenter_remove", %{})

      [] ->
        raise "Error: Trying to remove presenter role from nonexistent participant"

      %{metas: [%{}]} ->
        raise "Error: Trying to remove presenter role from participant that is no a presenter"
    end

    {:noreply, socket}
  end

  def handle_in(
        "presenter_prop",
        %{
          "moderatorTopic" => moderator_topic,
          "presenterTopic" => presenter_topic,
          "mainPresenter" => true
        },
        socket
      ) do
    "event:" <> id = socket.topic

    main_presenter = get_main_presenter(id)

    main_presenter =
      if Presence.absent?(socket, main_presenter) do
        remove_from_main_presenters(main_presenter, id)
        nil
      end

    if is_nil(main_presenter) do
      MembraneLiveWeb.Endpoint.broadcast_from!(self(), presenter_topic, "presenter_prop", %{
        moderator_topic: moderator_topic,
        main_presenter: true
      })
    else
      proposed_presenter =
        presenter_topic
        |> String.split(":")
        |> List.last()

      case proposed_presenter do
        ^main_presenter ->
          MembraneLiveWeb.Endpoint.broadcast_from!(self(), moderator_topic, "error", %{
            message: "This participant is already a main presenter."
          })

        _new_main_presenter ->
          MembraneLiveWeb.Endpoint.broadcast_from!(self(), moderator_topic, "error", %{
            message: "There can be only one main presenter."
          })
      end
    end

    {:noreply, socket}
  end

  def handle_in(
        "presenter_prop",
        %{
          "moderatorTopic" => moderator_topic,
          "presenterTopic" => presenter_topic,
          "mainPresenter" => false
        },
        socket
      ) do
    "event:" <> id = socket.topic
    number_of_basic_presenters = get_number_of_basic_presenters(id, socket)

    if number_of_basic_presenters < 2 do
      MembraneLiveWeb.Endpoint.broadcast_from!(self(), presenter_topic, "presenter_prop", %{
        moderator_topic: moderator_topic,
        main_presenter: false
      })
    else
      MembraneLiveWeb.Endpoint.broadcast_from!(self(), moderator_topic, "error", %{
        message: "There can be only two main presenters."
      })
    end

    {:noreply, socket}
  end

  def handle_in(
        "presenter_answer",
        %{
          "answer" => answer,
          "email" => email,
          "moderatorTopic" => moderator_topic,
          "mainPresenter" => main_presenter?
        },
        socket
      ) do
    if answer == "accept" do
      {:ok, _ref} =
        Presence.update(
          socket,
          email,
          &%{
            &1
            | is_presenter: true,
              is_request_presenting: false
          }
        )

      "event:" <> id = socket.topic
      add_to_presenters(email, id)
      if main_presenter?, do: add_to_main_presenters(email, id)
      remove_from_presenting_requests(email, id)
    else
      {:ok, _ref} =
        Presence.update(
          socket,
          email,
          &%{&1 | is_request_presenting: false}
        )
    end

    %{metas: [%{name: name}]} = Presence.get_by_key(socket, email)

    MembraneLiveWeb.Endpoint.broadcast_from!(self(), moderator_topic, "presenter_answer", %{
      :name => name,
      :answer => answer
    })

    {:noreply, socket}
  end

  def handle_in("ban_from_chat", %{"email" => email, "response" => true}, socket) do
    {:ok, _ref} =
      Presence.update(
        socket,
        email,
        &%{&1 | is_banned_from_chat: true}
      )

    {:noreply, socket}
  end

  def handle_in("ban_from_chat", %{"email" => email}, %{topic: "event:" <> id} = socket) do
    if socket.assigns.is_moderator do
      MembraneLiveWeb.Endpoint.broadcast_from!(
        self(),
        "private:#{id}:#{email}",
        "ban_from_chat",
        %{}
      )

      add_to_banned_from_chat(email, id)
      Chats.remove_messages_from_user(id, email)
    end

    {:noreply, socket}
  end

  def handle_in("unban_from_chat", %{"email" => email, "response" => true}, socket) do
    {:ok, _ref} =
      Presence.update(
        socket,
        email,
        &%{&1 | is_banned_from_chat: false}
      )

    {:noreply, socket}
  end

  def handle_in("unban_from_chat", %{"email" => email}, %{topic: "event:" <> id} = socket) do
    if socket.assigns.is_moderator do
      MembraneLiveWeb.Endpoint.broadcast_from!(
        self(),
        "private:#{id}:#{email}",
        "unban_from_chat",
        %{}
      )

      remove_from_banned_from_chat(email, id)
    end

    {:noreply, socket}
  end

  def handle_in(
        "presenter_ready",
        %{"email" => _email},
        socket
      ) do
    {:ok, socket} = join_event(socket)

    {:noreply, socket}
  end

  def handle_in(
        "last_viewer_answer",
        %{"answer" => answer},
        %{topic: "event:" <> event_id} = socket
      ) do
    case answer do
      "leave" -> EventController.send_response(:leave, event_id)
      "stay" -> EventController.send_response(:stay, event_id)
    end

    {:noreply, socket}
  end

  def handle_in(
        "presenting_request",
        %{"email" => email},
        %{topic: "event:" <> id} = socket
      ) do
    {:ok, _ref} = Presence.update(socket, email, &%{&1 | is_request_presenting: true})

    add_to_presenting_request(email, id)

    {:noreply, socket}
  end

  def handle_in(
        "cancel_presenting_request",
        %{"email" => email},
        %{topic: "event:" <> id} = socket
      ) do
    {:ok, _ref} = Presence.update(socket, email, &%{&1 | is_request_presenting: false})
    remove_from_presenting_requests(email, id)

    {:noreply, socket}
  end

  @impl true
  def handle_in("mediaEvent", %{"data" => event}, socket) do
    send(socket.assigns.event_pid, {:media_event, socket.assigns.peer_id, event})
    {:noreply, socket}
  end

  @impl true
  def handle_in("isPlaylistPlayable", _data, socket) do
    socket = set_event_pid(socket)

    if socket.assigns.event_pid != nil do
      case :global.whereis_name(socket.assigns.event_id) do
        :undefined ->
          {:reply, {:ok, false}, socket}

        _pid ->
          {:reply, {:ok, GenServer.call(socket.assigns.event_pid, :is_playlist_playable)}, socket}
      end
    else
      {:reply, {:ok, false}, socket}
    end
  end

  defp create_event(socket) do
    case :global.whereis_name(socket.assigns.event_id) do
      :undefined ->
        maybe_start_event(socket)

      pid ->
        {:ok, pid}
    end
    |> case do
      {:ok, event_pid} ->
        {:ok, Socket.assign(socket, %{event_pid: event_pid})}

      {:error, {:already_started, event_pid}} ->
        {:ok, Socket.assign(socket, %{event_pid: event_pid})}

      {:error, :non_moderator} ->
        {:ok, Socket.assign(socket, %{event_pid: nil})}

      {:error, reason} ->
        Logger.error("""
        Failed to start room.
        Room: #{inspect(socket.assigns.event_id)}
        Reason: #{inspect(reason)}
        """)

        {:error, %{reason: "failed to start event: #{reason}"}}
    end
  end

  defp maybe_start_event(socket) do
    {:ok, webinar} = Webinars.get_webinar(socket.assigns.event_id)

    cond do
      webinar.is_finished ->
        {:error, :webinar_finished}

      socket.assigns.is_moderator ->
        result = Room.start(socket.assigns.event_id, name: {:global, socket.assigns.event_id})
        EventController.room_created(socket.assigns.event_id)
        result

      true ->
        {:error, :non_moderator}
    end
  end

  defp set_event_pid(socket) do
    case :global.whereis_name(socket.assigns.event_id) do
      :undefined -> socket
      pid -> Socket.assign(socket, %{event_pid: pid})
    end
  end

  defp join_event(socket) do
    socket = set_event_pid(socket)

    if is_nil(socket.assigns.event_pid),
      do: raise("Event was not started before first joining attempt")

    peer_id = "#{UUID.uuid4()}"

    send(socket.assigns.event_pid, {:add_peer_channel, self(), peer_id})

    {:ok, Socket.assign(socket, %{peer_id: peer_id})}
  end

  defp webinar_exists(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} ->
        {:ok, Repo.exists?(from(w in Webinar, where: w.uuid == ^id))}

      _error ->
        {:error, "id is not binary_id"}
    end
  end
end
