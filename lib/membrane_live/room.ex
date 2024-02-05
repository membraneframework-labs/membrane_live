defmodule MembraneLive.Room do
  @moduledoc false

  use GenServer

  require Logger

  alias Jellyfish
  alias Jellyfish.Component.HLS
  alias Jellyfish.Peer
  alias Jellyfish.Notification.{ComponentCrashed, HlsPlayable, PeerCrashed, RoomCrashed}

  alias MembraneLive.Chats

  @segment_duration 6_000
  @type playlist_response :: %{
          playlist_ready: boolean(),
          name: String.t(),
          link: String.t(),
          start_time: pos_integer()
        }

  def start(init_arg, opts) do
    GenServer.start(__MODULE__, init_arg, opts)
  end

  def start_link(opts) do
    GenServer.start_link(__MODULE__, [], opts)
  end

  @impl true
  def init(event_id) do
    Logger.info("Spawning room process: #{inspect(self())}")

    client = Jellyfish.Client.new()

    ## TODO: rewrite it to use only one notifier for whole application
    with {:ok, notifier} <- Jellyfish.WSNotifier.start(),
         :ok <- Jellyfish.WSNotifier.subscribe_server_notifications(notifier),
         {:ok, room, jellyfish_address} <-
           Jellyfish.Room.create(client, video_codec: :h264, room_id: event_id),
         {:ok, hls_component} <-
           Jellyfish.Room.add_component(client, room.id, %HLS{
             low_latency: true,
             persistent: true
           }) do
      {:ok,
       %{
         client: client,
         room: room,
         hls_component: hls_component,
         peer_channels: %{},
         playlist_ready?: false,
         start_time: nil,
         jellyfish_address: jellyfish_address
       }}
    else
      {:error, reason} -> {:error, reason}
    end
  end

  @spec add_peer(pid()) :: {:ok, Peer.id(), Jellyfish.Room.peer_token()} | {:error, term()}
  def add_peer(room_pid) do
    GenServer.call(room_pid, {:add_peer, self()})
  end

  @spec remove_peer(pid(), Peer.id()) :: :ok | {:error, term()}
  def remove_peer(room_pid, peer_id) do
    GenServer.call(room_pid, {:remove_peer, peer_id})
  end

  @spec playable_playlist(pid()) :: playlist_response()
  def playable_playlist(room_pid) do
    GenServer.call(room_pid, :playable_playlist)
  end

  @spec close(pid()) :: :ok
  def close(room_pid) do
    GenServer.cast(room_pid, :close_room)
  end

  @impl true
  def handle_call({:add_peer, peer_channel_pid}, _from, state) do
    case Jellyfish.Room.add_peer(state.client, state.room.id, Peer.WebRTC) do
      {:ok, %Peer{id: peer_id}, peer_token} ->
        Process.monitor(peer_channel_pid)

        if state.peer_channels == %{} do
          Chats.clear_offsets(state.room.id)
          Chats.delete_timestamps(state.room.id)
        end

        state = handle_peer_added(state, peer_id, peer_channel_pid)
        Chats.set_timestamp_presenter(state.room.id)

        {:reply, {:ok, peer_id, peer_token}, state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:remove_peer, peer_id}, _from, state) do
    state = handle_peer_left(state, peer_id)

    case Jellyfish.Room.delete_peer(state.client, state.room.id, peer_id) do
      :ok ->
        {:reply, :ok, state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:playable_playlist, _from, state) do
    {:reply, playlist_playable_response(state), state}
  end

  @impl true
  def handle_cast(:close_room, state) do
    :ok = Jellyfish.Room.delete(state.client, state.room.id)

    {:stop, :normal, state}
  end

  def handle_info(
        {:jellyfish, %HlsPlayable{room_id: room_id}},
        %{room: %{id: room_id}} = state
      ) do
    state = handle_playlist_playable(state)

    {:noreply, state}
  end

  def handle_info(
        {:jellyfish, %ComponentCrashed{room_id: room_id, component_id: component_id}},
        %{room: %{id: room_id}, hls_component: %{id: component_id}} = state
      ) do
    Logger.error("HLS component has crashed!")

    new_state = %{state | playlist_ready?: false}
    send_broadcast(new_state)

    {:stop, :normal, state}
  end

  def handle_info(
        {:jellyfish, %PeerCrashed{room_id: room_id, peer_id: peer_id}},
        %{room: %{id: room_id}} = state
      ) do
    Logger.error("Peer: #{peer_id}, has crashed!")

    send(state.peer_channels[peer_id], :endpoint_crashed)

    {:noreply, state}
  end

  def handle_info(
        {:jellyfish, %RoomCrashed{room_id: room_id}},
        %{room: %{id: room_id}} = state
      ) do
    Logger.error("Room: #{room_id}, has crashed!")

    {:stop, :normal, state}
  end

  @impl true
  def handle_info({:jellyfish, _message}, state), do: {:noreply, state}

  @impl true
  def handle_info({:DOWN, _ref, :process, pid, _reason}, state) do
    peer_id =
      state.peer_channels
      |> Enum.find(fn {_peer_id, peer_channel_pid} -> peer_channel_pid == pid end)

    state =
      if peer_id do
        state
      else
        :ok = Jellyfish.Room.delete_peer(state.client, state.room.id, peer_id)
        handle_peer_left(state, peer_id)
      end

    {:noreply, state}
  end

  @impl true
  def terminate(reason, state) do
    if reason != :normal, do: Logger.error("Room terminated with reason: #{inspect(reason)}")

    case Jellyfish.Room.delete(state.client, state.room.id) do
      {:ok, _} ->
        :ok

      {:error, reason} ->
        Logger.error("Error removing room #{state.room.id}, reason: #{reason}")
        {:error, reason}
    end
  end

  defp handle_peer_added(state, peer_id, peer_channel_pid) do
    put_in(state, [:peer_channels, peer_id], peer_channel_pid)
  end

  defp handle_peer_left(state, peer_id) do
    Map.update!(state, :peer_channels, &Map.delete(&1, peer_id))
  end

  defp handle_playlist_playable(state) do
    Chats.set_timestamp_client(state.room.id, @segment_duration)

    start_time = DateTime.utc_now() |> DateTime.add(-@segment_duration, :millisecond)
    state = %{state | start_time: start_time, playlist_ready?: true}
    send_broadcast(state)

    state
  end

  defp send_broadcast(state) do
    MembraneLiveWeb.Endpoint.broadcast!(
      "event:" <> state.room.id,
      "playlistPlayable",
      playlist_playable_response(state)
    )
  end

  defp playlist_playable_response(state) do
    %{
      playlist_ready: state.playlist_ready?,
      name: "Live Stream 🎐",
      link: "http://#{state.jellyfish_address}/hls/#{state.room.id}/index.m3u8",
      start_time: state.start_time
    }
  end
end
