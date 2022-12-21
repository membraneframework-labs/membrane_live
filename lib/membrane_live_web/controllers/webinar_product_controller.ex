defmodule MembraneLiveWeb.WebinarProductController do
  use MembraneLiveWeb, :controller

  alias MembraneLiveWeb.Helpers.ControllerCallbackHelper

  action_fallback(MembraneLiveWeb.FallbackController)

  @spec create(any, map) :: any
  def create(conn, %{"productId" => product_id}) do
    # with {:ok, %Webinar{} = webinar} <-
    #        Webinars.create_webinar(webinar_params, conn.assigns.user_id) do
    #   conn
    #   |> put_status(:created)
    #   |> put_resp_header("location", Routes.webinar_path(conn, :show, webinar))
    #   |> render("show_link.json", link: Webinars.get_link(webinar))
    # end
  end

  @spec index(Plug.Conn.t(), map) :: Plug.Conn.t()
  def index(conn, params) do
    ControllerCallbackHelper.get_webinar_and_fire_callback(conn, params, &index_callback/2, true)
  end

  # @spec delete(any, map) :: any
  # def delete(conn, params) do
  #   ControllerCallbackHelper.get_with_callback(conn, params, &delete_callback/2, false)
  # end

  defp index_callback(conn, %{"webinar_db" => webinar}) do
    conn
    |> put_view(MembraneLiveWeb.ProductView)
    |> render("index.json", products: webinar.products)
  end

  # defp delete_callback(conn, %{"webinar_db" => webinar}) do
  #   with {:ok, %Webinar{}} <- Webinars.delete_webinar(webinar) do
  #     send_resp(conn, :no_content, "")
  #   end
  # end
end
