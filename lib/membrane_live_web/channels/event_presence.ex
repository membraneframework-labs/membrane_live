defmodule MembraneLiveWeb.Presence do
  use Phoenix.Presence,
    otp_app: :membrane_live,
    pubsub_server: MembraneLive.PubSub
end
