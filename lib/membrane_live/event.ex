defmodule MembraneLive.Event do
  @moduledoc false

  use GenServer

  require Membrane.Logger
  require Membrane.OpenTelemetry

  alias Membrane.HTTPAdaptiveStream.Sink.SegmentDuration
  alias Membrane.ICE.TURNManager
  alias Membrane.RTC.Engine
  alias Membrane.RTC.Engine.Endpoint.{HLS, WebRTC}
  alias Membrane.RTC.Engine.Endpoint.HLS.{AudioMixerConfig, CompositorConfig}
  alias Membrane.RTC.Engine.MediaEvent
  alias Membrane.RTC.Engine.Message
  alias Membrane.Time
  alias Membrane.WebRTC.Extension.{Mid, TWCC}
  alias MembraneLive.Event.Timer
  alias MembraneLive.Webinars

  @mix_env Mix.env()

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

    target_segment_duration = Time.seconds(5)

    endpoint = %HLS{
      rtc_engine: pid,
      owner: self(),
      output_directory: "output/#{event_id}",
      target_window_duration: :infinity,
      segment_duration: SegmentDuration.new(Time.seconds(4), target_segment_duration),
      mixer_config: %{audio: %AudioMixerConfig{}, video: %CompositorConfig{}},
      hls_mode: :muxed_av
    }

    :ok = Engine.add_endpoint(pid, endpoint)

    {:ok,
     %{
       event_id: event_id,
       rtc_engine: pid,
       peer_channels: %{},
       network_options: network_options,
       trace_ctx: trace_ctx,
       moderator_pid: nil,
       playlist_idl: nil,
       is_playlist_playable?: false,
       timer: Timer.create(self()),
       target_segment_duration: Time.as_milliseconds(target_segment_duration),
       start_time: nil
     }}
  end

  @impl true
  def handle_info({:add_peer_channel, peer_channel_pid, peer_id}, state) do
    state = put_in(state, [:peer_channels, peer_id], peer_channel_pid)
    Process.monitor(peer_channel_pid)
    {:noreply, state}
  end

  @impl true
  def handle_info(%Message.MediaEvent{to: :broadcast, data: data}, state) do
    for {_peer_id, pid} <- state.peer_channels, do: send(pid, {:media_event, data})

    {:noreply, state}
  end

  @impl true
  def handle_info(%Message.MediaEvent{to: to, data: data}, state) do
    if state.peer_channels[to] != nil do
      send(state.peer_channels[to], {:media_event, data})
    end

    {:noreply, state}
  end

  @impl true
  def handle_info(%Message.NewPeer{rtc_engine: rtc_engine, peer: peer}, state) do
    Membrane.Logger.info("New peer: #{inspect(peer)}. Accepting.")
    peer_channel_pid = Map.get(state.peer_channels, peer.id)
    peer_node = node(peer_channel_pid)

    :ets.insert_new(:start_timestamps, {state.event_id, System.monotonic_time(:millisecond)})

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
      rtc_engine: rtc_engine,
      ice_name: peer.id,
      owner: self(),
      integrated_turn_options: state.network_options[:integrated_turn_options],
      integrated_turn_domain: state.network_options[:integrated_turn_domain],
      handshake_opts: handshake_opts,
      log_metadata: [peer_id: peer.id],
      trace_context: state.trace_ctx,
      webrtc_extensions: [Mid, TWCC],
      peer_metadata: peer.metadata,
      filter_codecs: fn {rtp, fmtp} ->
        case rtp.encoding do
          "opus" -> true
          "H264" -> fmtp.profile_level_id === 0x42E01F
          _unsupported_codec -> false
        end
      end
    }

    Engine.accept_peer(rtc_engine, peer.id)
    :ok = Engine.add_endpoint(rtc_engine, endpoint, peer_id: peer.id, node: peer_node)

    {:noreply, state}
  end

  @impl true
  def handle_info(%Message.PeerLeft{peer: peer}, state) do
    Membrane.Logger.info("Peer #{inspect(peer.id)} left RTC Engine")

    {:ok, state} = handle_peer_left(state, peer.id)
    {:noreply, state}
  end

  @impl true
  def handle_info(%Message.EndpointCrashed{endpoint_id: endpoint_id}, state) do
    Membrane.Logger.error("Endpoint #{inspect(endpoint_id)} has crashed!")

    case state.peer_channels[endpoint_id] do
      nil ->
        Membrane.Logger.error("Endpoint crashed handling error: This peer doesn't exist already!")
        {:noreply, state}

      peer_channel ->
        error_message = "Endpoint has crashed."

        data =
          error_message
          |> MediaEvent.create_error_event()
          |> MediaEvent.encode()

        send(peer_channel, {:media_event, data})
        {:noreply, state}
    end
  end

  # media_event coming from client
  @impl true
  def handle_info({:media_event, _from, _event} = msg, state) do
    Engine.receive_media_event(state.rtc_engine, msg)
    {:noreply, state}
  end

  @impl true
  def handle_info({:moderator, moderator_pid}, state) do
    Process.monitor(moderator_pid)
    {:noreply, %{state | moderator_pid: moderator_pid}}
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

      pid == state.moderator_pid ->
        state = %{state | moderator_pid: nil}
        {:ok, state} = handle_peer_left(state, pid)
        Engine.remove_peer(state.rtc_engine, pid)
        {:noreply, state}

      is_nil(result) ->
        {:noreply, state}

      true ->
        {peer_id, _peer_channel_id} = result
        {:ok, state} = handle_peer_left(state, peer_id)

        Engine.remove_peer(state.rtc_engine, peer_id)
        {:noreply, state}
    end
  end

  @impl true
  def handle_info({:playlist_playable, :audio, _playlist_idl}, state) do
    {:noreply, state}
  end

  @impl true
  def handle_info({:playlist_playable, :video, playlist_idl}, state) do
    state = %{state | playlist_idl: Path.join(state.event_id, playlist_idl)}

    :ets.insert_new(
      :client_start_timestamps,
      {state.event_id, System.monotonic_time(:millisecond) + state.target_segment_duration}
    )

    state = %{
      state
      | start_time:
          DateTime.utc_now() |> DateTime.add(state.target_segment_duration, :millisecond)
    }

    send_broadcast(state)
    {:noreply, state}
  end

  @impl true
  def handle_info({:cleanup, _clean_function, _playlist_idl}, state) do
    {:noreply, state}
  end

  def handle_info({:timer_action, action}, %{timer: timer} = state) do
    case Timer.handle_action(timer, action,
           timeout: MembraneLive.get_env!(:last_peer_timeout_long_ms)
         ) do
      {:ok, timer} ->
        {:noreply, %{state | timer: timer}}

      {:timeout, _timer} ->
        close_webinar(state)
    end
  end

  def handle_info({:timer_timeout, action}, %{timer: timer} = state) do
    case action do
      :notify ->
        timeout = MembraneLive.get_env!(:last_peer_timeout_short_ms)

        {:ok, timer} = Timer.handle_action(timer, :start_kill, timeout: timeout)

        MembraneLiveWeb.Endpoint.broadcast!("event:" <> state.event_id, "last_viewer_active", %{
          timeout: timeout
        })

        {:noreply, %{state | timer: timer}}

      :kill ->
        close_webinar(state)
    end
  end

  defp close_webinar(state) do
    # no logic for reseting chat messages offset on stream end
    # as it should not be necessary in the future
    MembraneLiveWeb.Endpoint.broadcast!("event:" <> state.event_id, "finish_event", %{})
    Webinars.mark_webinar_as_finished(state.event_id)

    {:stop, :normal, state}
  end

  @impl true
  def handle_call(:is_playlist_playable, _from, state) do
    {:reply, stream_response_message(state), state}
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
    state =
      state
      |> Map.update!(:peer_channels, &Map.delete(&1, peer_id))
      |> send_broadcast()

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

    stop_stream_message = %{playlist_idl: "", name: "", start_time: nil}

    if is_nil(state.playlist_idl) or map_size(state.peer_channels) == 0,
      do: stop_stream_message,
      else: start_stream_message
  end
end
