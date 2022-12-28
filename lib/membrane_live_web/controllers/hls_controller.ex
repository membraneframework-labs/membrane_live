defmodule MembraneLiveWeb.HLSController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Helpers
  alias Phoenix.PubSub
  alias Plug

  @ets_key :partial_segments
  @partial_update_timeout_ms 2000
  @manifest_update_timeout_ms 1000

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

    path = Helpers.hls_output_path(prefix, filename)

    case wait_for_manifest(prefix, filename, segment, partial) do
      :ok ->
        conn |> Plug.Conn.send_file(200, path)

      :error ->
        conn |> Plug.Conn.send_resp(400, "File not found")
    end
  end

  def index(conn, %{"filename" => filename} = params) do
    if String.match?(filename, ~r/\.m4s$/) do
      handle_partial_segment_request(conn, params)
    else
      handle_other_file_request(conn, params)
    end
  end

  def handle_partial_segment_request(
        conn,
        %{"event_id" => event_id, "filename" => segment_filename} = params
      ) do
    prefix = Path.join(event_id, Map.get(params, "stream_id", ""))

    {offset, length} = parse_bytes_range(conn)
    partial_segment = await_partial_segment(prefix, segment_filename, offset, length)

    case partial_segment do
      {:file, path} ->
        conn |> Plug.Conn.send_file(200, path, offset, length)

      {:ets, content} ->
        conn |> Plug.Conn.send_resp(200, content)
    end
  end

  def handle_other_file_request(conn, %{"event_id" => event_id, "filename" => filename} = params) do
    prefix = Path.join(event_id, Map.get(params, "stream_id", ""))
    path = Helpers.hls_output_path(prefix, filename)

    if File.exists?(path) do
      conn |> Plug.Conn.send_file(200, path)
    else
      conn |> Plug.Conn.send_resp(404, "File not found")
    end
  end

  defp wait_for_manifest(prefix, filename, segment, partial) do
    if partial_present_in_manifest?(prefix, filename, segment, partial) do
      :ok
    else
      filename_without_extension = String.replace(filename, ".m3u8", "")
      PubSub.subscribe(MembraneLive.PubSub, filename_without_extension)

      await_manifest_update(segment, partial)
      PubSub.unsubscribe(MembraneLive.PubSub, filename_without_extension)

      if partial_present_in_manifest?(prefix, filename, segment, partial), do: :ok, else: :error
    end
  end

  defp partial_present_in_manifest?(prefix, filename, segment, partial) do
    path = Helpers.hls_output_path(prefix, filename)
    filename_without_extension = String.replace(filename, ".m3u8", "")

    segment_filename = "muxed_segment_#{segment}_#{filename_without_extension}.m4s"
    partials = read_partials(path, segment_filename)

    Enum.count(partials) >= partial
  end

  defp await_manifest_update(target_segment, target_partial) do
    receive do
      {:manifest_update, segment, partial}
      when segment >= target_segment and partial >= target_partial ->
        :ok
    after
      @manifest_update_timeout_ms ->
        :error
    end
  end

  defp parse_bytes_range(%{req_headers: headers}) do
    case Enum.find(headers, &match?({"range", _}, &1)) do
      {"range", value} ->
        "bytes=" <> range = value
        [first, last] = range |> String.split("-") |> Enum.map(&String.to_integer(&1))
        {first, last - first + 1}

      nil ->
        {0, :all}
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
        segment_size = File.stat!(segment_path) |> Map.fetch!(:size)

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
      {^segment, {^offset, ^length}} ->
        :ok
    after
      @partial_update_timeout_ms ->
        :error
    end
  end

  defp read_partials(path, segment_filename) do
    search_str = "URI=\"#{segment_filename}\""

    File.read!(path)
    |> String.split("\n")
    |> Enum.filter(&String.contains?(&1, search_str))
  end

  defp find_partial_in_ets(partial) do
    :ets.lookup(@ets_key, partial)
  end
end
