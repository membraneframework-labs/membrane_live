defmodule MembraneLive.Room do
  @moduledoc false

  use GenServer

  require Membrane.Logger
  require Membrane.OpenTelemetry

  alias Membrane.ICE.TURNManager
  alias Membrane.RTC.Engine
  alias Membrane.RTC.Engine.Endpoint.{HLS, WebRTC}
  alias Membrane.RTC.Engine.Endpoint.HLS.{CompositorConfig, HLSConfig, MixerConfig}
  alias Membrane.RTC.Engine.Message
  alias Membrane.Time
  alias Membrane.WebRTC.Extension.{Mid, TWCC}
  alias Membrane.WebRTC.Track
  alias MembraneLive.Chats
  alias MembraneLive.HLS.FileStorage
  alias Phoenix.PubSub

  @terminate_engine_timeout 10_000
  @mix_env Mix.env()

  @type peer_id :: String.t()

  def start(init_arg, opts) do
    GenServer.start(__MODULE__, init_arg, opts)
  end

  def start_link(opts) do
    GenServer.start_link(__MODULE__, [], opts)
  end

  @impl true
  def init(event_id) do
    Membrane.Logger.info("Spawning room process: #{inspect(self())}")

    turn_mock_ip = MembraneLive.get_env!(:integrated_turn_ip)
    turn_ip = if @mix_env == :prod, do: {0, 0, 0, 0}, else: turn_mock_ip

    trace_ctx = Membrane.OpenTelemetry.new_ctx()
    Membrane.OpenTelemetry.attach(trace_ctx)

    span_id = event_span_id(event_id)
    room_span = Membrane.OpenTelemetry.start_span(span_id)
    Membrane.OpenTelemetry.set_attributes(span_id, tracing_metadata())

    rtc_engine_options = [
      id: event_id,
      trace_ctx: trace_ctx,
      parent_span: room_span
    ]

    turn_cert_file =
      case Application.fetch_env(:membrane_live, :integrated_turn_cert_pkey) do
        {:ok, val} -> val
        :error -> nil
      end

    integrated_turn_options = [
      ip: turn_ip,
      mock_ip: turn_mock_ip,
      ports_range: MembraneLive.get_env!(:integrated_turn_port_range),
      cert_file: turn_cert_file
    ]

    network_options = [
      integrated_turn_options: integrated_turn_options,
      integrated_turn_domain: MembraneLive.get_env!(:integrated_turn_domain),
      dtls_pkey: Application.get_env(:membrane_live, :dtls_pkey),
      dtls_cert: Application.get_env(:membrane_live, :dtls_cert)
    ]

    tcp_turn_port = Application.get_env(:membrane_live, :integrated_tcp_turn_port)
    TURNManager.ensure_tcp_turn_launched(integrated_turn_options, port: tcp_turn_port)

    if turn_cert_file do
      tls_turn_port = Application.get_env(:membrane_live, :integrated_tls_turn_port)
      TURNManager.ensure_tls_turn_launched(integrated_turn_options, port: tls_turn_port)
    end

    {:ok, pid} = Membrane.RTC.Engine.start(rtc_engine_options, [])
    Engine.register(pid, self())
    Process.monitor(pid)

    target_segment_duration = Time.seconds(3)

    :ok =
      create_hls_endpoint(pid,
        event_id: event_id,
        target_segment_duration: target_segment_duration
      )

    {:ok,
     %{
       event_id: event_id,
       rtc_engine: pid,
       peer_channels: %{},
       network_options: network_options,
       trace_ctx: trace_ctx,
       playlist_idl: nil,
       second_segment_ready?: false,
       target_segment_duration: Time.as_milliseconds(target_segment_duration),
       start_time: nil
     }}
  end

  @spec add_peer(pid(), peer_id()) :: :ok
  def add_peer(room_pid, peer_id) do
    GenServer.cast(room_pid, {:add_peer, self(), peer_id})
  end

  @spec remove_peer(pid(), peer_id()) :: :ok
  def remove_peer(room_pid, peer_id) do
    GenServer.cast(room_pid, {:remove_peer, self(), peer_id})
  end

  @spec media_event(pid(), peer_id(), any()) :: :ok
  def media_event(room_pid, peer_id, event) do
    GenServer.cast(room_pid, {:media_event, peer_id, event})
  end

  @type playlist :: %{
          playlist_idl: String.t(),
          name: String.t(),
          start_time: pos_integer()
        }

  @spec playable_playlist(pid()) :: playlist()
  def playable_playlist(room_pid) do
    GenServer.call(room_pid, :playable_playlist)
  end

  @spec kill(pid()) :: :ok
  def kill(room_pid) do
    GenServer.cast(room_pid, :close_room)
  end

  @impl true
  def handle_cast({:add_peer, peer_channel_pid, peer_id}, state) do
    if state.peer_channels == %{} do
      Chats.clear_offsets(state.event_id)
      Chats.delete_timestamps(state.event_id)
    end

    state = put_in(state, [:peer_channels, peer_id], peer_channel_pid)
    Process.monitor(peer_channel_pid)

    Membrane.Logger.info("New peer: #{inspect(peer_id)}. Accepting.")
    peer_node = node(peer_channel_pid)

    Chats.set_timestamp_presenter(state.event_id)

    handshake_opts =
      if state.network_options[:dtls_pkey] &&
           state.network_options[:dtls_cert] do
        [
          client_mode: false,
          dtls_srtp: true,
          pkey: state.network_options[:dtls_pkey],
          cert: state.network_options[:dtls_cert]
        ]
      else
        [
          client_mode: false,
          dtls_srtp: true
        ]
      end

    endpoint = %WebRTC{
      rtc_engine: state.rtc_engine,
      ice_name: peer_id,
      owner: self(),
      integrated_turn_options: state.network_options[:integrated_turn_options],
      integrated_turn_domain: state.network_options[:integrated_turn_domain],
      handshake_opts: handshake_opts,
      log_metadata: [peer_id: peer_id],
      trace_context: state.trace_ctx,
      webrtc_extensions: [Mid, TWCC],
      filter_codecs: fn %Track.Encoding{} = encoding ->
        case encoding do
          %{name: "opus"} -> true
          %{name: "H264", format_params: fmtp} -> fmtp.profile_level_id === 0x42E01F
          _unsupported_codec -> false
        end
      end
    }

    :ok = Engine.add_endpoint(state.rtc_engine, endpoint, id: peer_id, node: peer_node)

    {:noreply, state}
  end

  @impl true
  def handle_cast({:remove_peer, _peer_channel_pid, peer_id}, state) do
    {:ok, state} = handle_peer_left(state, peer_id)
    Engine.remove_endpoint(state.rtc_engine, peer_id)
    {:noreply, state}
  end

  @impl true
  def handle_cast({:media_event, peer_id, event}, state) do
    Engine.message_endpoint(state.rtc_engine, peer_id, {:media_event, event})
    {:noreply, state}
  end

  @impl true
  def handle_cast(:close_room, state) do
    result = Engine.terminate(state.rtc_engine, timeout: @terminate_engine_timeout, force?: true)

    if result == {:error, :timeout} do
      Membrane.Logger.warn(
        "[Event: #{state.event_id}] RTC Engine was forced kill. This can cause some problems with playing HLS playlist."
      )
    end

    {:stop, :normal, state}
  end

  @impl true
  def handle_call(:playable_playlist, _from, state) do
    {:reply, stream_response_message(state), state}
  end

  @impl true
  def handle_info(%Message.EndpointMessage{endpoint_id: to, message: {:media_event, data}}, state) do
    if state.peer_channels[to] != nil do
      send(state.peer_channels[to], {:media_event, data})
    end

    {:noreply, state}
  end

  @impl true
  def handle_info(%Message.EndpointCrashed{endpoint_id: "hls_output"}, state) do
    Membrane.Logger.error("HLS endpoint has crashed!")
    new_state = %{state | playlist_idl: nil, second_segment_ready?: false}
    send_broadcast(new_state)
    Process.send_after(self(), :recreate_hls, 3000)
    {:noreply, new_state}
  end

  def handle_info(
        :recreate_hls,
        %{
          event_id: event_id,
          rtc_engine: rtc_engine,
          target_segment_duration: target_segment_duration
        } = state
      ) do
    Membrane.Logger.error("Restarting HLS Endpoint!")

    Chats.clear_offsets(state.event_id)
    Chats.delete_timestamps(state.event_id)
    Chats.set_timestamp_presenter(event_id)

    :ok =
      create_hls_endpoint(rtc_engine,
        event_id: event_id,
        target_segment_duration: Time.milliseconds(target_segment_duration)
      )

    {:noreply, state}
  end

  @impl true
  def handle_info(%Message.EndpointCrashed{endpoint_id: endpoint_id}, state) do
    Membrane.Logger.error("Endpoint #{inspect(endpoint_id)} has crashed!")

    case state.peer_channels[endpoint_id] do
      nil ->
        Membrane.Logger.error("Endpoint crashed handling error: This peer doesn't exist already!")

      peer_channel ->
        send(peer_channel, :endpoint_crashed)
    end

    {:noreply, state}
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, pid, _reason}, state) do
    result =
      state.peer_channels
      |> Enum.find(fn {_peer_id, peer_channel_pid} -> peer_channel_pid == pid end)

    cond do
      pid == state.rtc_engine ->
        state.event_id
        |> event_span_id()
        |> Membrane.OpenTelemetry.end_span()

        {:stop, :normal, state}

      is_nil(result) ->
        {:noreply, state}

      true ->
        {peer_id, _peer_channel_pid} = result
        Engine.remove_endpoint(state.rtc_engine, peer_id)
        {:ok, state} = handle_peer_left(state, peer_id)

        {:noreply, state}
    end
  end

  @impl true
  def handle_info({:playlist_playable, :audio, _playlist_idl}, state), do: {:noreply, state}

  def handle_info({:playlist_playable, :video, _playlist_idl}, state) do
    state = %{state | playlist_idl: Path.join(state.event_id, "")}
    state = if state.second_segment_ready?, do: handle_playlist_playable(state), else: state

    {:noreply, state}
  end

  def handle_info(:second_segment_ready, state) do
    PubSub.unsubscribe(MembraneLive.PubSub, state.event_id)
    state = %{state | second_segment_ready?: true}
    state = if state.playlist_idl, do: handle_playlist_playable(state), else: state

    {:noreply, state}
  end

  @impl true
  def handle_info({:cleanup, _clean_function, _playlist_idl}, state) do
    {:noreply, state}
  end

  defp create_hls_endpoint(rtc_engine,
         event_id: event_id,
         target_segment_duration: target_segment_duration
       ) do
    endpoint = %HLS{
      rtc_engine: rtc_engine,
      owner: self(),
      output_directory: "output/#{event_id}",
      mixer_config: %MixerConfig{
        video: %CompositorConfig{
          stream_format: %Membrane.RawVideo{
            width: 1920,
            height: 1080,
            pixel_format: :I420,
            framerate: {24, 1},
            aligned: true
          }
        }
      },
      hls_config: %HLSConfig{
        hls_mode: :muxed_av,
        mode: :live,
        target_window_duration: :infinity,
        storage: fn directory ->
          %FileStorage.Config{directory: directory} |> FileStorage.init()
        end,
        segment_duration: target_segment_duration,
        partial_segment_duration: Time.milliseconds(400)
      }
    }

    Engine.add_endpoint(rtc_engine, endpoint, id: "hls_output")
    PubSub.subscribe(MembraneLive.PubSub, event_id)
  end

  defp handle_playlist_playable(
         %{event_id: event_id, target_segment_duration: segment_duration} = state
       ) do
    Chats.set_timestamp_client(event_id, segment_duration)

    state = %{
      state
      | start_time: DateTime.utc_now() |> DateTime.add(-segment_duration, :millisecond)
    }

    send_broadcast(state)
  end

  defp tracing_metadata(),
    do: [
      {:"library.language", :erlang},
      {:"library.name", :membrane_rtc_engine},
      {:"library.version", "server:#{Application.spec(:membrane_rtc_engine, :vsn)}"}
    ]

  defp event_span_id(id), do: "event:#{id}"

  defp handle_peer_left(%{peer_channels: peer_channels} = state, _peer_id)
       when map_size(peer_channels) == 0,
       do: {:ok, state}

  defp handle_peer_left(state, peer_id) do
    state = Map.update!(state, :peer_channels, &Map.delete(&1, peer_id))

    {:ok, state}
  end

  defp send_broadcast(state) do
    message = stream_response_message(state)

    MembraneLiveWeb.Endpoint.broadcast!(
      "event:" <> state.event_id,
      "playlistPlayable",
      message
    )

    state
  end

  defp stream_response_message(state) do
    start_stream_message = %{
      playlist_idl: state.playlist_idl,
      name: "Live Stream 🎐",
      start_time: state.start_time
    }

    stop_stream_message = %{playlist_idl: "", name: "", start_time: state.start_time}

    if is_nil(state.playlist_idl),
      do: stop_stream_message,
      else: start_stream_message
  end
end
