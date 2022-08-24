defmodule MembraneLive.Tokens.AuthToken do
  @moduledoc """
  Module with auth token with custom configuration
  """

  use Joken.Config

  @one_day 24 * 60 * 60

  def token_config do
    issuer = Application.fetch_env!(:membrane_live, :token_issuer)

    default_claims(default_exp: @one_day, iss: issuer, aud: issuer)
    |> add_claim("user_id", nil, &is_valid_uuid/1)
  end

  defp is_valid_uuid(uuid) do
    String.match?(uuid, ~r/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  end
end
