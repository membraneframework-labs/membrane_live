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
  alias Phoenix.Socket

  @impl true
  def join("event:" <> id, %{"token" => token, "reloaded" => reloaded}, socket) do
    case webinar_exists(id) do
      {:ok, false} ->
        {:error, %{reason: "This event doesn't exists."}}

      {:ok, true} ->
        :ets.insert_new(:presenters, {id, MapSet.new()})

        with {:ok, %{"user_id" => uuid}} <- Tokens.auth_decode(token),
             {:ok, name} <- Accounts.get_username(uuid),
             {:ok, email} <- Accounts.get_email(uuid),
             is_moderator <- Webinars.check_is_user_moderator(uuid, id),
             [] <- Presence.get_by_key(socket, email),
             {:ok, socket} <- create_event(id, socket, is_moderator),
             {:ok, is_presenter} <- check_if_presenter(email, reloaded, id) do
          {:ok, socket} = if is_presenter, do: join_event(socket), else: {:ok, socket}

          {:ok, _ref} =
            Presence.track(socket, email, %{
              name: name,
              is_moderator: is_moderator,
              is_presenter: is_presenter
            })

          if is_moderator, do: send(socket.assigns.event_pid, {:moderator, self()})

          {:ok, %{is_moderator: is_moderator},
           Socket.assign(socket, %{is_moderator: is_moderator, event_id: id})}
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

  defp webinar_exists(id) do
    case Ecto.UUID.cast(id) do
      {:ok, id} ->
        {:ok, Repo.exists?(from(w in Webinar, where: w.uuid == ^id))}

      _error ->
        {:error, "id is not binary_id"}
    end
  end

  defp create_event(event_id, socket, is_moderator) do
    case :global.whereis_name(event_id) do
      :undefined ->
        if is_moderator,
          do: Event.start(event_id, name: {:global, event_id}),
          else: {:error, :non_moderator}

      pid ->
        {:ok, pid}
    end
    |> case do
      {:ok, event_pid} ->
        Process.monitor(event_pid)
        {:ok, Socket.assign(socket, %{event_pid: event_pid})}

      {:error, {:already_started, event_pid}} ->
        Process.monitor(event_pid)
        {:ok, Socket.assign(socket, %{event_pid: event_pid})}

      {:error, :non_moderator} ->
        {:ok, Socket.assign(socket, %{event_pid: nil})}

      {:error, reason} ->
        Logger.error("""
        Failed to start room.
        Room: #{inspect(event_id)}
        Reason: #{inspect(reason)}
        """)

        {:error, %{reason: "failed to start event"}}
    end
  end

  defp get_event_pid(socket) do
    case :global.whereis_name(socket.assigns.event_id) do
      :undefined -> socket
      pid -> Socket.assign(socket, %{event_pid: pid})
    end
  end

  defp join_event(socket) do
    socket = get_event_pid(socket)

    if is_nil(socket.assigns.event_pid),
      do: raise("Event was not started before first joining attempt")

    peer_id = "#{UUID.uuid4()}"

    send(socket.assigns.event_pid, {:add_peer_channel, self(), peer_id})

    {:ok, Socket.assign(socket, %{peer_id: peer_id})}
  end

  defp check_if_presenter(email, reloaded, id) do
    [{_key, presenters}] = :ets.lookup(:presenters, id)
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

  defp remove_from_presenters(email, id) do
    [{_key, presenters}] = :ets.lookup(:presenters, id)
    :ets.insert(:presenters, {id, MapSet.delete(presenters, email)})
  end

  defp add_to_presenters(email, id) do
    [{_key, presenters}] = :ets.lookup(:presenters, id)
    :ets.insert(:presenters, {id, MapSet.put(presenters, email)})
  end

  @impl true
  def handle_info(
        {:DOWN, _ref, :process, from, _reason},
        socket
      ) do
    if from == socket.assigns.event_pid do
      # sometimes, when server recieves 2 join requests from the same peer in quick succession
      # the Event and engine processes from the first join finish after second join has already happened
      # in this case the new moderator channel process will recieve :DOWN from the older Event process
      # it must restart the Event in that case
      {:ok, socket} = create_event(socket.assigns.event_id, socket, socket.assigns.is_moderator)
      {:noreply, socket}
    else
      {:stop, :normal, socket}
    end
  end

  @impl true
  def handle_info({:media_event, event}, socket) do
    push(socket, "mediaEvent", %{data: event})

    {:noreply, socket}
  end

  def handle_in("finish_event", %{}, socket) do
    "event:" <> uuid = socket.topic
    Webinars.mark_webinar_as_finished(uuid)

    broadcast!(socket, "finish_event", %{})
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
        {:ok, _ref} = Presence.update(socket, email, &Map.put(&1, :is_presenter, true))

        "event:" <> id = socket.topic
        add_to_presenters(email, id)
        join_event(socket)
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

  @impl true
  def handle_in("mediaEvent", %{"data" => event}, socket) do
    send(socket.assigns.event_pid, {:media_event, socket.assigns.peer_id, event})
    {:noreply, socket}
  end

  @impl true
  def handle_in("isPlaylistPlayable", _data, socket) do
    socket = get_event_pid(socket)

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
end
