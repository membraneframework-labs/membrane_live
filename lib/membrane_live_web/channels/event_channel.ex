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
    case Ecto.UUID.cast(id) do
      {:ok, id} ->
        case Repo.exists?(from(w in Webinar, where: w.uuid == ^id)) do
          false ->
            {:error, %{reason: "This event doesn't exists."}}

          true ->
            :ets.insert_new(:presenters, {id, []})

            with {:ok, %{"user_id" => uuid}} <- Tokens.auth_decode(token),
                 {:ok, name} <- Accounts.get_username(uuid),
                 [] <- Presence.get_by_key(socket, name),
                 {:ok, socket} <- create_event_stream(id, socket),
                 {:ok, is_presenter} = check_if_presenter(name, reloaded, id),
                 is_moderator <- Webinars.check_is_user_moderator(uuid, id) do
              {:ok, socket} = if is_presenter, do: join_event_stream(socket), else: {:ok, socket}

              {:ok, _ref} =
                Presence.track(socket, name, %{
                  is_moderator: is_moderator,
                  is_presenter: is_presenter
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
        end

      :error ->
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

  defp check_if_presenter(name, reloaded, id) do
    [{_key, presenters}] = :ets.lookup(:presenters, id)
    in_ets = if Enum.find(presenters, &(&1 == name)) != nil, do: true, else: false

    case reloaded do
      true ->
        {:ok, in_ets}

      false ->
        if in_ets, do: remove_from_presenters(name, id)
        {:ok, false}
    end
  end

  defp remove_from_presenters(name, id) do
    [{_key, presenters}] = :ets.lookup(:presenters, id)
    :ets.insert(:presenters, {id, Enum.reject(presenters, &(&1 == name))})
  end

  defp add_to_presenters(name, id) do
    [{_key, presenters}] = :ets.lookup(:presenters, id)
    :ets.insert(:presenters, {id, [name, presenters]})
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
  def handle_in("presenter_remove", %{"presenter" => presenter}, socket) do
    {:ok, _ref} =
      Presence.update(socket, presenter, fn map -> Map.put(map, :is_presenter, false) end)

    "event:" <> id = socket.topic
    remove_from_presenters(presenter, id)
    {:noreply, socket}
  end

  def handle_in("presenter_remove", %{"presenter_topic" => presenter_topic}, socket) do
    props = Presence.get_by_key(socket, List.last(String.split(presenter_topic, ":")))

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

  def handle_in("presenter_prop", %{"moderator" => moderator, "presenter" => presenter}, socket) do
    MembraneLiveWeb.Endpoint.broadcast_from!(self(), presenter, "presenter_prop", %{
      :moderator => moderator
    })

    {:noreply, socket}
  end

  def handle_in(
        "presenter_answer",
        %{"answer" => answer, "name" => name, "moderator" => moderator},
        socket
      ) do
    {:ok, socket} =
      if answer == "accept" do
        {:ok, _ref} =
          Presence.update(socket, name, fn map -> Map.put(map, :is_presenter, true) end)

        "event:" <> id = socket.topic
        add_to_presenters(name, id)
        join_event_stream(socket)
      else
        {:ok, socket}
      end

    MembraneLiveWeb.Endpoint.broadcast_from!(self(), moderator, "presenter_answer", %{
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
    case :global.whereis_name(socket.assigns.event_id) do
      :undefined ->
        {:reply, {:ok, false}, socket}

      _pid ->
        {:reply, {:ok, GenServer.call(socket.assigns.event_pid, :is_playlist_playable)}, socket}
    end
  end
end
