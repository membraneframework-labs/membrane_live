defmodule MembraneLiveWeb.WebinarController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Webinars
  alias MembraneLive.Webinars.Webinar
  alias MembraneLiveWeb.Helpers.ControllerCallbackHelper

  action_fallback(MembraneLiveWeb.FallbackController)

  @spec index(Plug.Conn.t(), any) :: Plug.Conn.t()
  def index(conn, _params) do
    webinars = Webinars.list_webinars(conn.assigns.user_id)
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
    ControllerCallbackHelper.get_webinar_and_fire_callback(
      conn,
      params,
      &show_callback/2,
      true
    )
  end

  @spec update(any, map) :: any
  def update(conn, params) do
    ControllerCallbackHelper.get_webinar_and_fire_callback(
      conn,
      params,
      &update_callback/2,
      false
    )
  end

  @spec delete(any, map) :: any
  def delete(conn, params) do
    ControllerCallbackHelper.get_webinar_and_fire_callback(
      conn,
      params,
      &delete_callback/2,
      false
    )
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
end
