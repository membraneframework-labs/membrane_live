defmodule MembraneLiveWeb.Plugs.BearerPlug do
  @moduledoc """
  Plug responsible for fetching jwt token from HTTP request,
  decoding it and assigning decoded user_id to conn object
  """
  import Plug.Conn
  alias MembraneLive.Tokens
  alias MembraneLiveWeb.FallbackController

  def init(default), do: default

  def call(conn, _default) do
    case Enum.find(conn.req_headers, fn elem -> match?({"bearer", _}, elem) end) do
      {"bearer", jwt} ->
        %{"user_id" => user_id} = Tokens.custom_decode(jwt)
        assign(conn, :user_id, user_id)

      nil ->
        FallbackController.call(
          conn,
          %{error: :unauthorized, message: "Lack of authentication data"}
        )
        |> halt()
    end
  end
end
