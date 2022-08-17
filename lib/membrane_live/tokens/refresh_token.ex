defmodule MembraneLive.Tokens.RefreshToken do
  @moduledoc """
  Module with refresh token
  """

  use Joken.Config

  @one_week 7 * 24 * 60 * 60
  @issuer "swmansion.com"

  @impl true
  def token_config, do: default_claims(default_exp: @one_week, iss: @issuer, aud: @issuer)
end
