defmodule MembraneLiveWeb.RecordingsControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.WebinarsFixtures
  import MembraneLive.Support.CustomTokenHelperFunctions

  alias MembraneLive.Webinars

  @keys [:description, :presenters, :start_date, :title, :uuid, :is_private]

  @num_of_public_recordings 5
  @num_of_private_recordings 2

  setup %{conn: conn} do
    {:ok, user, conn} =
      conn
      |> put_req_header("accept", "application/json")
      |> set_new_user_token()

    public_webinars =
      for _index <- 1..@num_of_public_recordings,
          do: create_and_format_webinar(user)

    private_webinars =
      for _index <- 1..@num_of_private_recordings,
          do: create_and_format_webinar(%{"is_private" => true}, user)

    webinars = public_webinars ++ private_webinars

    Enum.each(webinars, fn %{"uuid" => uuid} -> Webinars.mark_webinar_as_finished(uuid) end)

    {:ok,
     webinars: webinars,
     public_webinars: public_webinars,
     private_webinars: private_webinars,
     moderator_conn: conn,
     user: user}
  end

  describe "authenticated user" do
    setup [:create_auth_user]

    test "lists all recording for moderator user", %{
      moderator_conn: conn,
      webinars: webinars,
      user: user
    } do
      conn = get(conn, Routes.recordings_path(conn, :index))

      assert Enum.sort(json_response(conn, 200)["webinars"]) ==
               Enum.sort(add_moderator_email_to_webinars(webinars, user))
    end

    test "lists all recording", %{conn: conn, public_webinars: public_webinars, user: user} do
      conn = get(conn, Routes.recordings_path(conn, :index))

      assert Enum.sort(json_response(conn, 200)["webinars"]) ==
               Enum.sort(add_moderator_email_to_webinars(public_webinars, user))
    end

    test "list chosen recording", %{conn: conn, webinars: webinars} do
      conn = get(conn, Routes.recordings_path(conn, :show, hd(webinars)["uuid"]))
      assert json_response(conn, 200)["webinar"] == hd(webinars)
    end

    test "reject deleting chosen recording when not moderator", %{conn: conn, webinars: webinars} do
      conn = delete(conn, Routes.recordings_path(conn, :delete, hd(webinars)["uuid"]))
      assert response(conn, 403)
    end

    test "delete chosen recording as a moderator", %{
      user: user,
      moderator_conn: conn,
      webinars: webinars
    } do
      conn = delete(conn, Routes.recordings_path(conn, :delete, hd(webinars)["uuid"]))
      assert response(conn, 204)

      assert length(Webinars.list_recordings(user.uuid)) ==
               @num_of_private_recordings + @num_of_public_recordings - 1
    end
  end

  describe "unauthenticated user" do
    setup [:create_unauth_user]

    test "lists all recording", %{conn: conn, public_webinars: public_webinars, user: user} do
      conn = get(conn, Routes.recordings_path(conn, :index))

      assert Enum.sort(json_response(conn, 200)["webinars"]) ==
               Enum.sort(add_moderator_email_to_webinars(public_webinars, user))
    end

    test "list chosen recording", %{conn: conn, webinars: webinars} do
      conn = get(conn, Routes.recordings_path(conn, :show, hd(webinars)["uuid"]))
      assert json_response(conn, 200)["webinar"] == hd(webinars)
    end

    test "delete chosen recording", %{conn: conn, webinars: webinars} do
      conn = delete(conn, Routes.recordings_path(conn, :delete, hd(webinars)["uuid"]))
      assert response(conn, 400)
    end
  end

  defp create_auth_user(_params) do
    {:ok, _user, conn} =
      build_conn()
      |> put_req_header("accept", "application/json")
      |> set_new_user_token("non_webinar_creator")

    %{conn: conn}
  end

  defp create_unauth_user(_params) do
    conn =
      build_conn()
      |> put_req_header("accept", "application/json")

    %{conn: conn}
  end

  defp add_moderator_email_to_webinars(webinars, user) do
    Enum.map(webinars, &Map.put(&1, "moderator_email", user.email))
  end

  defp create_and_format_webinar(attr \\ %{}, user) do
    webinar_fixture(attr, user)
    |> Map.from_struct()
    |> Map.take(@keys)
    |> Map.update(:start_date, nil, &NaiveDateTime.to_string/1)
    |> Map.update(:start_date, nil, &Regex.replace(~r/(.*) (.*).*/, &1, "\\1T\\2"))
    |> Enum.map(fn {key, value} -> {Atom.to_string(key), value} end)
    |> Map.new(& &1)
  end
end
