defmodule MembraneLive.Support.AuthTokenMock do
  @moduledoc """
  Module for extending custom auth token functionalities for the tests
  """

  alias MembraneLive.Tokens.AuthToken
  @dummy_uuid "5a2771ef-3cf2-4d86-b125-fd366e04bc29"

  @spec wrongly_signed_jwt(binary | map) :: binary
  def wrongly_signed_jwt(invalid_secret) do
    invalid_signer = Joken.Signer.create("HS256", invalid_secret)
    AuthToken.generate_and_sign!(%{"user_id" => @dummy_uuid}, invalid_signer)
  end
end
