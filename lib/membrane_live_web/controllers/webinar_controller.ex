defmodule MembraneLiveWeb.WebinarController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Webinars
  alias MembraneLive.Webinars.Webinar

  action_fallback(MembraneLiveWeb.FallbackController)

  @spec index(Plug.Conn.t(), any) :: Plug.Conn.t()
  def index(conn, _params) do
    webinars = Webinars.list_webinars()
    render(conn, "index.json", webinars: webinars)
  end

  @spec create(any, map) :: any
  def create(conn, %{"webinar" => webinar_params}) do
    with {:ok, %Webinar{} = webinar} <-
           Webinars.create_webinar(webinar_params, conn.assigns.user_id) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", Routes.webinar_path(conn, :show, webinar))
      |> render("show_link.json", link: Webinars.get_link(webinar))
    end
  end

  @spec show(Plug.Conn.t(), map) :: Plug.Conn.t()
  def show(conn, params) do
    get_with_callback(conn, params, &show_callback/2)
  end

  @spec update(any, map) :: any
  def update(conn, params) do
    get_with_callback(conn, params, &update_callback/2)
  end

  @spec delete(any, map) :: any
  def delete(conn, params) do
    get_with_callback(conn, params, &delete_callback/2)
  end

  defp get_with_callback(
         %{assigns: %{user_id: user_id}} = conn,
         %{"uuid" => uuid} = params,
         callback
       ) do
    with {:ok, webinar} <- Webinars.get_webinar(uuid),
         {:ok, webinar_db} <- is_user_authorized(webinar, user_id) do
      callback.(conn, Map.put(params, "webinar_db", webinar_db))
    else
      {:error, :no_webinar} ->
        %{error: :not_found, message: "Webinar with uuid #{uuid} could not be found"}

      {:error, :forbidden} ->
        %{
          error: :forbidden,
          message: "User with uuid #{user_id} does not have access to webinar with uuid #{uuid}"
        }
    end
  end

  defp show_callback(conn, %{"webinar_db" => webinar}) do
    render(conn, "show.json", webinar: webinar)
  end

  defp update_callback(conn, %{"webinar_db" => webinar, "webinar" => webinar_params}) do
    with {:ok, %Webinar{} = webinar} <- Webinars.update_webinar(webinar, webinar_params) do
      render(conn, "show.json", webinar: webinar)
    end
  end

  defp delete_callback(conn, %{"webinar_db" => webinar}) do
    with {:ok, %Webinar{}} <- Webinars.delete_webinar(webinar) do
      send_resp(conn, :no_content, "")
    end
  end

  defp is_user_authorized(webinar, jwt_user_uuid) when jwt_user_uuid == webinar.moderator_id,
    do: {:ok, webinar}

  defp is_user_authorized(_webinar, _jwt_user_uuid), do: {:error, :forbidden}
end
