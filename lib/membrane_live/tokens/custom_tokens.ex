defmodule MembraneLive.Tokens.AuthToken do
  @moduledoc """
  Module with auth token with custom configuration
  """

  use Joken.Config

  import MembraneLive.Helpers

  @one_day 24 * 60 * 60

  def token_config do
    :token_issuer
    |> MembraneLive.get_env!()
    |> then(&default_claims(default_exp: @one_day, iss: &1, aud: &1))
    |> add_claim("user_id", nil, &is_valid_uuid/1)
  end
end

defmodule MembraneLive.Tokens.RefreshToken do
  @moduledoc """
  Module with refresh token
  """

  use Joken.Config

  import MembraneLive.Helpers

  @one_week 7 * 24 * 60 * 60

  @impl true
  def token_config do
    :token_issuer
    |> MembraneLive.get_env!()
    |> then(&default_claims(default_exp: @one_week, iss: &1, aud: &1))
    |> add_claim("user_id", nil, &is_valid_uuid/1)
  end

  def has_uuid?(jwt) do
    case Joken.peek_claims(jwt) do
      {:ok, %{"user_id" => _user_id}} -> true
      _error -> false
    end
  end
end
