defmodule MembraneLive.HLS.FileStorage do
  @moduledoc """
  `MembraneLive.HTTPAdaptiveStream.FileStorage` implementation.
  Supports LL-HLS and notifies that a partial segment has been saved via `Phoenix.PubSub`.
  """
  @behaviour Membrane.HTTPAdaptiveStream.Storage

  require Membrane.Logger

  alias MembraneLive.HLS.Helpers
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

    with {segment, manifest_name} <- Helpers.parse_filename(segment_filename),
         manifest_path <- Path.join(directory, "#{manifest_name}.m3u8"),
         manifest <- Helpers.read_manifest(manifest_path),
         partial <- Helpers.get_partial_number(manifest, segment_filename, offset) do
      partial_ets_name = "muxed_segment_#{segment}_#{manifest_name}_#{offset}"
      add_partial_to_ets(partial_ets_name, contents)

      Task.start(fn ->
        Process.sleep(@remove_partial_timeout_ms)
        remove_partial_from_ets(partial_ets_name)
      end)

      PubSub.broadcast(
        MembraneLive.PubSub,
        manifest_name,
        {:segment_update, {segment, partial}, {offset, byte_size(contents)}}
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
        %__MODULE__{directory: directory}
      ) do
    File.write(Path.join(directory, segment_filename), contents, [:binary])
  end

  @impl true
  def store(_parent_id, name, contents, _metadata, %{mode: :text}, %__MODULE__{
        directory: directory
      }) do
    result = File.write(Path.join(directory, name), contents)

    if String.match?(name, ~r/\.m3u8$/) do
      {segment, partial} = Helpers.get_last_partial(contents)
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

  defp remove_partial_from_ets(partial) do
    :ets.delete(@ets_key, partial)
  end

  defp add_partial_to_ets(partial, content) do
    :ets.insert(@ets_key, {partial, content})
  end
end
