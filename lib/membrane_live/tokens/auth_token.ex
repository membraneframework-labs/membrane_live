defmodule MembraneLive.Tokens.AuthToken do
  @moduledoc """
  Module with auth token with custom configuration
  """

  use Joken.Config

  @one_day 24 * 60 * 60

  def token_config do
    issuer = Application.fetch_env!(:membrane_live, :token_issuer)
    default_claims(default_exp: @one_day, iss: issuer, aud: issuer)
  end
end
