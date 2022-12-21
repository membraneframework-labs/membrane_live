defmodule MembraneLiveWeb.WebinarProductController do
  use MembraneLiveWeb, :controller

  alias MembraneLiveWeb.Helpers.ControllerCallbackHelper

  alias MembraneLive.WebinarsProducts

  action_fallback(MembraneLiveWeb.FallbackController)

  @spec create(any, map) :: any
  def create(conn, %{"webinar_uuid" => webinar_uuid, "productId" => product_uuid}) do
    assoc_attrs = %{webinar_id: webinar_uuid, product_id: product_uuid}

    with {:ok, product} <- WebinarsProducts.add_product_to_webinar(assoc_attrs) do
      conn
      |> put_view(MembraneLiveWeb.ProductView)
      |> put_status(:created)
      |> render("show.json", product: product)
    end
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
