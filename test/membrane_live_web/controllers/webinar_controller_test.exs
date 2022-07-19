defmodule MembraneLiveWeb.WebinarControllerTest do
  # use MembraneLiveWeb.ConnCase

  # import MembraneLive.WebinarsFixtures

  # alias MembraneLive.Webinars.Webinar

  # @create_attrs %{
  #   description: "some description",
  #   moderator_link: "some moderator_link",
  #   presenters: [],
  #   start_date: ~N[2022-07-17 10:20:00],
  #   title: "some title",
  #   viewer_link: "some viewer_link"
  # }
  # @update_attrs %{
  #   description: "some updated description",
  #   moderator_link: "some updated moderator_link",
  #   presenters: [],
  #   start_date: ~N[2022-07-18 10:20:00],
  #   title: "some updated title",
  #   viewer_link: "some updated viewer_link"
  # }
  # @invalid_attrs %{
  #   description: nil,
  #   moderator_link: nil,
  #   presenters: nil,
  #   start_date: nil,
  #   title: nil,
  #   viewer_link: nil
  # }

  # setup %{conn: conn} do
  #   {:ok, conn: put_req_header(conn, "accept", "application/json")}
  # end

  # describe "index" do
  #   test "lists all webinars", %{conn: conn} do
  #     conn = get(conn, Routes.webinar_path(conn, :index))
  #     assert json_response(conn, 200)["data"] == []
  #   end
  # end

  # describe "create webinar" do
  #   test "renders webinar when data is valid", %{conn: conn} do
  #     conn = post(conn, Routes.webinar_path(conn, :create), webinar: @create_attrs)
  #     assert %{"id" => id} = json_response(conn, 201)["data"]

  #     conn = get(conn, Routes.webinar_path(conn, :show, id))

  #     assert %{
  #              "id" => ^id,
  #              "description" => "some description",
  #              "moderator_link" => "some moderator_link",
  #              "presenters" => [],
  #              "start_date" => "2022-07-17T10:20:00",
  #              "title" => "some title",
  #              "viewer_link" => "some viewer_link"
  #            } = json_response(conn, 200)["data"]
  #   end

  #   test "renders errors when data is invalid", %{conn: conn} do
  #     conn = post(conn, Routes.webinar_path(conn, :create), webinar: @invalid_attrs)
  #     assert json_response(conn, 422)["errors"] != %{}
  #   end
  # end

  # describe "update webinar" do
  #   setup [:create_webinar]

  #   test "renders webinar when data is valid", %{conn: conn, webinar: %Webinar{id: id} = webinar} do
  #     conn = put(conn, Routes.webinar_path(conn, :update, webinar), webinar: @update_attrs)
  #     assert %{"id" => ^id} = json_response(conn, 200)["data"]

  #     conn = get(conn, Routes.webinar_path(conn, :show, id))

  #     assert %{
  #              "id" => ^id,
  #              "description" => "some updated description",
  #              "moderator_link" => "some updated moderator_link",
  #              "presenters" => [],
  #              "start_date" => "2022-07-18T10:20:00",
  #              "title" => "some updated title",
  #              "viewer_link" => "some updated viewer_link"
  #            } = json_response(conn, 200)["data"]
  #   end

  #   test "renders errors when data is invalid", %{conn: conn, webinar: webinar} do
  #     conn = put(conn, Routes.webinar_path(conn, :update, webinar), webinar: @invalid_attrs)
  #     assert json_response(conn, 422)["errors"] != %{}
  #   end
  # end

  # describe "delete webinar" do
  #   setup [:create_webinar]

  #   test "deletes chosen webinar", %{conn: conn, webinar: webinar} do
  #     conn = delete(conn, Routes.webinar_path(conn, :delete, webinar))
  #     assert response(conn, 204)

  #     assert_error_sent(404, fn ->
  #       get(conn, Routes.webinar_path(conn, :show, webinar))
  #     end)
  #   end
  # end

  # defp create_webinar(_webinar) do
  #   webinar = webinar_fixture()
  #   %{webinar: webinar}
  # end
end
