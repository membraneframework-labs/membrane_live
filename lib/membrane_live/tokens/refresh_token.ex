defmodule MembraneLive.Tokens.RefreshToken do
  @moduledoc """
  Module with refresh token
  """

  use Joken.Config

  @one_week 7 * 24 * 60 * 60

  @impl true
  def token_config do
    issuer = Application.fetch_env!(:membrane_live, :token_issuer)

    default_claims(default_exp: @one_week, iss: issuer, aud: issuer)
    |> add_claim("user_id", nil, &is_valid_uuid/1)
  end

  defp is_valid_uuid(uuid) do
    String.match?(uuid, ~r/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  end

  def has_uuid(jwt) do
    case Joken.peek_claims(jwt) do
      {:ok, %{"user_id" => _user_id}} -> true
      _ -> false
    end
  end
end
