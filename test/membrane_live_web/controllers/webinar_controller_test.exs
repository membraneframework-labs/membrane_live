defmodule MembraneLiveWeb.WebinarControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.WebinarsFixtures
  import MembraneLive.AccountsFixtures

  alias MembraneLive.Accounts.User
  alias MembraneLive.Tokens
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

    test "reject if user is not authorized", %{
      conn: conn,
      webinar: %{uuid: webinar_id} = webinar,
      user: %{uuid: user_id}
    } do
      fake_user = fake_user_fixture()

      conn
      |> put_user_in_auth_header(fake_user)
      |> get(Routes.webinar_path(conn, :show, webinar))
      |> unauthorize_assert(webinar_id, fake_user.uuid)
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

    test "rejects when user not authorized", %{
      conn: conn,
      webinar: %Webinar{uuid: webinar_uuid} = webinar
    } do
      fake_user = fake_user_fixture()

      conn
      |> put_user_in_auth_header(fake_user)
      |> put(Routes.webinar_path(conn, :update, webinar), webinar: @update_attrs)
      |> unauthorize_assert(webinar_uuid, fake_user.uuid)
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

    test "rejects deleting when user in not authorized", %{
      conn: conn,
      webinar: %Webinar{uuid: webinar_uuid} = webinar
    } do
      fake_user = fake_user_fixture()

      conn
      |> put_user_in_auth_header(fake_user)
      |> delete(Routes.webinar_path(conn, :delete, webinar), webinar: webinar)
      |> unauthorize_assert(webinar_uuid, fake_user.uuid)
    end
  end

  defp set_new_user_token(conn) do
    google_claims = %{
      "name" => "mock_user",
      "email" => "mock_email@gmail.com",
      "picture" => "https://google.com"
    }

    {:ok, user, token} = create_user_with_token(google_claims)

    conn = put_req_header(conn, "authorization", get_valid_bearer(token))

    {:ok, user, conn}
  end

  defp put_user_in_auth_header(conn, %User{uuid: uuid}) do
    {:ok, token, _claims} = Tokens.auth_encode(uuid)
    put_req_header(conn, "authorization", get_valid_bearer(token))
  end

  defp create_webinar(%{user: user}) do
    webinar = webinar_fixture(user)
    %{webinar: webinar}
  end

  defp get_uuid_from_link(viewer_link) do
    String.replace_prefix(viewer_link, "/event/", "")
  end

  defp get_valid_bearer(token) do
    "Bearer #{token}"
  end

  defp unauthorize_assert(conn, webinar_id, user_id) do
    expected_msg = unauthorized_error_message(webinar_id, user_id)
    assert %{"message" => ^expected_msg} = json_response(conn, 403)
  end

  defp unauthorized_error_message(webinar_id, user_id),
    do: "User with uuid #{user_id} does not have access to webinar with uuid #{webinar_id}"
end
