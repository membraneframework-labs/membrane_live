defmodule MembraneLiveWeb.Plugs.Auth do
  @moduledoc """
  Plug responsible for fetching jwt token from HTTP request,
  decoding it and assigning decoded user_id to conn object
  """
  import Plug.Conn
  alias MembraneLive.Tokens
  alias MembraneLiveWeb.FallbackController
  alias MembraneLiveWeb.Helpers.TokenErrorInfo

  @auth_header_key "authorization"

  @spec init(any) :: any
  def init(default), do: default

  def call(conn, _default) do
    with {@auth_header_key, "Bearer " <> token} <-
           find_header_value(conn.req_headers, @auth_header_key),
         {:ok, %{"user_id" => user_id}} <- Tokens.auth_decode(token) do
      assign(conn, :user_id, user_id)
    else
      err ->
        FallbackController.call(conn, TokenErrorInfo.get_error_info(err))
        |> halt()
    end
  end

  defp find_header_value(headers, key),
    do: Enum.find(headers, fn elem -> match?({^key, _value}, elem) end)
end
