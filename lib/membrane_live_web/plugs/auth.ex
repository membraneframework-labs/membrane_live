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
         {:ok, %{"user_id" => user_id}} <- Tokens.custom_decode(token) do
      assign(conn, :user_id, user_id)
    else
      err ->
        message = get_error_message(err)

        FallbackController.call(
          conn,
          %{error: :unauthorized, message: message}
        )
        |> halt()
    end
  end

  defp find_bearer(headers) do
    Enum.find(headers, fn elem -> match?({"authorization", _value}, elem) end)
  end

  defp get_error_message(nil), do: "Lack of authentication data"
  defp get_error_message({:error, :signature_error}), do: "Token has an invalid signature"
end
