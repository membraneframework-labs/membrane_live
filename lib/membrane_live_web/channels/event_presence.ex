defmodule MembraneLiveWeb.Presence do
  @moduledoc """
  Stores and propagates data about viewers activity.
  """
  use Phoenix.Presence,
    otp_app: :membrane_live,
    pubsub_server: MembraneLive.PubSub
end
