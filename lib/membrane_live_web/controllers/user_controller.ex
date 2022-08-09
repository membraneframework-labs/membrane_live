defmodule MembraneLiveWeb.UserController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Accounts
  alias MembraneLive.Accounts.User

  action_fallback(MembraneLiveWeb.FallbackController)

  def index(conn, _params) do
    users = Accounts.list_users()
    render(conn, "index.json", users: users)
  end

  def create(conn, %{"user" => user_params}) do
    with {:ok, %User{} = user} <- Accounts.create_user(user_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", Routes.user_path(conn, :show, user))
      |> render("show.json", user: user)
    end
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

  defp get_with_callback(conn, %{"uuid" => uuid} = params, callback) do
    case Accounts.get_user(uuid) do
      nil -> %{error: :not_found, message: "Account with uuid #{uuid} could not be found"}
      user -> callback.(conn, Map.put(params, "user_db", user))
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
end
