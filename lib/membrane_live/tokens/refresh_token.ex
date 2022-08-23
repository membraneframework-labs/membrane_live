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
  end
end
