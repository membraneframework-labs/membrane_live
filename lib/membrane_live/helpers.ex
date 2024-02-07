defmodule MembraneLive.Helpers do
  @moduledoc false

  @spec pid_hash(pid()) :: String.t()
  def pid_hash(pid) do
    pid |> pid_to_hash()
  end

  defp pid_to_hash(pid) do
    :crypto.hash(:md5, :erlang.pid_to_list(pid)) |> Base.encode16(case: :lower)
  end

  def valid_uuid?(uuid) do
    String.match?(uuid, ~r/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  end

  def underscore_keys(attrs) do
    attrs
    |> Enum.map(fn {k, v} -> {Inflex.underscore(k), v} end)
    |> Enum.into(%{})
  end
end
