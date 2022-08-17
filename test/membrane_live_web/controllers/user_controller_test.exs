defmodule MembraneLiveWeb.UserControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.AccountsFixtures
  alias MembraneLive.Tokens

  alias MembraneLive.Accounts.User

  @dummy_uuid "5a2771ef-3cf2-4d86-b125-fd366e04bc29"

  @create_attrs %{
    email: "john@gmail.com",
    name: "John Kowalski",
    picture: "kowalski.img"
  }
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
    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("authorization", get_valid_bearer())

    {:ok, conn: conn}
  end

  describe "index" do
    test "lists all users", %{conn: conn} do
      conn = get(conn, Routes.user_path(conn, :index))
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create user" do
    test "renders user when data is valid", %{conn: conn} do
      conn = post(conn, Routes.user_path(conn, :create), user: @create_attrs)
      assert %{"uuid" => uuid} = json_response(conn, 201)["data"]

      conn = get(conn, Routes.user_path(conn, :show, uuid))

      assert %{
               "uuid" => ^uuid,
               "email" => "john@gmail.com",
               "name" => "John Kowalski",
               "picture" => "kowalski.img"
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, Routes.user_path(conn, :create), user: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update user" do
    setup [:create_user]

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
  end

  describe "delete user" do
    setup [:create_user]

    test "deletes chosen user", %{conn: conn, user: user} do
      conn = delete(conn, Routes.user_path(conn, :delete, user))
      assert response(conn, 204)

      conn = get(conn, Routes.user_path(conn, :show, user))
      assert response(conn, 404)
    end
  end

  defp create_user(_user) do
    user = user_fixture()
    %{user: user}
  end

  defp get_valid_bearer() do
    with {:ok, valid_token, _claims} <- Tokens.custom_encode(@dummy_uuid) do
      "Bearer #{valid_token}"
    end
  end
end
