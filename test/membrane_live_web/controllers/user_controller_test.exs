defmodule MembraneLiveWeb.UserControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.AccountsFixtures
  import MembraneLive.Support.CustomTokenHelperFunctions

  alias MembraneLive.Tokens
  alias MembraneLive.Accounts.User

  @dummy_uuid "5a2771ef-3cf2-4d86-b125-fd366e04bc29"

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
      assert [%{"uuid" => user_uuid}] = json_response(conn, 200)["data"]
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

    test "different user in header", %{conn: conn, user: %{uuid: user_uuid}} do
      fake_user = fake_user_fixture()
      expected_message = unauthorized_error_message(fake_user.uuid, user_uuid)

      conn
      |> put_user_in_auth_header(fake_user)
      |> get(Routes.user_path(conn, :show, user_uuid))
      |> unauthorize_assert(expected_message)
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

    test "reject if updating not the given user", %{conn: conn, user: %{uuid: user_uuid} = user} do
      fake_user = fake_user_fixture()
      expected_msg = unauthorized_error_message(fake_user.uuid, user_uuid)

      conn
      |> put_user_in_auth_header(fake_user)
      |> put(Routes.user_path(conn, :update, user), user: @update_attrs)
      |> unauthorize_assert(expected_msg)
    end
  end

  describe "delete user" do
    test "deletes chosen user", %{conn: conn, user: user} do
      conn = delete(conn, Routes.user_path(conn, :delete, user))
      assert response(conn, 204)

      conn = get(conn, Routes.user_path(conn, :show, user))
      assert response(conn, 404)
    end

    test "reject if deleting not the given user", %{conn: conn, user: %{uuid: user_uuid} = user} do
      fake_user = fake_user_fixture()
      expected_msg = unauthorized_error_message(fake_user.uuid, user_uuid)

      conn
      |> put_user_in_auth_header(fake_user)
      |> delete(Routes.user_path(conn, :delete, user))
      |> unauthorize_assert(expected_msg)
    end
  end

  defp get_valid_bearer() do
    with {:ok, valid_token, _claims} <- Tokens.auth_encode(@dummy_uuid) do
      "Bearer #{valid_token}"
    end
  end

  def unauthorize_assert(conn, expected_msg) do
    assert %{"message" => ^expected_msg} = json_response(conn, 403)
  end

  defp unauthorized_error_message(fake_id, user_id),
    do: "User with uuid #{fake_id} does not have access to user with uuid #{user_id}"
end
