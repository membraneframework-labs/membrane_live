defmodule MembraneLive.HLS.FileStorage do
  @moduledoc """
  `MembraneLive.HTTPAdaptiveStream.FileStorage` implementation.
  Supports LL-HLS and notifies that a partial segment has been saved via `Phoenix.PubSub`.
  """
  @behaviour Membrane.HTTPAdaptiveStream.Storage

  require Membrane.Logger

  alias MembraneLive.HLS.Helpers
  alias Phoenix.PubSub

  @enforce_keys [:directory, :second_segment_ready?]
  defstruct @enforce_keys

  @type t :: %__MODULE__{
          directory: Path.t(),
          second_segment_ready?: boolean()
        }

  defmodule Config do
    @moduledoc false
    @enforce_keys [:directory]

    defstruct @enforce_keys

    @type t :: %__MODULE__{
            directory: Path.t()
          }
  end

  @ets_key :partial_segments
  @remove_partial_timeout_ms 5000

  @impl true
  def init(config) do
    config
    |> Map.merge(%{second_segment_ready?: false})
    |> Map.from_struct()
    |> then(&struct!(__MODULE__, &1))
  end

  @impl true
  def store(_parent_id, _segment_filename, _content, _metadata, %{type: :segment}, state),
    do: {:ok, state}

  @impl true
  def store(
        _parent_id,
        segment_filename,
        contents,
        %{byte_offset: offset},
        %{mode: :binary, type: :partial_segment},
        %__MODULE__{directory: directory} = state
      ) do
    result = File.write(Path.join(directory, segment_filename), contents, [:binary, :append])

    with {segment, manifest_name} <- Helpers.parse_filename(segment_filename) do
      partial_ets_name = "muxed_segment_#{segment}_#{manifest_name}_#{offset}"
      add_partial_to_ets(partial_ets_name, contents)

      Task.start(fn ->
        Process.sleep(@remove_partial_timeout_ms)
        remove_partial_from_ets(partial_ets_name)
      end)
    else
      err -> Membrane.Logger.error("Adding partial to ETS failed: #{inspect(err)}")
    end

    {result, state}
  end

  def store(
        _parent_id,
        segment_filename,
        contents,
        _metadata,
        %{mode: :binary},
        %__MODULE__{directory: directory} = state
      ) do
    {File.write(Path.join(directory, segment_filename), contents, [:binary]), state}
  end

  @impl true
  def store(
        _parent_id,
        name,
        contents,
        _metadata,
        %{mode: :text},
        %__MODULE__{directory: directory} = state
      ) do
    result = File.write(Path.join(directory, name), contents)

    state =
      if String.match?(name, ~r/\.m3u8$/) do
        notify_playlist_update(name, contents, state)
      else
        state
      end

    {result, state}
  end

  @impl true
  def remove(_parent_id, name, _ctx, %__MODULE__{directory: location} = state) do
    {File.rm(Path.join(location, name)), state}
  end

  defp notify_playlist_update(name, contents, state) do
    state = maybe_send_first_segment_notification(state, contents)

    if state.second_segment_ready? do
      {segment, partial} = Helpers.get_last_partial(contents)
      name_without_extension = String.replace(name, ".m3u8", "")

      PubSub.broadcast(
        MembraneLive.PubSub,
        name_without_extension,
        {:manifest_update_partial, segment, partial}
      )
    end

    state
  end

  defp maybe_send_first_segment_notification(
         %__MODULE__{second_segment_ready?: true} = state,
         _contents
       ),
       do: state

  defp maybe_send_first_segment_notification(%__MODULE__{} = state, contents) do
    if String.contains?(contents, "\nmuxed_segment_1") do
      "output/" <> event_id = state.directory
      PubSub.broadcast(MembraneLive.PubSub, event_id, :second_segment_ready)
      %{state | second_segment_ready?: true}
    else
      state
    end
  end

  defp remove_partial_from_ets(partial) do
    :ets.delete(@ets_key, partial)
  end

  defp add_partial_to_ets(partial, content) do
    :ets.insert(@ets_key, {partial, content})
  end
end
