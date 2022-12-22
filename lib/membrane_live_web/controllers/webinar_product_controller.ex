defmodule MembraneLiveWeb.WebinarProductController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Webinars
  alias MembraneLive.WebinarsProducts
  alias MembraneLiveWeb.Helpers.ControllerCallbackHelper

  action_fallback(MembraneLiveWeb.FallbackController)

  @spec create(any, map) :: any
  def create(%{assigns: %{user_id: user_uuid}} = conn, %{
        "webinar_uuid" => webinar_uuid,
        "productId" => product_uuid
      }) do
    assoc_attrs = %{webinar_id: webinar_uuid, product_id: product_uuid}

    with :ok <- Webinars.check_is_user_moderator(user_uuid, webinar_uuid),
         {:ok, product} <- WebinarsProducts.add_product_to_webinar(assoc_attrs) do
      conn
      |> put_view(MembraneLiveWeb.ProductView)
      |> put_status(:created)
      |> render("show.json", product: product)
    else
      {:error, :no_webinar} ->
        %{error: :not_found, message: "Webinar does not exist"}

      {:error, :no_product} ->
        %{error: :not_found, message: "Product does not exist"}

      {:error, :not_a_moderator} ->
        %{
          error: :forbidden,
          message: "User does not have permission to add products to this webinar"
        }
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
