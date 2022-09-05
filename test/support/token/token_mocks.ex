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

defmodule MembraneLive.Support.RefreshTokenMock do
  @moduledoc """
  Module that adds some test functionalities to the RefreshToken encoding and decoding
  """

  alias MembraneLive.Tokens.RefreshToken

  @dummy_uuid "5a2771ef-3cf2-4d86-b125-fd366e04bc29"

  def empty_jwt() do
    secret = MembraneLive.get_env(:token_refresh_secret)
    signer = Joken.Signer.create("HS256", secret)
    RefreshToken.generate_and_sign!(%{}, signer)
  end

  def wrongly_signed_jwt(invalid_secret) do
    invalid_signer = Joken.Signer.create("HS256", invalid_secret)
    RefreshToken.generate_and_sign!(%{"user_id" => @dummy_uuid}, invalid_signer)
  end
end

defmodule MembraneLive.Support.CustomTokenHelperFunctions do
  @moduledoc """
  Module with helper functions when testing auth token and refresh token
  """
  import Plug.Conn
  import MembraneLive.AccountsFixtures

  alias MembraneLive.Accounts.User
  alias MembraneLive.Tokens

  def put_user_in_auth_header(conn, %User{uuid: uuid}) do
    {:ok, token, _claims} = Tokens.auth_encode(uuid)
    put_req_header(conn, "authorization", get_valid_bearer(token))
  end

  def set_new_user_token(conn) do
    google_claims = %{
      "name" => "mock_user",
      "email" => "mock_email@gmail.com",
      "picture" => "https://google.com"
    }

    {:ok, user, token} = create_user_with_token(google_claims)

    conn = put_req_header(conn, "authorization", get_valid_bearer(token))

    {:ok, user, conn}
  end

  defp get_valid_bearer(token) do
    "Bearer #{token}"
  end
end
