defmodule MembraneLiveWeb.AuthPlugIntegrationTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.WebinarsFixtures
  import MembraneLive.AccountsFixtures

  alias MembraneLive.Support.AuthTokenMock

  @dummy_uuid "5a2771ef-3cf2-4d86-b125-fd366e04bc29"

  @endpoint_atoms [:create, :index, :update, :delete, :show]
  @endpoints_with_id [:update, :delete, :show]

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
      %{endpoint_atom: :delete}
    ]

    Enum.map(@webinar_endpoint_infos, fn %{endpoint_atom: atom} = info ->
      test "[401] #{atom} webinar", %{conn: conn_with_wrong_bearer} do
        test_endpoint(conn_with_wrong_bearer, :webinar_path, unquote(Macro.escape(info)))
      end
    end)
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
        test_endpoint(conn_with_wrong_bearer, :user_path, unquote(Macro.escape(info)))
      end
    end)
  end

  defp test_endpoint(conn, routing_atom, %{endpoint_atom: atom} = endpoint_info)
       when atom in @endpoint_atoms do
    default_req_args = [conn, compute_path(conn, routing_atom, atom)]

    req_args =
      if Map.has_key?(endpoint_info, :body),
        do: default_req_args ++ [endpoint_info[:body]],
        else: default_req_args

    atom
    |> endpoint_atom_to_function()
    |> apply(req_args)
    |> assert_status_is_401()
  end

  defp compute_path(conn, routing_atom, endpoint_atom) do
    default_args = [conn, endpoint_atom]

    args =
      if endpoint_atom in @endpoints_with_id,
        do: default_args ++ [@dummy_uuid],
        else: default_args

    apply(Routes, routing_atom, args)
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
