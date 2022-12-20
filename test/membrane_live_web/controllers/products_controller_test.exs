defmodule MembraneLiveWeb.ProductsControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.Support.CustomTokenHelperFunctions
  # import MembraneLive.AccountsFixtures

  setup %{conn: conn} do
    {:ok, user, conn} =
      conn
      |> put_req_header("accept", "application/json")
      |> set_new_user_token()

    {:ok, conn: conn, user: user}
  end

  describe "index" do
    test "lists all products", %{conn: conn} do
      conn = get(conn, Routes.product_path(conn, :index))
      assert json_response(conn, 200)["products"] == []
    end

    # test "reject listing if user not authorized", %{conn: conn} do
    # fake_user = fake_user_fixture()
    # expected_msg = "User unauthorized to list products"

    # conn
    # |> put_user_in_auth_header(fake_user)
    # |> get(Routes.product_path(conn, :index))
    # |> unauthorize_assert(expected_msg)
    # end
  end
end
