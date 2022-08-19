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
    with "Bearer " <> token <- find_bearer(conn.req_headers),
         {:ok, %{"user_id" => user_id}} <- Tokens.auth_decode(token) do
      assign(conn, :user_id, user_id)
    else
      err ->
        conn
        |> FallbackController.call(TokenErrorInfo.get_error_info(err))
        |> halt()
    end
  end

  defp find_bearer(headers) do
    headers
    |> Enum.find(fn
      {@auth_header_key, _value} -> true
      _other -> false
    end)
    |> get_value()
  end

  defp get_value(nil), do: {:error, :no_jwt_in_header}
  defp get_value({_key, value}), do: value
end
