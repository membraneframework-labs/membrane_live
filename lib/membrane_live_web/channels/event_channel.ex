defmodule MembraneLiveWeb.EventChannel do
  @moduledoc """
  Channel for communicating in each event.
  """
  use Phoenix.Channel

  import Ecto.Query, only: [from: 2]

  require Logger

  alias MembraneLive.Accounts
  alias MembraneLive.Event
  alias MembraneLive.Repo
  alias MembraneLive.Tokens
  alias MembraneLive.Webinars
  alias MembraneLive.Webinars.Webinar
  alias MembraneLiveWeb.Presence

  @impl true
  def join("event:" <> id, %{"token" => token, "reloaded" => reloaded}, socket) do
    case webinar_exists(id) do
      {:ok, false} ->
        {:error, %{reason: "This event doesn't exists."}}

      {:ok, true} ->
        :ets.insert_new(:presenters, {id, MapSet.new()})
        :ets.insert_new(:presenting_requests, {id, MapSet.new()})

        with {:ok, %{"user_id" => uuid}} <- Tokens.auth_decode(token),
             {:ok, name} <- Accounts.get_username(uuid),
             {:ok, email} <- Accounts.get_email(uuid),
             [] <- Presence.get_by_key(socket, email),
             {:ok, socket} <- create_event_stream(id, socket),
             {:ok, is_presenter} = check_if_presenter(email, reloaded, id),
             {:ok, is_request_presenting} = check_if_request_presenting(email, reloaded, id),
             is_moderator <- Webinars.check_is_user_moderator(uuid, id) do
          {:ok, socket} = if is_presenter, do: join_event_stream(socket), else: {:ok, socket}

          {:ok, _ref} =
            Presence.track(socket, email, %{
              name: name,
              is_moderator: is_moderator,
              is_presenter: is_presenter,
              is_request_presenting: is_request_presenting
            })

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

  @impl true
  def handle_info(
        {:DOWN, _ref, :process, _pid, _reason},
        socket
      ) do
    {:stop, :normal, socket}
  end

  @impl true
  def handle_info({:media_event, event}, socket) do
    push(socket, "mediaEvent", %{data: event})

    {:noreply, socket}
  end

  def handle_in("sync_presence", _data, socket) do
    push(socket, "presence_state", Presence.list(socket))
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
        %{"moderatorTopic" => moderator_topic, "presenterTopic" => presenter_topic},
        socket
      ) do
    MembraneLiveWeb.Endpoint.broadcast_from!(self(), presenter_topic, "presenter_prop", %{
      moderator_topic: moderator_topic
    })

    {:noreply, socket}
  end

  def handle_in(
        "presenter_answer",
        %{"answer" => answer, "email" => email, "moderatorTopic" => moderator_topic},
        socket
      ) do
    {:ok, socket} =
      if answer == "accept" do
        {:ok, _ref} =
          Presence.update(
            socket,
            email,
            &%{&1 | is_presenter: true, is_request_presenting: false}
          )

        "event:" <> id = socket.topic
        add_to_presenters(email, id)
        remove_from_presenting_requests(email, id)
        join_event_stream(socket)
      else
        {:ok, socket}
      end

    %{metas: [%{name: name}]} = Presence.get_by_key(socket, email)

    MembraneLiveWeb.Endpoint.broadcast_from!(self(), moderator_topic, "presenter_answer", %{
      :name => name,
      :answer => answer
    })

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
    case :global.whereis_name(socket.assigns.event_id) do
      :undefined ->
        {:reply, {:ok, false}, socket}

      _pid ->
        {:reply, {:ok, GenServer.call(socket.assigns.event_pid, :is_playlist_playable)}, socket}
    end
  end

  defp webinar_exists(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} ->
        {:ok, Repo.exists?(from(w in Webinar, where: w.uuid == ^id))}

      _error ->
        {:error, "id is not binary_id"}
    end
  end

  defp create_event_stream(event_id, socket) do
    case :global.whereis_name(event_id) do
      :undefined -> Event.start(event_id, name: {:global, event_id})
      pid -> {:ok, pid}
    end
    |> case do
      {:ok, event_pid} ->
        {:ok, Phoenix.Socket.assign(socket, %{event_id: event_id, event_pid: event_pid})}

      {:error, {:already_started, event_pid}} ->
        {:ok, Phoenix.Socket.assign(socket, %{event_id: event_id, event_pid: event_pid})}

      {:error, reason} ->
        Logger.error("""
        Failed to start room.
        Room: #{inspect(event_id)}
        Reason: #{inspect(reason)}
        """)

        {:error, %{reason: "failed to start event"}}
    end
  end

  defp join_event_stream(socket) do
    peer_id = "#{UUID.uuid4()}"
    # TODO handle crash of room?
    Process.monitor(socket.assigns.event_pid)
    send(socket.assigns.event_pid, {:add_peer_channel, self(), peer_id})

    {:ok, Phoenix.Socket.assign(socket, %{peer_id: peer_id})}
  end

  defp check_if_presenter(email, reloaded, id),
    do: check_if_exist_in_ets(:presenters, email, reloaded, id)

  defp check_if_request_presenting(email, reloaded, id),
    do: check_if_exist_in_ets(:presenting_requests, email, reloaded, id)

  defp check_if_exist_in_ets(ets_key, email, reloaded, id) do
    [{_key, presenters}] = :ets.lookup(ets_key, id)
    in_ets = MapSet.member?(presenters, email)

    case {reloaded, in_ets} do
      {true, _in_ets} ->
        {:ok, in_ets}

      {false, true} ->
        remove_from_presenters(email, id)
        {:ok, false}

      {false, false} ->
        {:ok, false}
    end
  end

  defp remove_from_presenters(email, id), do: remove_from_list_in_ets(:presenters, email, id)
  defp add_to_presenters(email, id), do: add_to_list_in_ets(:presenters, email, id)

  defp remove_from_presenting_requests(email, id),
    do: remove_from_list_in_ets(:presenting_requests, email, id)

  defp add_to_presenting_request(email, id),
    do: add_to_list_in_ets(:presenting_requests, email, id)

  defp remove_from_list_in_ets(ets_key, email, id) do
    [{_key, presenters}] = :ets.lookup(ets_key, id)
    :ets.insert(ets_key, {id, MapSet.delete(presenters, email)})
  end

  defp add_to_list_in_ets(ets_key, email, id) do
    [{_key, presenters}] = :ets.lookup(ets_key, id)
    :ets.insert(ets_key, {id, MapSet.put(presenters, email)})
  end
end
