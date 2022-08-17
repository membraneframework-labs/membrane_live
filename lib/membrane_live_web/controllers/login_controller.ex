defmodule MembraneLiveWeb.LoginController do
  @moduledoc """
  Controller for login purposes
  """

  use MembraneLiveWeb, :controller

  alias MembraneLive.Accounts
  alias MembraneLive.Tokens

  plug(MembraneLiveWeb.Plugs.Auth when action in [:check])

  def index(conn, _params) do
    render(conn, "index.html")
  end

  # TODO add g_csrf handling
  def create(conn, %{"credential" => google_jwt}) do
    {:ok, google_claims} = Tokens.google_decode(google_jwt)
    {:ok, user} = Accounts.create_user_if_not_exists(google_claims)
    {:ok, new_token, _claims} = Tokens.custom_encode(user.uuid)

    conn
    |> put_status(200)
    |> render("token.json", %{token: new_token})
  end

  def check(conn, _params) do
    send_resp(conn, 200, "Token OK")
  end
end
