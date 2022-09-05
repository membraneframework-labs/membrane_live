defmodule MembraneLiveWeb.UserController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Accounts
  alias MembraneLive.Accounts.User

  action_fallback(MembraneLiveWeb.FallbackController)

  def index(conn, _params) do
    users = Accounts.list_users()
    render(conn, "index.json", users: users)
  end

  def show(conn, params) do
    get_with_callback(conn, params, &show_callback/2)
  end

  def update(conn, params) do
    get_with_callback(conn, params, &update_callback/2)
  end

  def delete(conn, params) do
    get_with_callback(conn, params, &delete_callback/2)
  end

  defp get_with_callback(
         %{assigns: %{user_id: jwt_user_id}} = conn,
         %{"uuid" => uuid} = params,
         callback
       ) do
    with {:ok, user} <- Accounts.get_user(uuid),
         {:ok, user} <- return_user_if_is_authorized(user, jwt_user_id) do
      callback.(conn, Map.put(params, "user_db", user))
    else
      {:error, :no_user} ->
        %{error: :not_found, message: "Account with uuid #{uuid} could not be found"}

      {:error, :forbidden} ->
        %{
          error: :forbidden,
          message: "User with uuid #{jwt_user_id} does not have access to user with uuid #{uuid}"
        }
    end
  end

  def show_callback(conn, %{"user_db" => user}) do
    render(conn, "show.json", user: user)
  end

  def update_callback(conn, %{"user_db" => user, "user" => user_params}) do
    with {:ok, %User{} = user} <- Accounts.update_user(user, user_params) do
      render(conn, "show.json", user: user)
    end
  end

  # TODO add restriction so only the user can delete its account
  def delete_callback(conn, %{"user_db" => user}) do
    with {:ok, %User{}} <- Accounts.delete_user(user) do
      send_resp(conn, :no_content, "")
    end
  end

  defp return_user_if_is_authorized(user, jwt_uuid) do
    if user.uuid == jwt_uuid do
      {:ok, user}
    else
      {:error, :forbidden}
    end
  end
end
