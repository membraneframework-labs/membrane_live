defmodule MembraneLiveWeb.LoginControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.AccountsFixtures

  alias MembraneLive.Accounts.User
  alias MembraneLive.Support.GoogleTokenMock
  alias MembraneLive.Repo
  alias MembraneLive.Tokens

  setup do
    port = Application.fetch_env!(:membrane_live, :bypass_port)
    bypass = Bypass.open(port: port)
    {:ok, bypass: bypass}
  end

  setup %{conn: conn} do
    conn =
      conn
      |> put_req_header("accept", "application/json")

    {:ok, conn: conn}
  end

  describe "google auth" do
    test "[200]: jwt passes", %{bypass: bypass, conn: conn} do
      # given
      user_to_add = user_fixture()
      {:ok, mock_google_token, _claims} = GoogleTokenMock.get_mock_jwt(user_to_add)

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(
          conn,
          200,
          GoogleTokenMock.get_google_public_key()
        )
      end)

      # when
      conn = post(conn, Routes.login_path(conn, :create), credential: mock_google_token)

      # then
      # change tests after merging LIVE-73
      assert %{"token" => auth_jwt} = json_response(conn, 200)

      assert {:ok, %{"user_id" => user_uuid}} = Tokens.custom_decode(auth_jwt)
      user_in_db = Repo.get!(User, user_uuid)

      assert user_in_db.email == user_to_add.email
      assert user_in_db.name == user_to_add.name
      assert user_in_db.picture == user_to_add.picture
    end

    test "[401]: jwt is wrongly signed" do
      # NOT IMPLEMENTED YET
    end
  end

  describe "refresh" do
    test "[200] refresh token is valid" do
      user = user_fixture() |> Repo.insert!()

      # TODO
    end

    test "[401] refresh token is invalid" do
    end
  end
end
