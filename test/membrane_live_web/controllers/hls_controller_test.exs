defmodule MembraneLiveWeb.HLSControllerTest do
  use MembraneLiveWeb.ConnCase

  alias MembraneLive.HLS.FileStorage
  alias Phoenix.PubSub

  @event_id "test_be7-25fc-439b-95bc-84faddebce49"
  @hls_filename_without_extension "htekj8180qyh"
  @hls_output_path "output/#{@event_id}" |> Path.expand()
  @playlist_path Path.join(@hls_output_path, "#{@hls_filename_without_extension}.m3u8")
  @mock_file_size 1000
  @storage %FileStorage{directory: "output/#{@event_id}"}

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
      add_partial_to_playlist(segment, partial)

      assert_receive({:manifest_update, ^segment, ^partial})
      pubsub_unsubscribe()

      conn = Task.await(get_task)
      assert response(conn, 200)
    end

    test "new partial segment", %{conn: conn} do
      {segment, partial} = {0, 5}
      {offset, length} = get_partial_offset_length(partial)

      0..(partial - 1) |> Enum.each(&store_partial_segment(0, &1))

      get_task = Task.async(fn -> get_partial_segment(conn, segment, partial) end)

      pubsub_subscribe()
      store_partial_segment(segment, partial)

      assert_receive({:segment_update, {^segment, ^partial}, {^offset, ^length}}, 1000)
      pubsub_unsubscribe()

      conn = Task.await(get_task)
      assert response(conn, 200)
      assert conn.resp_body == partial_segment_content(segment, partial)
    end
  end

  defp pubsub_subscribe(),
    do: PubSub.subscribe(MembraneLive.PubSub, @hls_filename_without_extension)

  defp pubsub_unsubscribe(),
    do: PubSub.unsubscribe(MembraneLive.PubSub, @hls_filename_without_extension)

  defp get_partial_playlist(conn, segment, partial) do
    get(
      conn,
      "/video/#{@event_id}/#{@hls_filename_without_extension}.m3u8?_HLS_msn=#{segment}&_HLS_part=#{partial}"
    )
  end

  defp get_partial_segment(conn, segment, partial) do
    {offset, length} = get_partial_offset_length(partial)

    conn
    |> put_req_header("range", "bytes=#{offset}-#{offset + length - 1}")
    |> get("/video/#{@event_id}/muxed_segment_#{segment}_#{@hls_filename_without_extension}.m4s")
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
    #EXT-X-MAP:URI="muxed_header_#{@hls_filename_without_extension}_part_0.mp4"
    """
    |> then(&File.write!(@playlist_path, &1))
  end

  defp add_partial_to_playlist(segment, partial) do
    independent = if partial == 1, do: ",INDEPENDENT=YES", else: ""
    {offset, length} = get_partial_offset_length(partial)

    (File.read!(@playlist_path) <>
       """
       #EXT-X-PART:DURATION=0.54816111,URI="muxed_segment_#{segment}_#{@hls_filename_without_extension}.m4s",BYTERANGE="#{length}@#{offset}"#{independent}
       """)
    |> then(
      &FileStorage.store(
        nil,
        "#{@hls_filename_without_extension}.m3u8",
        &1,
        %{},
        %{mode: :text},
        @storage
      )
    )
  end

  defp store_partial_segment(segment, partial) do
    filename = "muxed_segment_#{segment}_#{@hls_filename_without_extension}.m4s"
    content = partial_segment_content(segment, partial)
    {offset, _length} = get_partial_offset_length(partial)

    FileStorage.store(nil, filename, content, %{byte_offset: offset}, %{mode: :binary}, @storage)
    add_partial_to_playlist(segment, partial)
  end

  defp partial_segment_content(segment, partial) do
    text = "partial_segment_#{segment}_#{partial}"
    text <> String.duplicate("_", @mock_file_size - byte_size(text))
  end

  defp get_partial_offset_length(partial) do
    {partial * @mock_file_size, @mock_file_size}
  end
end
