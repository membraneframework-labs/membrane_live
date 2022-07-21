defmodule MembraneLiveWeb.WebinarControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.WebinarsFixtures

  alias MembraneLive.Webinars
  alias MembraneLive.Webinars.Webinar

  @create_attrs %{
    "description" => "some description",
    "presenters" => [],
    "start_date" => ~N[2022-07-17 10:20:00],
    "title" => "some title"
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
  @moderator_link_suffix "/moderator"

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all webinars", %{conn: conn} do
      conn = get(conn, Routes.webinar_path(conn, :index))
      assert json_response(conn, 200)["webinars"] == []
    end
  end

  describe "create webinar" do
    test "renders webinar when data is valid", %{conn: conn} do
      conn = post(conn, Routes.webinar_path(conn, :create), webinar: @create_attrs)

      assert %{"viewer_link" => viewer_link, "moderator_link" => moderator_link} =
               json_response(conn, 201)["webinar_links"]

      assert String.starts_with?(viewer_link, @link_prefix)
      assert String.starts_with?(moderator_link, @link_prefix)

      assert String.ends_with?(moderator_link, @moderator_link_suffix)

      uuid = get_uuid_from_link(viewer_link)
      webinar = Webinars.get_webinar(uuid)

      conn = get(conn, Routes.webinar_path(conn, :show, webinar.uuid))

      assert %{
               "uuid" => ^uuid,
               "description" => "some description",
               "start_date" => "2022-07-17T10:20:00",
               "title" => "some title"
             } = json_response(conn, 200)["webinar"]
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, Routes.webinar_path(conn, :create), webinar: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
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
  end

  describe "delete webinar" do
    setup [:create_webinar]

    test "deletes chosen webinar", %{conn: conn, webinar: webinar} do
      conn = delete(conn, Routes.webinar_path(conn, :delete, webinar))
      assert response(conn, 204)

      conn = get(conn, Routes.webinar_path(conn, :show, webinar))
      assert response(conn, 404)
    end
  end

  defp create_webinar(_webinar) do
    webinar = webinar_fixture()
    %{webinar: webinar}
  end

  defp get_uuid_from_link(viewer_link) do
    String.replace_prefix(viewer_link, "webinars/events/", "")
  end
end
