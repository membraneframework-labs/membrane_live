defmodule MembraneLiveWeb.LoginController do
  @moduledoc """
  Controller for login purposes
  """

  use MembraneLiveWeb, :controller

  alias MembraneLive.Tokens

  def index(conn, _params) do
    render(conn, "index.html")
  end

  # TODO add g_csrf handling
  def create(conn, %{"credential" => google_jwt}) do
    {:ok, google_claims} = Tokens.google_decode(google_jwt)
    # todo persist user here
    {:ok, new_token, _claims} = Tokens.custom_encode(google_claims["name"])

    conn
    |> put_status(200)
    |> render("token.json", %{token: new_token})
  end
end
