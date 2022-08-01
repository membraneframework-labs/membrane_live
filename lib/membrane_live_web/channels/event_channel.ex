defmodule MembraneLiveWeb.EventChannel do
  @moduledoc """
  Channel for communicating in each event.
  """
  use Phoenix.Channel

  import Ecto.Query, only: [from: 2]

  require Logger

  alias MembraneLive.Event
  alias MembraneLive.Repo
  alias MembraneLive.Webinars.Webinar
  alias MembraneLiveWeb.Presence

  @impl true
  def join("event:" <> id, %{"name" => name}, socket) do
    case Repo.exists?(from(w in Webinar, where: w.uuid == ^id)) do
      false ->
        {:error, %{reason: "This event doesn't exists."}}

      true ->
        viewer_data = Presence.get_by_key(socket, name)

        case viewer_data do
          [] ->
            send(self(), {:after_join, name, id})
            join_event_stream(id, socket)

          _viewer_exists ->
            {:error, %{reason: "Viewer with this name already exists."}}
        end
    end
  rescue
    Ecto.Query.CastError -> {:error, %{reason: "This link is wrong."}}
  end

  @impl true
  def join("private:" <> _subtopic, _data, socket) do
    {:ok, socket}
  end

  @impl true
  def join(_topic, _params, _socket) do
    {:error, %{reason: "This link is wrong."}}
  end

  def join_event_stream(event_id, socket) do
    case :global.whereis_name(event_id) do
      :undefined -> Event.start(event_id, name: {:global, event_id})
      pid -> {:ok, pid}
    end
    |> case do
      {:ok, event_pid} ->
        do_join(socket, event_pid, event_id)

      {:error, {:already_started, event_pid}} ->
        do_join(socket, event_pid, event_id)

      {:error, reason} ->
        Logger.error("""
        Failed to start room.
        Room: #{inspect(event_id)}
        Reason: #{inspect(reason)}
        """)

        {:error, %{reason: "failed to start event"}}
    end
  end

  def handle_info({:after_join, name, _event_id}, socket) do
    Presence.track(socket, name, %{})
    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
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

  defp do_join(socket, event_pid, event_id) do
    peer_id = "#{UUID.uuid4()}"
    # TODO handle crash of room?
    Process.monitor(event_pid)
    send(event_pid, {:add_peer_channel, self(), peer_id})

    {:ok,
     Phoenix.Socket.assign(socket, %{event_id: event_id, event_pid: event_pid, peer_id: peer_id})}
  end

  # removing works in 4 stages: moderator (chooses presenter to remove and sends message) ->
  # server (sends information to presenter) -> presenter (shows alert that it's been removed
  # and sends message back) -> server (updates presenter in Presence)
  # such design is caused by user Presence that can be updated only with its socket-channel combination
  # (socket parameter in function below)
  def handle_in("presenter_remove", %{"presenter" => presenter}, socket) do
    {:ok, _ref} =
      Presence.update(socket, presenter, fn map -> Map.put(map, "is_presenter", false) end)

    {:noreply, socket}
  end

  def handle_in("presenter_remove", %{"presenter_topic" => presenter_topic}, socket) do
    props = Presence.get_by_key(socket, List.last(String.split(presenter_topic, ":")))

    case props do
      %{metas: [%{"is_presenter" => true}]} ->
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
    if answer == "accept" do
      {:ok, _ref} =
        Presence.update(socket, name, fn map -> Map.put(map, "is_presenter", true) end)
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
end
