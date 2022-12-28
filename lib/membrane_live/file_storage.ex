defmodule MembraneLive.HLS.FileStorage do
  @moduledoc """
  `MembraneLive.HTTPAdaptiveStream.FileStorage` implementation that saves the stream to
  files locally.
  """
  @behaviour Membrane.HTTPAdaptiveStream.Storage

  require Membrane.Logger

  alias Phoenix.PubSub

  @enforce_keys [:directory]
  defstruct @enforce_keys

  @type t :: %__MODULE__{
          directory: Path.t()
        }

  @ets_key :partial_segments
  @remove_partial_timeout_ms 5000

  @impl true
  def init(%__MODULE__{} = config), do: config

  @impl true
  def store(
        _parent_id,
        segment_filename,
        contents,
        %{byte_offset: offset},
        %{mode: :binary},
        %__MODULE__{
          directory: directory
        }
      ) do
    result = File.write(Path.join(directory, segment_filename), contents, [:binary, :append])

    with {segment_no, manifest_name} <- parse_filename(segment_filename),
         manifest_path <- "#{manifest_name}.m3u8" |> then(&Path.join(directory, &1)),
         binary <- read_manifest(manifest_path),
         partial_no <- get_partial_number(binary, segment_filename, offset) do
      length = byte_size(contents)

      partial_ets_name = "muxed_segment_#{segment_no}_#{manifest_name}_#{offset}"
      add_partial_to_ets(partial_ets_name, contents)

      spawn(fn ->
        Process.sleep(@remove_partial_timeout_ms)
        remove_partial_from_ets(partial_ets_name)
      end)

      PubSub.broadcast(
        MembraneLive.PubSub,
        manifest_name,
        {{segment_no, partial_no}, {offset, length}}
      )
    else
      err -> Membrane.Logger.error("Storing partial segment failed: #{inspect(err)}")
    end

    result
  end

  def store(
        _parent_id,
        segment_filename,
        contents,
        _metadata,
        %{mode: :binary},
        %__MODULE__{
          directory: directory
        }
      ) do
    if String.contains?(segment_filename, "muxed_segment") do
      # ignore storing
      :ok
    else
      File.write(Path.join(directory, segment_filename), contents, [:binary])
    end
  end

  @impl true
  def store(_parent_id, name, contents, _metadata, %{mode: :text}, %__MODULE__{
        directory: directory
      }) do
    result = File.write(Path.join(directory, name), contents)

    if String.match?(name, ~r/\.m3u8$/) do
      {segment, partial} = get_last_partial(contents)
      name_without_extension = String.replace(name, ".m3u8", "")

      PubSub.broadcast(
        MembraneLive.PubSub,
        name_without_extension,
        {:manifest_update, segment, partial}
      )
    end

    result
  end

  @impl true
  def remove(_parent_id, name, _ctx, %__MODULE__{directory: location}) do
    File.rm(Path.join(location, name))
  end

  defp parse_filename(segment_filename) do
    ["muxed", "segment", num, manifest_name] =
      segment_filename
      |> String.split(".")
      |> Enum.at(0)
      |> String.split("_")

    {String.to_integer(num), manifest_name}
  end

  defp read_manifest(manifest_path) do
    if File.exists?(manifest_path) do
      File.read!(manifest_path)
    else
      ""
    end
  end

  defp get_partial_number(data, segment_filename, target_offset) do
    search_str = "URI=\"#{segment_filename}\""

    last_segment_no =
      data
      |> String.split("\n")
      |> Enum.filter(&String.contains?(&1, search_str))
      |> Enum.with_index(1)
      |> Enum.find_value(fn {partial, index} ->
        [length, offset] = get_partial_offset(partial)
        if target_offset == offset + length, do: index, else: nil
      end)

    if last_segment_no, do: last_segment_no + 1, else: 1
  end

  defp get_partial_offset(partial) do
    result_range =
      partial
      |> String.split(",")
      |> Enum.find(&String.contains?(&1, "BYTERANGE"))
      |> String.replace("BYTERANGE=", "")
      |> String.replace("\"", "")

    result_range
    |> String.split("@")
    |> Enum.map(&String.to_integer(&1))
  end

  defp get_last_partial(binary) do
    last_tags = binary |> String.split("\n") |> Enum.take(-12) |> Enum.reverse()

    case last_tags |> Enum.find(&String.contains?(&1, "#EXT-X-PART:")) do
      nil ->
        {0, 0}

      partial ->
        ["muxed", "segment", segment, _rest] =
          partial
          |> String.split(",")
          |> Enum.find(&String.contains?(&1, "URI="))
          |> String.replace("URI=", "")
          |> String.replace("\"", "")
          |> String.split("_")

        partial_count =
          last_tags
          |> Enum.filter(&String.contains?(&1, "muxed_segment_#{segment}"))
          |> Enum.count()

        {String.to_integer(segment), partial_count}
    end
  end

  defp remove_partial_from_ets(partial) do
    :ets.delete(@ets_key, partial)
  end

  defp add_partial_to_ets(partial, content) do
    :ets.insert(@ets_key, {partial, content})
  end
end
