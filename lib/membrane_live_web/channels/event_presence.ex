defmodule MembraneLiveWeb.Presence do
  @moduledoc """
  Stores and propagates data about viewers activity.
  """
  use Phoenix.Presence,
    otp_app: :membrane_live,
    pubsub_server: MembraneLive.PubSub

  import MembraneLiveWeb.Helpers.EtsHelper

  def absent?(topic, key) do
    get_by_key(topic, key) |> Enum.empty?()
  end
end
