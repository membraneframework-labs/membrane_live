defmodule MembraneLive.Helpers do
  @moduledoc false

  @spec pid_hash(pid()) :: String.t()
  def pid_hash(pid) do
    pid |> pid_to_hash()
  end

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

  defp pid_to_hash(pid) do
    :crypto.hash(:md5, :erlang.pid_to_list(pid)) |> Base.encode16(case: :lower)
  end

  def is_valid_uuid(uuid) do
    String.match?(uuid, ~r/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  end

  def underscore_keys(attrs) do
    attrs
    |> Enum.map(fn {k, v} -> {Inflex.underscore(k), v} end)
    |> Enum.into(%{})
  end
end
