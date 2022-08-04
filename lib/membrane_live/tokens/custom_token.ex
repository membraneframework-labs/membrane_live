defmodule MembraneLive.Tokens.CustomToken do
  @moduledoc """
  Module with custom token configuration
  """

  use Joken.Config

  @issuer "swmansion.com"

  @impl true
  def token_config, do: default_claims(default_exp: 24 * 60 * 60, iss: @issuer, aud: @issuer)
end
