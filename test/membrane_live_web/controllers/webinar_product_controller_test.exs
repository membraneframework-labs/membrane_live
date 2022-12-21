defmodule MembraneLiveWeb.WebinarProductControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.AccountsFixtures
  import MembraneLive.ProductFixtures
  import MembraneLive.WebinarsFixtures
  import MembraneLive.Support.CustomTokenHelperFunctions

  setup %{conn: conn} do
    {:ok, user, conn} =
      conn
      |> put_req_header("accept", "application/json")
      |> set_new_user_token()

    webinar = webinar_fixture(user)
    product = product_fixture()

    {:ok, conn: conn, moderator: user, webinar: webinar, product: product}
  end

  describe "index" do
    test "lists all webinars for event", %{conn: conn, webinar: webinar} do
      conn = get(conn, Routes.webinar_product_path(conn, :index, webinar.uuid))
      assert json_response(conn, 200)["products"] == []
    end
  end

  describe "add product to the webinar" do
    test "moderator adds a product to the webinar", %{
      conn: conn,
      moderator: moderator,
      webinar: webinar,
      product: product
    } do
      conn =
        post(conn, Routes.webinar_product_path(conn, :create, webinar.uuid),
          productId: product.uuid
        )

      # then
      assert %{"product" => inserted_product} = json_response(conn, 201)

      assert product.name == inserted_product["name"]
      assert product.price == inserted_product["price"]
      assert product.item_url == inserted_product["itemUrl"]
      assert product.image_url == inserted_product["imageUrl"]
    end

    test "webinar does not exist", %{conn: conn, product: product} do
      fake_webinar_uuid = UUID.uuid4()

      conn =
        post(conn, Routes.webinar_product_path(conn, :create, fake_webinar_uuid), product.uuid)

      assert json_response(conn, 404)["errors"] != %{}
    end

    test "product does not exist", %{conn: conn, webinar: webinar} do
      fake_product_uuid = UUID.uuid4()

      conn =
        post(conn, Routes.webinar_product_path(conn, :create, webinar.uuid), fake_product_uuid)

      assert json_response(conn, 404)["errors"] != %{}
    end

    test "user is not the moderator of the webinar", %{
      conn: conn,
      webinar: webinar,
      product: product
    } do
      fake_user = fake_user_fixture()

      conn
      |> put_user_in_auth_header(fake_user)
      |> post(Routes.webinar_product_path(conn, :create, webinar.uuid), product.uuid)

      assert json_response(conn, 403)["errors"] != %{}
    end
  end

  describe "remove product from the webinar" do
    test "moderator deletes a product from the webinar", %{
      conn: conn,
      moderator: moderator,
      webinar: webinar
    } do
      # given

      # when

      # then
    end

    test "webinar does not exist" do
    end

    test "product does not exist" do
    end

    test "user is not the moderator of the webinar" do
    end

    # test "deletes chosen webinar", %{conn: conn, webinar: webinar} do
    #   conn = delete(conn, Routes.webinar_path(conn, :delete, webinar))
    #   assert response(conn, 204)

    #   conn = get(conn, Routes.webinar_path(conn, :show, webinar))
    #   assert response(conn, 404)
    # end

    # test "rejects deleting when user in not authorized",
    #      %{conn: conn, webinar: webinar} = context do
    #   webinar_path = Routes.webinar_path(conn, :delete, webinar)
    #   callback = &delete(&1, webinar_path, webinar: webinar)
    #   test_unauthorized_webinar_request(callback, context)
    # end
  end

  # defp test_unauthorized_webinar_request(conn_callback, %{conn: conn, webinar: webinar}) do
  #   fake_user = fake_user_fixture()
  #   expected_msg = unauthorized_error_message(fake_user.uuid, webinar)

  #   conn
  #   |> put_user_in_auth_header(fake_user)
  #   |> then(conn_callback)
  #   |> unauthorize_assert(expected_msg)
  # end
end
