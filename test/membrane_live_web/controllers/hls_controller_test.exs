defmodule MembraneLiveWeb.HLSControllerTest do
  use MembraneLiveWeb.ConnCase

  alias MembraneLive.HLS.FileStorage
  alias Phoenix.PubSub

  @event_id "test_be7-25fc-439b-95bc-84faddebce49"
  @muxed_track_name "htekj8180qyh"
  @hls_output_path "output/#{@event_id}" |> Path.expand()
  @playlist_path Path.join(@hls_output_path, "#{@muxed_track_name}.m3u8")
  @mock_file_size 1000
  @storage %FileStorage{directory: "output/#{@event_id}"}
  @mock_storage_latency_ms 50
  @response_await_timeout_ms 1000

  setup do
    File.mkdir_p!(@hls_output_path)
    create_playlist()

    on_exit(fn -> File.rm_rf!(@hls_output_path) end)
  end

  describe "ll-hls partials" do
    test "playlist update", %{conn: conn} do
      {segment, partial} = {0, 0}
      get_task = Task.async(fn -> get_partial_playlist(conn, segment, partial) end)

      pubsub_subscribe()

      Process.sleep(@mock_storage_latency_ms)
      add_segment_to_playlist(segment, partial)

      assert_receive({:manifest_update_partial, ^segment, ^partial})
      pubsub_unsubscribe()

      conn = Task.await(get_task, @response_await_timeout_ms)
      assert response(conn, 200)
    end

    test "new partial segment", %{conn: conn} do
      {segment, partial} = {0, 5}
      {offset, length} = get_partial_offset_length(partial)

      0..(partial - 1) |> Enum.each(&store_partial_segment(0, &1))

      get_task = Task.async(fn -> get_partial_segment(conn, segment, partial) end)

      pubsub_subscribe()

      Process.sleep(@mock_storage_latency_ms)
      store_partial_segment(segment, partial)

      assert_receive({:segment_update, {^segment, ^partial}, {^offset, ^length}}, 1000)
      pubsub_unsubscribe()

      conn = Task.await(get_task, @response_await_timeout_ms)
      assert response(conn, 200)
      assert conn.resp_body == segment_content(segment, partial)
    end
  end

  describe "serve different playlist depending on the User-Agent" do
    test "safari desktop", %{conn: conn} do
      test_user_agent(
        conn,
        :ll_hls,
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15"
      )
    end

    test "chrome desktop", %{conn: conn} do
      test_user_agent(
        conn,
        :ll_hls,
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
      )
    end

    test "iOS", %{conn: conn} do
      test_user_agent(
        conn,
        :hls,
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Mobile/15E148 Safari/604.1"
      )
    end
  end

  defp test_user_agent(conn, expected_playlist, user_agent) do
    segment_no = 2
    partials_per_segment = 9

    0..(segment_no - 1)
    |> Enum.each(fn segment ->
      0..(partials_per_segment - 1)
      |> Enum.each(fn partial -> store_partial_segment(segment, partial) end)

      add_segment_to_playlist(segment)
    end)

    conn =
      conn
      |> put_req_header("user-agent", user_agent)
      |> get("/video/#{@event_id}/#{@muxed_track_name}.m3u8")

    assert conn.resp_body == playlist(expected_playlist, segment_no)
  end

  defp pubsub_subscribe(),
    do: PubSub.subscribe(MembraneLive.PubSub, @muxed_track_name)

  defp pubsub_unsubscribe(),
    do: PubSub.unsubscribe(MembraneLive.PubSub, @muxed_track_name)

  defp get_partial_playlist(conn, segment, partial) do
    get(
      conn,
      "/video/#{@event_id}/#{@muxed_track_name}.m3u8?_HLS_msn=#{segment}&_HLS_part=#{partial}"
    )
  end

  defp get_partial_segment(conn, segment, partial) do
    {offset, length} = get_partial_offset_length(partial)

    conn
    |> put_req_header("range", "bytes=#{offset}-#{offset + length - 1}")
    |> get("/video/#{@event_id}/muxed_segment_#{segment}_#{@muxed_track_name}.m4s")
  end

  defp create_playlist() do
    """
    #EXTM3U
    #EXT-X-VERSION:7
    #EXT-X-TARGETDURATION:6
    #EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,PART-HOLD-BACK=1.102
    #EXT-X-PART-INF:PART-TARGET=0.551
    #EXT-X-MEDIA-SEQUENCE:0
    #EXT-X-DISCONTINUITY-SEQUENCE:0
    #EXT-X-MAP:URI="muxed_header_#{@muxed_track_name}_part_0.mp4"
    """
    |> then(&File.write!(@playlist_path, &1))
  end

  defp playlist(:ll_hls, _segments), do: File.read!(@playlist_path)

  defp playlist(:hls, segment_no) do
    segments =
      0..(segment_no - 1)
      |> Enum.map_join(fn segment -> segment_tag(segment) end)

    """
    #EXTM3U
    #EXT-X-VERSION:7
    #EXT-X-TARGETDURATION:6
    #EXT-X-MEDIA-SEQUENCE:0
    #EXT-X-DISCONTINUITY-SEQUENCE:0
    #EXT-X-MAP:URI="muxed_header_#{@muxed_track_name}_part_0.mp4"
    """ <> segments
  end

  defp add_segment_to_playlist(segment, partial \\ nil) do
    (File.read!(@playlist_path) <> segment_tag(segment, partial))
    |> then(
      &FileStorage.store(
        nil,
        "#{@muxed_track_name}.m3u8",
        &1,
        %{},
        %{mode: :text},
        @storage
      )
    )
  end

  defp segment_tag(segment, partial \\ nil)

  defp segment_tag(segment, nil) do
    """
    #EXT-X-PROGRAM-DATE-TIME:2023-01-02T20:27:16.956Z
    #EXTINF:4.995999996,
    muxed_segment_#{segment}_#{@muxed_track_name}.m4s
    """
  end

  defp segment_tag(segment, partial) do
    independent = if partial == 1, do: ",INDEPENDENT=YES", else: ""
    {offset, length} = get_partial_offset_length(partial)

    """
    #EXT-X-PART:DURATION=0.54816111,URI="muxed_segment_#{segment}_#{@muxed_track_name}.m4s",BYTERANGE="#{length}@#{offset}"#{independent}
    """
  end

  defp store_partial_segment(segment, partial) do
    filename = "muxed_segment_#{segment}_#{@muxed_track_name}.m4s"
    content = segment_content(segment, partial)
    {offset, _length} = get_partial_offset_length(partial)

    FileStorage.store(
      nil,
      filename,
      content,
      %{byte_offset: offset},
      %{mode: :binary},
      @storage
    )

    add_segment_to_playlist(segment, partial)
  end

  defp segment_content(segment, partial) do
    text = "segment_#{segment}_#{partial}"
    text <> String.duplicate("_", @mock_file_size - byte_size(text))
  end

  defp get_partial_offset_length(partial) do
    {partial * @mock_file_size, @mock_file_size}
  end
end
