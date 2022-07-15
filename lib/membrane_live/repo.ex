defmodule MembraneLive.Repo do
  use Ecto.Repo,
    otp_app: :membrane_live,
    adapter: Ecto.Adapters.Postgres
end
