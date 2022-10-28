defmodule MembraneLiveWeb.LoginController do
  @moduledoc """
  Controller for login purposes
  """

  use MembraneLiveWeb, :controller

  alias MembraneLive.{Accounts, Tokens}
  alias MembraneLiveWeb.Helpers.TokenErrorInfo

  action_fallback(MembraneLiveWeb.FallbackController)

  def create(conn, %{"credential" => google_jwt}) do
    with {:ok, google_claims} <- Tokens.google_decode(google_jwt),
         {:ok, user} <- Accounts.create_user_if_not_exists(google_claims) do
      return_tokens(conn, user.uuid)
    else
      err -> TokenErrorInfo.get_error_info(err)
    end
  end

  def refresh(conn, %{"refreshToken" => old_refresh_token}) do
    with {:ok, %{"user_id" => user_id}} <- Tokens.refresh_decode(old_refresh_token) do
      return_tokens(conn, user_id)
    else
      err -> TokenErrorInfo.get_error_info(err)
    end
  end

  defp return_tokens(conn, user_id) do
    {:ok, auth_token, _claims} = Tokens.auth_encode(user_id)
    {:ok, refresh_token, _claims} = Tokens.refresh_encode(user_id)

    conn
    |> put_status(200)
    |> render("token.json", %{auth_token: auth_token, refresh_token: refresh_token})
  end
end
