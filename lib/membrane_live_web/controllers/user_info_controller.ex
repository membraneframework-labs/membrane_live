defmodule MembraneLiveWeb.UserInfoController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Accounts

  def index(conn, _params) do
    {:ok, user_info} = Accounts.get_user(conn.assigns.user_id)

    json(
      conn,
      %{
        name: user_info.name,
        email: user_info.email,
        picture: user_info.picture
      }
    )
  end
end
