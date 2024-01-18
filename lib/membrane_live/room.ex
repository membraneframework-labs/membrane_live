defmodule MembraneLive.Room do
  @moduledoc false

  use GenServer

  require Logger

  alias Jellyfish
  alias Jellyfish.Peer
  alias Jellyfish.Component.HLS
  alias Jellyfish.Notification.{ComponentCrashed, HlsPlayable, PeerCrashed}

  alias MembraneLive.Chats

  # TODO: find out what value should it be (ms)
  @segment_duration 3000

  @type playlist :: %{
          playlist_idl: String.t(),
          name: String.t(),
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

    client =
      Jellyfish.Client.new(server_address: "localhost:5002", server_api_token: "development")

    {:ok, notifier} =
      Jellyfish.WSNotifier.start(
        server_address: "localhost:5002",
        server_api_token: "development"
      )

    :ok = Jellyfish.WSNotifier.subscribe_server_notifications(notifier)

    {:ok, room, _jellyfish_address} =
      Jellyfish.Room.create(client, video_codec: :h264, room_id: event_id)

    {:ok, hls_component} =
      Jellyfish.Room.add_component(client, room.id, %HLS{
        low_latency: true,
        persistent: true
      })

    {:ok,
     %{
       client: client,
       room: room,
       hls_component: hls_component,
       peer_channels: %{},
       playlist_ready?: false,
       start_time: nil
     }}
  end

  @spec add_peer(pid()) :: {:ok, Peer.id(), Jellyfish.Room.peer_token()} | :error
  def add_peer(room_pid) do
    GenServer.call(room_pid, {:add_peer, self()})
  end

  @spec remove_peer(pid(), Peer.id()) :: :ok
  def remove_peer(room_pid, peer_id) do
    GenServer.call(room_pid, {:remove_peer, peer_id})
  end

  @spec playable_playlist(pid()) :: boolean()
  def playable_playlist(room_pid) do
    GenServer.call(room_pid, :playable_playlist)
  end

  @spec close(pid()) :: :ok
  def close(room_pid) do
    GenServer.cast(room_pid, :close_room)
  end

  @impl true
  def handle_call({:add_peer, peer_channel_pid}, _from, state) do
    Process.monitor(peer_channel_pid)

    {:ok, %Peer{id: peer_id}, peer_token} =
      Jellyfish.Room.add_peer(state.client, state.room.id, Peer.WebRTC)

    if state.peer_channels == %{} do
      Chats.clear_offsets(state.room.id)
      Chats.delete_timestamps(state.room.id)
    end

    state = handle_peer_added(state, peer_id, peer_channel_pid)
    Chats.set_timestamp_presenter(state.room.id)

    {:reply, {:ok, peer_id, peer_token}, state}
  end

  @impl true
  def handle_call({:remove_peer, peer_id}, _from, state) do
    state = handle_peer_left(state, peer_id)
    Jellyfish.Room.delete_peer(state.client, state.room.id, peer_id)

    {:reply, :ok, state}
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

    {:noreply, state}
  end

  def handle_info(
        {:jellyfish, %PeerCrashed{room_id: room_id, peer_id: peer_id}},
        %{room: %{id: room_id}} = state
      ) do
    Logger.error("Peer: #{peer_id}, has crashed!")

    # it weird we shouldn't kill websocket channel we should at maximum remove him from peers
    send(state.peer_channels[peer_id], :endpoint_crashed)

    {:noreply, state}
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

  defp handle_peer_added(state, peer_id, peer_channel_pid) do
    put_in(state, [:peer_channels, peer_id], peer_channel_pid)
  end

  defp handle_peer_left(%{peer_channels: peer_channels} = state, _peer_id)
       when map_size(peer_channels) == 0,
       do: state

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
      start_time: state.start_time
    }
  end

  # TODO: on termination
end
