defmodule MembraneLiveWeb.LoginControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.AccountsFixtures

  alias MembraneLive.Accounts.User
  alias MembraneLive.Repo
  alias MembraneLive.Support.{GoogleTokenMock, RefreshTokenMock}
  alias MembraneLive.Tokens

  setup do
    port = MembraneLive.get_env(:bypass_port)
    bypass = Bypass.open(port: port)

    {:ok, bypass: bypass}
  end

  setup %{conn: conn} do
    conn = put_req_header(conn, "accept", "application/json")

    {:ok, conn: conn}
  end

  describe "google auth" do
    test "[200]: jwt passes", %{bypass: bypass, conn: conn} do
      # given
      user_to_add = user_attrs()
      {:ok, mock_google_token, _claims} = GoogleTokenMock.get_mock_jwt(user_to_add)

      expect_google_pem(bypass)

      # when
      conn = post(conn, Routes.login_path(conn, :create), credential: mock_google_token)

      # then
      assert %{"authToken" => auth_token, "refreshToken" => refresh_token} =
               json_response(conn, 200)

      assert {:ok, %{"user_id" => user_uuid}} = Tokens.auth_decode(auth_token)
      assert {:ok, _claims} = Tokens.refresh_decode(refresh_token)

      user_in_db = Repo.get!(User, user_uuid)
      assert user_in_db.email == user_to_add.email
      assert user_in_db.name == user_to_add.name
      assert user_in_db.picture == user_to_add.picture
    end

    test "[400]: jwt has invalid header", %{conn: conn} do
      invalid_jwt = "InVaLiD jWt"

      conn = post(conn, Routes.login_path(conn, :create), credential: invalid_jwt)
      assert %{"message" => "Invalid jwt header"} = json_response(conn, 400)
    end

    test "[401]: jwt is wrongly signed", %{bypass: bypass, conn: conn} do
      {:ok, wrongly_signed_token, _claims} = GoogleTokenMock.wrongly_signed_jwt()
      expect_google_pem(bypass)

      conn = post(conn, Routes.login_path(conn, :create), credential: wrongly_signed_token)
      assert %{"message" => "Token has an invalid signature"} = json_response(conn, 401)
    end

    test "[503] google service not available", %{bypass: bypass, conn: conn} do
      # given
      user_to_add = user_fixture()
      {:ok, mock_google_token, _claims} = GoogleTokenMock.get_mock_jwt(user_to_add)

      Bypass.down(bypass)

      expected_error_msg = HTTPoison.Error.message(%HTTPoison.Error{reason: :econnrefused})

      # when
      conn = post(conn, Routes.login_path(conn, :create), credential: mock_google_token)

      # then
      assert %{"message" => ^expected_error_msg} = json_response(conn, 503)
    end
  end

  describe "refresh" do
    test "[200] refresh token is valid", %{conn: conn} do
      # given
      user = user_fixture()
      {:ok, old_refresh_token, _claims} = Tokens.refresh_encode(user.uuid)

      # when
      conn = post(conn, Routes.login_path(conn, :refresh), refreshToken: old_refresh_token)

      # then
      assert %{"authToken" => auth_token, "refreshToken" => new_refresh_token} =
               json_response(conn, 200)

      assert {:ok, %{"user_id" => user_id}} = Tokens.auth_decode(auth_token)
      assert {:ok, _claims} = Tokens.refresh_decode(new_refresh_token)

      assert old_refresh_token != new_refresh_token

      assert user_in_db = Repo.get!(User, user_id)
      assert user_in_db.name == user.name
      assert user_in_db.email == user.email
      assert user_in_db.picture == user.picture
    end

    test "[400] empty claims", %{conn: conn} do
      empty_jwt = RefreshTokenMock.empty_jwt()

      conn = post(conn, Routes.login_path(conn, :refresh), refreshToken: empty_jwt)

      assert %{"message" => "User id was not provided in the jwt"} = json_response(conn, 400)
    end

    test "[401] refresh token is invalid", %{conn: conn} do
      invalid_jwt = RefreshTokenMock.wrongly_signed_jwt("iNvAlId_SeCrEt")

      conn = post(conn, Routes.login_path(conn, :refresh), refreshToken: invalid_jwt)

      assert %{"message" => "Token has an invalid signature"} = json_response(conn, 401)
    end
  end

  defp expect_google_pem(bypass) do
    Bypass.expect(bypass, fn conn ->
      Plug.Conn.resp(
        conn,
        200,
        GoogleTokenMock.get_google_public_key()
      )
    end)
  end
end
