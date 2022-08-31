defmodule MembraneLiveWeb.AuthPlugIntegrationTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.WebinarsFixtures
  import MembraneLive.AccountsFixtures

  alias MembraneLive.Support.AuthTokenMock

  @dummy_uuid "5a2771ef-3cf2-4d86-b125-fd366e04bc29"

  @arity_2_endpoints [:create, :index]
  @arity_3_endpoints [:update, :delete, :show]

  setup %{conn: conn} do
    conn_with_wrong_bearer =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("authorization", get_invalid_bearer())

    {:ok, conn: conn_with_wrong_bearer}
  end

  describe "webinar" do
    @webinar_endpoint_infos [
      %{endpoint_atom: :create, body: %{webinar: webinar_attrs()}},
      %{endpoint_atom: :update, body: %{webinar: webinar_attrs()}},
      %{endpoint_atom: :delete},
      %{endpoint_atom: :show},
      %{endpoint_atom: :index}
    ]

    test "[401] webinar resources auth test", %{conn: conn_with_wrong_bearer} do
      Enum.map(@webinar_endpoint_infos, &test_webinar_endpoint(conn_with_wrong_bearer, &1))
    end

    defp test_webinar_endpoint(conn, %{endpoint_atom: atom} = endpoint_info)
         when atom in @arity_2_endpoints do
      test_endpoint(&Routes.webinar_path/2, conn, endpoint_info)
    end

    defp test_webinar_endpoint(conn, %{endpoint_atom: atom} = endpoint_info)
         when atom in @arity_3_endpoints do
      test_endpoint(&Routes.webinar_path/3, conn, endpoint_info)
    end
  end

  describe "user" do
    @user_endpoint_infos [
      %{endpoint_atom: :update, body: %{user: user_attrs()}},
      %{endpoint_atom: :delete},
      %{endpoint_atom: :show},
      %{endpoint_atom: :index}
    ]

    test "[401] user resources auth test", %{conn: conn_with_wrong_bearer} do
      Enum.map(@user_endpoint_infos, &test_user_endpoint(conn_with_wrong_bearer, &1))
    end

    defp test_user_endpoint(conn, %{endpoint_atom: atom} = endpoint_info)
         when atom in @arity_2_endpoints do
      test_endpoint(&Routes.user_path/2, conn, endpoint_info)
    end

    defp test_user_endpoint(conn, %{endpoint_atom: atom} = endpoint_info)
         when atom in @arity_3_endpoints do
      test_endpoint(&Routes.user_path/3, conn, endpoint_info)
    end
  end

  defp test_endpoint(routing_function, conn, %{endpoint_atom: :create, body: body}) do
    conn
    |> post(routing_function.(conn, :create), body)
    |> assert_status_is_401()
  end

  defp test_endpoint(routing_function, conn, %{endpoint_atom: :update, body: body}) do
    conn
    |> put(routing_function.(conn, :update, @dummy_uuid), body)
    |> assert_status_is_401()
  end

  defp test_endpoint(routing_function, conn, %{endpoint_atom: :delete}) do
    conn
    |> delete(routing_function.(conn, :delete, @dummy_uuid))
    |> assert_status_is_401()
  end

  defp test_endpoint(routing_function, conn, %{endpoint_atom: :show}) do
    conn
    |> get(routing_function.(conn, :show, @dummy_uuid))
    |> assert_status_is_401()
  end

  defp test_endpoint(routing_function, conn, %{endpoint_atom: :index}) do
    conn
    |> get(routing_function.(conn, :index))
    |> assert_status_is_401()
  end

  defp assert_status_is_401(conn), do: conn |> response(401) |> assert()

  defp get_invalid_bearer() do
    "Bearer #{AuthTokenMock.wrongly_signed_jwt("InVaLiD SeCrEt")}"
  end
end
