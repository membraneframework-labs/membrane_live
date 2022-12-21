defmodule MembraneLiveWeb.WebinarProductControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.WebinarsFixtures
  import MembraneLive.Support.CustomTokenHelperFunctions

  setup %{conn: conn} do
    {:ok, user, conn} =
      conn
      |> put_req_header("accept", "application/json")
      |> set_new_user_token()

    webinar = webinar_fixture(user)

    {:ok, conn: conn, moderator: user, webinar: webinar}
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
      webinar: webinar
    } do
    end

    test "webinar does not exist" do
    end

    test "product does not exist" do
    end

    test "user is not the moderator of the webinar" do
    end

    # test "renders webinar when data is valid", %{conn: conn, user: user} do
    #   conn = post(conn, Routes.webinar_path(conn, :create), webinar: @create_attrs)
    #   assert %{"link" => link} = json_response(conn, 201)

    #   assert String.starts_with?(link, @link_prefix)

    #   uuid = get_uuid_from_link(link)
    #   {:ok, webinar} = Webinars.get_webinar(uuid)

    #   conn = get(conn, Routes.webinar_path(conn, :show, webinar))

    #   assert %{
    #            "uuid" => ^uuid,
    #            "description" => "some description",
    #            "start_date" => "2022-07-17T10:20:00",
    #            "title" => "some title"
    #          } = json_response(conn, 200)["webinar"]

    #   expected_moderator_id = user.uuid
    #   assert expected_moderator_id == Webinars.get_webinar!(webinar.uuid).moderator_id
    # end

    # test "renders errors when data is invalid", %{conn: conn} do
    #   conn = post(conn, Routes.webinar_path(conn, :create), webinar: @invalid_attrs)
    #   assert json_response(conn, 422)["errors"] != %{}
    # end
  end

  describe "remove product from the webinar" do
    test "moderator deletes a product from the webinar", %{
      conn: conn,
      moderator: moderator,
      webinar: webinar
    } do
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
