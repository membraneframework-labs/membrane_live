defmodule MembraneLiveWeb.Plugs.Auth do
  @moduledoc """
  Plug responsible for fetching jwt token from HTTP request,
  decoding it and assigning decoded user_id to conn object
  """
  import Plug.Conn
  alias MembraneLive.Tokens
  alias MembraneLiveWeb.FallbackController

  def init(default), do: default

  def call(conn, _default) do
    with {"authorization", "Bearer " <> token} <- find_bearer(conn.req_headers),
         {:ok, %{"user_id" => user_id}} <- Tokens.auth_decode(token) do
      assign(conn, :user_id, user_id)
    else
      err ->
        FallbackController.call(conn, get_error_info(err))
        |> halt()
    end
  end

  defp find_bearer(headers),
    do: Enum.find(headers, fn elem -> match?({"authorization", _value}, elem) end)

  defp get_error_info(nil), do: %{error: :bad_request, message: "Lack of authentication data"}

  defp get_error_info({:error, :signature_error}),
    do: %{error: :unauthorized, message: "Token has an invalid signature"}

  defp get_error_info({:error, _error_reason}),
    do: %{error: :unauthorized, message: "Unknown token validation error"}
end
