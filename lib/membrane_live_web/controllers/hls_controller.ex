defmodule MembraneLiveWeb.HLSController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.HLS.Helpers
  alias Phoenix.PubSub
  alias Plug.Conn

  @ets_key :partial_segments
  @partial_update_timeout_ms 1000
  @manifest_update_timeout_ms 1000

  @spec index(Conn.t(), map) :: Conn.t()
  def index(
        conn,
        %{
          "event_id" => event_id,
          "filename" => filename,
          "_HLS_msn" => segment,
          "_HLS_part" => partial
        } = params
      ) do
    prefix = Path.join(event_id, Map.get(params, "stream_id", ""))
    segment = String.to_integer(segment)
    partial = String.to_integer(partial)

    send_manifest(conn, prefix, filename, segment, partial)
  end

  def index(conn, %{"filename" => filename} = params) do
    cond do
      filename == "index.m3u8" ->
        handle_other_file_request(conn, params)

      String.match?(filename, ~r/\.m3u8$/) ->
        handle_playlist_request(conn, params)

      String.match?(filename, ~r/\.m4s$/) ->
        handle_partial_segment_request(conn, params)

      true ->
        handle_other_file_request(conn, params)
    end
  end

  defp handle_partial_segment_request(
         conn,
         %{"event_id" => event_id, "filename" => segment_filename} = params
       ) do
    prefix = Path.join(event_id, Map.get(params, "stream_id", ""))
    {offset, length} = conn |> get_req_header("range") |> Helpers.parse_bytes_range()

    case await_partial_segment(prefix, segment_filename, offset, length) do
      {:file, path} ->
        conn |> Conn.send_file(200, path, offset, length)

      {:ets, content} ->
        conn |> Conn.send_resp(200, content)
    end
  end

  defp handle_playlist_request(conn, %{"event_id" => event_id, "filename" => filename} = params) do
    prefix = Path.join(event_id, Map.get(params, "stream_id", ""))

    # Send manifest as soon as first segment is fully generated
    send_manifest(conn, prefix, filename, 1, 0)
  end

  defp handle_other_file_request(conn, %{"event_id" => event_id, "filename" => filename} = params) do
    prefix = Path.join(event_id, Map.get(params, "stream_id", ""))
    path = Helpers.hls_output_path(prefix, filename)

    if File.exists?(path) do
      conn |> Conn.send_file(200, path)
    else
      conn |> Conn.send_resp(404, "File not found")
    end
  end

  defp send_manifest(
         conn,
         prefix,
         filename,
         segment,
         partial
       ) do
    unless partial_present_in_manifest?(prefix, filename, segment, partial) do
      filename_without_extension = String.replace(filename, ".m3u8", "")
      PubSub.subscribe(MembraneLive.PubSub, filename_without_extension)

      await_manifest_update(segment, partial)
      PubSub.unsubscribe(MembraneLive.PubSub, filename_without_extension)
    end

    if partial_present_in_manifest?(prefix, filename, segment, partial) do
      path = Helpers.hls_output_path(prefix, filename)
      conn |> Conn.send_file(200, path)
    else
      conn |> Conn.send_resp(404, "File not found")
    end
  end

  defp partial_present_in_manifest?(prefix, filename, target_segment, target_partial) do
    {segment, partial} =
      Helpers.hls_output_path(prefix, filename)
      |> Helpers.read_manifest()
      |> Helpers.get_last_partial()

    (segment == target_segment and partial >= target_partial) or segment > target_segment
  end

  defp await_manifest_update(target_segment, target_partial) do
    receive do
      {:manifest_update, segment, partial}
      when (segment == target_segment and partial >= target_partial) or segment > target_segment ->
        :ok
    after
      @manifest_update_timeout_ms ->
        :error
    end
  end

  defp await_partial_segment(prefix, segment_filename, offset, length) do
    ["muxed", "segment", segment, rest] = segment_filename |> String.split("_")
    filename_without_extension = String.replace(rest, ".m4s", "")

    partial_ets_name = "muxed_segment_#{segment}_#{filename_without_extension}_#{offset}"

    case find_partial_in_ets(partial_ets_name) do
      [{_key, content}] ->
        {:ets, content}

      [] ->
        segment_path = Helpers.hls_output_path(prefix, segment_filename)
        segment_size = segment_path |> File.stat!() |> Map.fetch!(:size)

        if length != :all and segment_size < offset + length do
          PubSub.subscribe(MembraneLive.PubSub, filename_without_extension)

          await_segment_update(segment, offset, length)
          PubSub.unsubscribe(MembraneLive.PubSub, filename_without_extension)
        end

        {:file, segment_path}
    end
  end

  defp await_segment_update(segment, offset, length) do
    receive do
      {:segment_update, ^segment, {^offset, ^length}} ->
        :ok
    after
      @partial_update_timeout_ms ->
        :error
    end
  end

  defp find_partial_in_ets(partial) do
    :ets.lookup(@ets_key, partial)
  end
end
