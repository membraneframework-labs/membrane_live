defmodule MembraneLive.HLS.Helpers do
  @moduledoc false

  @spec hls_output_path(prefix :: String.t()) :: String.t()
  def hls_output_path(prefix) do
    [hls_output_mount_path(), prefix] |> Path.join()
  end

  @spec hls_output_path(prefix :: String.t(), filename :: String.t()) :: String.t()
  def hls_output_path(prefix, filename) do
    [hls_output_mount_path(), prefix, filename] |> Path.join()
  end

  @spec hls_output_mount_path() :: String.t()
  def hls_output_mount_path(),
    do: MembraneLive.get_env!(:hls_output_mount_path)

  @spec parse_filename(binary) :: {integer, binary}
  def parse_filename(segment_filename) do
    ["muxed", "segment", segment, manifest_name] =
      segment_filename
      |> String.replace(".m4s", "")
      |> String.split("_")

    {String.to_integer(segment), manifest_name}
  end

  @spec read_manifest(binary) :: binary
  def read_manifest(manifest_path) do
    case File.read(manifest_path) do
      {:ok, binary} -> binary
      {:error, _err} -> ""
    end
  end

  @spec get_partial_number(binary, binary, non_neg_integer) :: number
  def get_partial_number(playlist, segment_filename, target_offset) do
    search_str = "URI=\"#{segment_filename}\""

    last_segment_no =
      playlist
      |> String.split("\n")
      |> Enum.filter(&String.contains?(&1, search_str))
      |> Enum.with_index(1)
      |> Enum.find_value(fn {partial, index} ->
        [length, offset] = get_partial_offset(partial)
        if target_offset == offset + length, do: index, else: nil
      end)

    if last_segment_no, do: last_segment_no + 1, else: 1
  end

  @spec get_last_partial(binary) :: {non_neg_integer, non_neg_integer}
  def get_last_partial(binary) do
    partial_tags =
      binary
      |> String.split("\n")
      |> Enum.filter(&String.contains?(&1, "#EXT-X-PART:"))
      |> Enum.reverse()

    if Enum.empty?(partial_tags) do
      {0, 0}
    else
      last_partial = hd(partial_tags)

      {segment, _manifest_name} =
        last_partial
        |> find_partial_tag("URI")
        |> parse_filename()

      partial_count =
        partial_tags
        |> Enum.filter(&String.contains?(&1, "muxed_segment_#{segment}"))
        |> Enum.count()

      {segment, partial_count}
    end
  end

  @spec parse_bytes_range([binary]) :: {number, :all | number}
  def parse_bytes_range(raw_range) do
    case raw_range do
      [] ->
        {0, :all}

      [raw_range] ->
        "bytes=" <> range = raw_range
        [first, last] = range |> String.split("-") |> Enum.map(&String.to_integer(&1))
        {first, last - first + 1}
    end
  end

  defp get_partial_offset(partial) do
    partial
    |> find_partial_tag("BYTERANGE")
    |> String.split("@")
    |> Enum.map(&String.to_integer(&1))
  end

  defp find_partial_tag(partial, tag) do
    partial
    |> String.split(",")
    |> Enum.find(&String.contains?(&1, "#{tag}="))
    |> String.replace("#{tag}=", "")
    |> String.replace("\"", "")
  end
end
