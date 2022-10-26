defmodule MembraneLiveWeb.RecordingsControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.WebinarsFixtures
  import MembraneLive.Support.CustomTokenHelperFunctions

  alias MembraneLive.Webinars

  @keys [:description, :presenters, :moderators, :start_date, :title, :uuid]
  @num_of_recordings 5

  setup %{conn: conn} do
    {:ok, user, conn} =
      conn
      |> put_req_header("accept", "application/json")
      |> set_new_user_token()

    webinars = for _index <- 1..@num_of_recordings, do: create_and_format_webinar(user)
    Enum.each(webinars, fn %{"uuid" => uuid} -> Webinars.mark_webinar_as_finished(uuid) end)

    {:ok, webinars: webinars, moderator_conn: conn}
  end

  describe "authenticated user" do
    setup [:create_auth_user]

    test "lists all recording", %{conn: conn, webinars: webinars} do
      conn = get(conn, Routes.recordings_path(conn, :index))
      assert Enum.sort(json_response(conn, 200)["webinars"]) == Enum.sort(webinars)
    end

    test "list chosen recording", %{conn: conn, webinars: webinars} do
      conn = get(conn, Routes.recordings_path(conn, :show, hd(webinars)["uuid"]))
      assert json_response(conn, 200)["webinar"] == hd(webinars)
    end

    test "reject deleting chosen recording when not moderator", %{conn: conn, webinars: webinars} do
      conn = delete(conn, Routes.recordings_path(conn, :delete, hd(webinars)["uuid"]))
      assert response(conn, 403)
    end

    test "delete chose recording as a moderator", %{moderator_conn: conn, webinars: webinars} do
      conn = delete(conn, Routes.recordings_path(conn, :delete, hd(webinars)["uuid"]))
      assert response(conn, 204)

      assert length(Webinars.list_recordings()) == @num_of_recordings - 1
    end
  end

  describe "unauthenticated user" do
    setup [:create_unauth_user]

    test "lists all recording", %{conn: conn, webinars: webinars} do
      conn = get(conn, Routes.recordings_path(conn, :index))
      assert Enum.sort(json_response(conn, 200)["webinars"]) == Enum.sort(webinars)
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

  defp create_and_format_webinar(user) do
    webinar_fixture(user)
    |> Map.from_struct()
    |> Map.take(@keys)
    |> Map.update(:start_date, nil, &NaiveDateTime.to_string/1)
    |> Map.update(:start_date, nil, &Regex.replace(~r/(.*) (.*).*/, &1, "\\1T\\2"))
    |> Enum.map(fn {key, value} -> {Atom.to_string(key), value} end)
    |> Map.new(& &1)
  end
end
