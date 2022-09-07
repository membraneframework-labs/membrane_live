defmodule MembraneLiveWeb.UserControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.AccountsFixtures
  import MembraneLive.Support.CustomTokenHelperFunctions

  alias MembraneLive.Accounts.User

  @update_attrs %{
    email: "john-update@gmail.com",
    name: "John Update Kowalski",
    picture: "updated_kowalski.img"
  }
  @invalid_attrs %{
    email: "i_like_underscore@but_its_not_allowed_in_this_part.example.com",
    name: nil,
    picture: nil
  }

  setup %{conn: conn} do
    {:ok, user, conn} =
      conn
      |> put_req_header("accept", "application/json")
      |> set_new_user_token()

    {:ok, conn: conn, user: user}
  end

  describe "index" do
    test "lists all users", %{conn: conn, user: %{uuid: user_uuid}} do
      conn = get(conn, Routes.user_path(conn, :index))
      assert [%{"uuid" => ^user_uuid}] = json_response(conn, 200)["data"]
    end
  end

  describe "show" do
    test "req is valid", %{conn: conn, user: %{uuid: uuid, email: email}} do
      conn = get(conn, Routes.user_path(conn, :show, uuid))

      assert %{
               "uuid" => ^uuid,
               "email" => ^email
             } = json_response(conn, 200)["data"]
    end

    test "different user in header", %{conn: conn, user: user} = context do
      user_path = Routes.user_path(conn, :show, user)
      callback = &get(&1, user_path)
      test_unauthorized_user_request(callback, context)
    end
  end

  describe "update user" do
    test "renders user when data is valid", %{conn: conn, user: %User{uuid: uuid} = user} do
      conn = put(conn, Routes.user_path(conn, :update, user), user: @update_attrs)
      assert %{"uuid" => ^uuid} = json_response(conn, 200)["data"]

      conn = get(conn, Routes.user_path(conn, :show, uuid))

      assert %{
               "uuid" => ^uuid,
               "email" => "john-update@gmail.com",
               "name" => "John Update Kowalski",
               "picture" => "updated_kowalski.img"
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn, user: user} do
      conn = put(conn, Routes.user_path(conn, :update, user), user: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end

    test "reject if updating not the given user", %{conn: conn, user: user} = context do
      user_path = Routes.user_path(conn, :update, user)
      callback = &put(&1, user_path, user: @update_attrs)
      test_unauthorized_user_request(callback, context)
    end
  end

  describe "delete user" do
    test "deletes chosen user", %{conn: conn, user: user} do
      conn = delete(conn, Routes.user_path(conn, :delete, user))
      assert response(conn, 204)

      conn = get(conn, Routes.user_path(conn, :show, user))
      assert response(conn, 404)
    end

    test "reject if deleting not the given user", %{conn: conn, user: user} = context do
      user_path = Routes.user_path(conn, :delete, user)
      conn_callback = &delete(&1, user_path)
      test_unauthorized_user_request(conn_callback, context)
    end
  end

  defp test_unauthorized_user_request(conn_callback, %{conn: conn, user: user}) do
    fake_user = fake_user_fixture()
    expected_msg = unauthorized_error_message(fake_user.uuid, user)

    conn
    |> put_user_in_auth_header(fake_user)
    |> then(conn_callback)
    |> unauthorize_assert(expected_msg)
  end
end
