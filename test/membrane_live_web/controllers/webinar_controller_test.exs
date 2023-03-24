defmodule MembraneLiveWeb.WebinarControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.WebinarsFixtures
  import MembraneLive.AccountsFixtures
  import MembraneLive.Support.CustomTokenHelperFunctions

  alias MembraneLive.Webinars
  alias MembraneLive.Webinars.Webinar

  @create_attrs %{
    "description" => "some description",
    "presenters" => [],
    "start_date" => ~N[2022-07-17 10:20:00],
    "title" => "some title",
    "is_private" => false
  }
  @update_attrs %{
    "description" => "some updated description",
    "presenters" => [],
    "start_date" => ~N[2022-07-18 10:20:00],
    "title" => "some updated title"
  }
  @invalid_attrs %{
    "description" => nil,
    "presenters" => nil,
    "start_date" => nil,
    "title" => nil
  }

  @link_prefix "/event/"

  setup %{conn: conn} do
    {:ok, user, conn} =
      conn
      |> put_req_header("accept", "application/json")
      |> set_new_user_token()

    {:ok, conn: conn, user: user}
  end

  describe "index" do
    test "lists all webinars", %{conn: conn} do
      conn = get(conn, Routes.webinar_path(conn, :index))
      assert json_response(conn, 200)["webinars"] == []
    end
  end

  describe "create webinar" do
    test "renders webinar when data is valid", %{conn: conn, user: user} do
      conn = post(conn, Routes.webinar_path(conn, :create), webinar: @create_attrs)
      assert %{"link" => link} = json_response(conn, 201)

      assert String.starts_with?(link, @link_prefix)

      uuid = get_uuid_from_link(link)
      {:ok, webinar} = Webinars.get_webinar(uuid)

      conn = get(conn, Routes.webinar_path(conn, :show, webinar))

      assert %{
               "uuid" => ^uuid,
               "description" => "some description",
               "start_date" => "2022-07-17T10:20:00",
               "title" => "some title"
             } = json_response(conn, 200)["webinar"]

      expected_moderator_id = user.uuid
      assert expected_moderator_id == Webinars.get_webinar!(webinar.uuid).moderator_id
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, Routes.webinar_path(conn, :create), webinar: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "show" do
    setup [:create_webinar]

    test "valid request", %{
      conn: conn,
      webinar: %{uuid: webinar_uuid} = webinar
    } do
      conn = get(conn, Routes.webinar_path(conn, :show, webinar))

      assert %{
               "uuid" => ^webinar_uuid,
               "description" => "some description",
               "presenters" => [],
               "start_date" => "2022-07-17T10:20:00",
               "title" => "some title"
             } = json_response(conn, 200)["webinar"]
    end

    test "fetch webinar when user is not the moderator", %{
      conn: conn,
      webinar: %{uuid: webinar_uuid} = webinar
    } do
      {:ok, _user, conn} = set_new_user_token(conn, "_another_user")
      conn = get(conn, Routes.webinar_path(conn, :show, webinar))

      assert %{
               "uuid" => ^webinar_uuid,
               "description" => "some description",
               "presenters" => [],
               "start_date" => "2022-07-17T10:20:00",
               "title" => "some title"
             } = json_response(conn, 200)["webinar"]
    end
  end

  describe "update webinar" do
    setup [:create_webinar]

    test "renders webinar when data is valid", %{
      conn: conn,
      webinar: %Webinar{uuid: uuid} = webinar
    } do
      conn = put(conn, Routes.webinar_path(conn, :update, webinar), webinar: @update_attrs)
      assert %{"uuid" => ^uuid} = json_response(conn, 200)["webinar"]

      conn = get(conn, Routes.webinar_path(conn, :show, uuid))

      assert %{
               "uuid" => ^uuid,
               "description" => "some updated description",
               "presenters" => [],
               "start_date" => "2022-07-18T10:20:00",
               "title" => "some updated title"
             } = json_response(conn, 200)["webinar"]
    end

    test "renders errors when data is invalid", %{conn: conn, webinar: webinar} do
      conn = put(conn, Routes.webinar_path(conn, :update, webinar), webinar: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end

    test "rejects when user not authorized", %{conn: conn, webinar: webinar} = context do
      webinar_path = Routes.webinar_path(conn, :update, webinar)
      callback = &put(&1, webinar_path, webinar: @update_attrs)
      test_unauthorized_webinar_request(callback, context)
    end
  end

  describe "unauthenticated user" do
    setup [:create_webinar]

    test "get webinar", %{webinar: %{uuid: webinar_uuid} = webinar} do
      conn =
        build_conn()
        |> put_req_header("accept", "application/json")

      conn = get(conn, Routes.webinar_path(conn, :show, webinar))

      assert %{
               "uuid" => ^webinar_uuid,
               "description" => "some description",
               "presenters" => [],
               "start_date" => "2022-07-17T10:20:00",
               "title" => "some title"
             } = json_response(conn, 200)["webinar"]
    end

    test "lists all webinars", %{conn: conn, webinar: %{uuid: webinar_uuid} = _webinar} do
      conn = get(conn, Routes.webinar_path(conn, :index))

      assert [
               %{
                 "uuid" => ^webinar_uuid,
                 "description" => "some description",
                 "presenters" => [],
                 "start_date" => "2022-07-17T10:20:00",
                 "title" => "some title",
                 "is_private" => false
               }
             ] = json_response(conn, 200)["webinars"]
    end
  end

  describe "private webinars" do
    setup [:create_private_webinar]

    test "list private webinar for owner", %{webinar: %{uuid: webinar_uuid}, conn: conn} do
      conn = get(conn, Routes.webinar_path(conn, :index))

      assert [
               %{
                 "uuid" => ^webinar_uuid,
                 "description" => "some description",
                 "presenters" => [],
                 "start_date" => "2022-07-17T10:20:00",
                 "title" => "some title",
                 "is_private" => true
               }
             ] = json_response(conn, 200)["webinars"]
    end

    test "don't list private webinar for unauthenticated user" do
      conn =
        build_conn()
        |> put_req_header("accept", "application/json")

      conn = get(conn, Routes.webinar_path(conn, :index))
      assert json_response(conn, 200)["webinars"] == []
    end

    test "don't list private webinar for authenticated user who isn't the owner", %{
      conn: conn
    } do
      {:ok, _user, conn} =
        conn
        |> put_req_header("accept", "application/json")
        |> set_new_user_token("1")

      conn = get(conn, Routes.webinar_path(conn, :index))
      assert json_response(conn, 200)["webinars"] == []
    end
  end

  describe "delete webinar" do
    setup [:create_webinar]

    test "deletes chosen webinar", %{conn: conn, webinar: webinar} do
      conn = delete(conn, Routes.webinar_path(conn, :delete, webinar))
      assert response(conn, 204)

      conn = get(conn, Routes.webinar_path(conn, :show, webinar))
      assert response(conn, 404)
    end

    test "rejects deleting when user in not authorized",
         %{conn: conn, webinar: webinar} = context do
      webinar_path = Routes.webinar_path(conn, :delete, webinar)
      callback = &delete(&1, webinar_path, webinar: webinar)
      test_unauthorized_webinar_request(callback, context)
    end
  end

  defp create_webinar(%{user: user}) do
    webinar = webinar_fixture(user)
    %{webinar: webinar}
  end

  defp create_private_webinar(%{user: user}) do
    webinar = webinar_fixture(%{"is_private" => true}, user)
    %{webinar: webinar}
  end

  defp get_uuid_from_link(viewer_link) do
    String.replace_prefix(viewer_link, "/event/", "")
  end

  defp test_unauthorized_webinar_request(conn_callback, %{conn: conn, webinar: webinar}) do
    fake_user = fake_user_fixture()
    expected_msg = unauthorized_error_message(fake_user.uuid, webinar)

    conn
    |> put_user_in_auth_header(fake_user)
    |> then(conn_callback)
    |> unauthorize_assert(expected_msg)
  end
end
