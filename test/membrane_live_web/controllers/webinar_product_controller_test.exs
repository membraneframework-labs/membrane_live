defmodule MembraneLiveWeb.WebinarProductControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.AccountsFixtures
  import MembraneLive.ProductFixtures
  import MembraneLive.WebinarsFixtures
  import MembraneLive.Support.CustomTokenHelperFunctions

  alias MembraneLive.WebinarsProducts

  setup %{conn: conn} do
    {:ok, user, conn} =
      conn
      |> put_req_header("accept", "application/json")
      |> set_new_user_token()

    webinar = webinar_fixture(user)
    product = product_fixture()

    {:ok, conn: conn, webinar: webinar, product: product}
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
      webinar: webinar,
      product: product
    } do
      conn =
        post(conn, Routes.webinar_product_path(conn, :create, webinar.uuid),
          productId: product.uuid
        )

      # then
      assert WebinarsProducts.product_in_webinar?(product, webinar) == true

      assert %{"product" => inserted_product} = json_response(conn, 201)

      assert product.name == inserted_product["name"]
      assert product.price == inserted_product["price"]
      assert product.item_url == inserted_product["itemUrl"]
      assert product.image_url == inserted_product["imageUrl"]
    end

    test "webinar does not exist", %{conn: conn, product: product} do
      fake_webinar_uuid = UUID.uuid4()

      conn =
        post(conn, Routes.webinar_product_path(conn, :create, fake_webinar_uuid),
          productId: product.uuid
        )

      assert %{"message" => "Webinar does not exist"} = json_response(conn, 404)
    end

    test "product does not exist", %{conn: conn, webinar: webinar} do
      fake_product_uuid = UUID.uuid4()

      conn =
        post(conn, Routes.webinar_product_path(conn, :create, webinar.uuid),
          productId: fake_product_uuid
        )

      assert %{"message" => "Product does not exist"} = json_response(conn, 404)
    end

    test "user is not the moderator of the webinar", %{
      conn: conn,
      webinar: webinar,
      product: product
    } do
      fake_user = fake_user_fixture()

      conn =
        conn
        |> put_user_in_auth_header(fake_user)
        |> post(Routes.webinar_product_path(conn, :create, webinar.uuid), productId: product.uuid)

      unauthorize_assert(conn, "User does not have permission to alter products in this webinar")
    end
  end

  describe "remove product from the webinar" do
    setup [:add_product_to_webinar]

    test "moderator deletes a product from the webinar", %{
      conn: conn,
      webinar: webinar,
      product: product
    } do
      conn = delete(conn, Routes.webinar_product_path(conn, :delete, webinar.uuid, product.uuid))

      assert response(conn, 204)
      assert WebinarsProducts.product_in_webinar?(product, webinar) == false
    end

    test "webinar does not exist", %{conn: conn, product: product} do
      fake_webinar_uuid = UUID.uuid4()

      conn =
        delete(conn, Routes.webinar_product_path(conn, :delete, fake_webinar_uuid, product.uuid))

      assert %{"message" => "Webinar does not exist"} = json_response(conn, 404)
    end

    test "product does not exist", %{conn: conn, webinar: webinar} do
      fake_product_uuid = UUID.uuid4()

      conn =
        delete(conn, Routes.webinar_product_path(conn, :delete, webinar.uuid, fake_product_uuid))

      assert %{"message" => "Product does not exist"} = json_response(conn, 404)
    end

    test "user is not the moderator of the webinar", %{
      conn: conn,
      webinar: webinar,
      product: product
    } do
      fake_user = fake_user_fixture()

      conn =
        conn
        |> put_user_in_auth_header(fake_user)
        |> delete(Routes.webinar_product_path(conn, :delete, webinar.uuid, product.uuid))

      unauthorize_assert(conn, "User does not have permission to alter products in this webinar")
    end
  end

  defp add_product_to_webinar(%{webinar: webinar, product: product}) do
    {:ok, _product} =
      WebinarsProducts.add_product_to_webinar(%{
        :webinar_id => webinar.uuid,
        :product_id => product.uuid
      })

    :ok
  end
end
