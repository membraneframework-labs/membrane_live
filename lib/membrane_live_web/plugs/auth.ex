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

  @doc """
  restricted mode won't let through requests that don't have token in a header.
  """
  @type mode :: :restricted | :unrestricted

  @spec init(mode()) :: mode()
  def init(mode) do
    mode
  end

  def call(conn, mode) do
    with {:ok, token} <- find_token(conn.req_headers, mode),
         {:ok, %{"user_id" => user_id}} <- Tokens.auth_decode(token) do
      assign(conn, :user_id, user_id)
    else
      :unauthorized ->
        assign(conn, :user_id, :unauthorized)

      error ->
        conn
        |> FallbackController.call(TokenErrorInfo.get_error_info(error))
        |> halt()
    end
  end

  defp find_token(headers, mode) do
    headers
    |> Enum.find(fn
      {@auth_header_key, _value} -> true
      _other -> false
    end)
    |> get_value(mode)
  end

  defp get_value(nil, :restricted), do: {:error, :no_jwt_in_header}
  defp get_value(nil, :unrestricted), do: :unauthorized
  defp get_value({_key, "Bearer " <> token}, _mode), do: {:ok, token}
end
