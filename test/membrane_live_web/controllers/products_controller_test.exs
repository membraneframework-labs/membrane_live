defmodule MembraneLiveWeb.ProductsControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.Support.CustomTokenHelperFunctions

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
  end
end
