defmodule MembraneLiveWeb.AuthPlugIntegrationTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.WebinarsFixtures
  import MembraneLive.AccountsFixtures

  alias MembraneLive.Support.AuthTokenMock

  @dummy_uuid "5a2771ef-3cf2-4d86-b125-fd366e04bc29"

  @endpoint_atoms [:create, :index, :update, :delete, :show]
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

    Enum.map(@webinar_endpoint_infos, fn %{endpoint_atom: atom} = info ->
      test "[401] #{atom} webinar", %{conn: conn_with_wrong_bearer} do
        test_webinar_endpoint(conn_with_wrong_bearer, unquote(Macro.escape(info)))
      end
    end)

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

    Enum.map(@user_endpoint_infos, fn %{endpoint_atom: atom} = info ->
      test "[401] user #{atom} resources test", %{conn: conn_with_wrong_bearer} do
        test_user_endpoint(conn_with_wrong_bearer, unquote(Macro.escape(info)))
      end
    end)

    defp test_user_endpoint(conn, %{endpoint_atom: atom} = endpoint_info)
         when atom in @arity_2_endpoints do
      test_endpoint(&Routes.user_path/2, conn, endpoint_info)
    end

    defp test_user_endpoint(conn, %{endpoint_atom: atom} = endpoint_info)
         when atom in @arity_3_endpoints do
      test_endpoint(&Routes.user_path/3, conn, endpoint_info)
    end
  end

  defp test_endpoint(routing_function, conn, %{endpoint_atom: atom} = endpoint_info)
       when atom in @endpoint_atoms do
    req_args = compute_req_args(routing_function, conn, endpoint_info)

    atom
    |> endpoint_atom_to_function()
    |> apply(req_args)
    |> assert_status_is_401()
  end

  defp compute_req_args(routing_function, conn, %{endpoint_atom: atom, body: body}) do
    [conn, compute_routing_function(routing_function, conn, atom), body]
  end

  defp compute_req_args(routing_function, conn, %{endpoint_atom: atom}) do
    [conn, compute_routing_function(routing_function, conn, atom)]
  end

  defp compute_routing_function(routing_function, conn, atom) do
    case :erlang.fun_info(routing_function)[:arity] do
      2 -> routing_function.(conn, atom)
      3 -> routing_function.(conn, atom, @dummy_uuid)
    end
  end

  # since we return a function, this cannot be converted to a module attribute map
  defp endpoint_atom_to_function(:create), do: &post/3
  defp endpoint_atom_to_function(:update), do: &put/3
  defp endpoint_atom_to_function(:index), do: &get/2
  defp endpoint_atom_to_function(:show), do: &get/2
  defp endpoint_atom_to_function(:delete), do: &delete/2

  defp assert_status_is_401(conn), do: conn |> response(401) |> assert()

  defp get_invalid_bearer() do
    "Bearer #{AuthTokenMock.wrongly_signed_jwt("InVaLiD SeCrEt")}"
  end
end
