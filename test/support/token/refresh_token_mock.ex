defmodule MembraneLive.Support.RefreshTokenMock do
  @moduledoc """
  Module that adds some test functionalities to the RefreshToken encoding and decoding
  """

  alias MembraneLive.Tokens.RefreshToken

  @dummy_uuid "5a2771ef-3cf2-4d86-b125-fd366e04bc29"

  def empty_jwt() do
    secret = :membrane_live |> Application.fetch_env!(:token_refresh_secret)
    signer = Joken.Signer.create("HS256", secret)
    RefreshToken.generate_and_sign!(%{}, signer)
  end

  def wrongly_signed_jwt(invalid_secret) do
    invalid_signer = Joken.Signer.create("HS256", invalid_secret)
    RefreshToken.generate_and_sign!(%{"user_id" => @dummy_uuid}, invalid_signer)
  end
end
