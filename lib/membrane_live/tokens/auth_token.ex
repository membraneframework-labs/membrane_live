defmodule MembraneLive.Tokens.AuthToken do
  @moduledoc """
  Module with auth token with custom configuration
  """

  use Joken.Config

  @one_day 24 * 60 * 60
  @issuer "swmansion.com"

  @impl true
  def token_config, do: default_claims(default_exp: @one_day, iss: @issuer, aud: @issuer)
end
