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
    secret = MembraneLive.get_env!(:token_refresh_secret)
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

  import Phoenix.ConnTest
  import Plug.Conn
  import MembraneLive.AccountsFixtures
  import ExUnit.Assertions

  alias MembraneLive.Accounts.User
  alias MembraneLive.Webinars.Webinar

  alias MembraneLive.Accounts.User
  alias MembraneLive.Tokens

  def put_user_in_auth_header(conn, %User{uuid: uuid}) do
    {:ok, token, _claims} = Tokens.auth_encode(uuid)
    put_req_header(conn, "authorization", get_valid_bearer(token))
  end

  def set_new_user_token(conn, suffix \\ "") do
    google_claims = %{
      "name" => "mock_user#{suffix}",
      "email" => "mock_email#{suffix}@gmail.com",
      "picture" => "https://google.com"
    }

    {:ok, user, token} = create_user_with_token(google_claims)

    conn = put_req_header(conn, "authorization", get_valid_bearer(token))

    {:ok, user, conn}
  end

  defp get_valid_bearer(token) do
    "Bearer #{token}"
  end

  @spec unauthorize_assert(Plug.Conn.t(), String.t()) :: true
  def unauthorize_assert(conn, expected_msg) do
    assert %{"message" => expected_msg, "status" => 403} == json_response(conn, 403)
  end

  @spec unauthorized_error_message(String.t(), User.t() | Webinar.t()) :: String.t()
  def unauthorized_error_message(jwt_user_id, %Webinar{uuid: webinar_id}),
    do: "User with uuid #{jwt_user_id} does not have access to webinar with uuid #{webinar_id}"

  def unauthorized_error_message(jwt_user_id, %User{uuid: user_id}),
    do: "User with uuid #{jwt_user_id} does not have access to user with uuid #{user_id}"
end
