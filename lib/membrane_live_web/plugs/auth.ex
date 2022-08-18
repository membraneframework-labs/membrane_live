defmodule MembraneLiveWeb.Plugs.Auth do
  @moduledoc """
  Plug responsible for fetching jwt token from HTTP request,
  decoding it and assigning decoded user_id to conn object
  """
  import Plug.Conn
  alias MembraneLive.Tokens
  alias MembraneLiveWeb.FallbackController

  @auth_header_key "authorization"
  # @ref_token_header_key "refreshtoken"

  @spec init(any) :: any
  def init(default), do: default

  def call(conn, _default) do
    with {@auth_header_key, "Bearer " <> token} <-
           find_header_value(conn.req_headers, @auth_header_key),
         {:ok, %{"user_id" => user_id}} <- Tokens.auth_decode(token) do
      assign(conn, :user_id, user_id)
    else
      # {:error, [{:message, "Invalid token"} | [{:claim, "exp"} | _tail]]} ->
      #   {@ref_token_header_key, ref_token} =
      #     find_header_value(conn.req_headers, @ref_token_header_key)

      #   process_refresh_token(ref_token)

      err ->
        FallbackController.call(conn, get_error_info(err))
        |> halt()
    end
  end

  # defp process_refresh_token(ref_token) do
  #   Token.decode
  # end

  defp find_header_value(headers, key),
    do: Enum.find(headers, fn elem -> match?({^key, _value}, elem) end)

  defp get_error_info(nil), do: %{error: :bad_request, message: "Lack of authentication data"}

  defp get_error_info({:error, :signature_error}),
    do: %{error: :unauthorized, message: "Token has an invalid signature"}

  defp get_error_info({:error, [{:message, "Invalid token"} | [{:claim, "exp"} | _tail]]}),
    do: %{error: :unauthorized, message: "Auth token expiration time exceeded"}

  defp get_error_info({:error, _error_reason}),
    do: %{error: :unauthorized, message: "Unknown token validation error"}
end
