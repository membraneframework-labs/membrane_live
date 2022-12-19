defmodule MembraneLiveWeb.WebinarProductController do
  use MembraneLiveWeb, :controller

  require Logger

  alias MembraneLive.Webinars
  alias MembraneLive.WebinarsProducts
  alias MembraneLiveWeb.Helpers.ControllerCallbackHelper

  action_fallback(MembraneLiveWeb.FallbackController)

  @spec index(Plug.Conn.t(), map) :: Plug.Conn.t()
  def index(conn, params) do
    ControllerCallbackHelper.get_webinar_and_fire_callback(
      conn,
      params,
      &index_callback/2,
      true,
      true
    )
  end

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
      err -> handle_error(err)
    end
  end

  @spec delete(any, map) :: any
  def delete(
        %{assigns: %{user_id: user_uuid}} = conn,
        %{
          "webinar_uuid" => webinar_uuid,
          "product_uuid" => product_uuid
        }
      ) do
    assoc_attrs = %{webinar_id: webinar_uuid, product_id: product_uuid}

    with :ok <- Webinars.check_is_user_moderator(user_uuid, webinar_uuid),
         :ok <- WebinarsProducts.delete_product_from_webinar(assoc_attrs) do
      send_resp(conn, :no_content, "")
    else
      err -> handle_error(err)
    end
  end

  defp index_callback(conn, %{"webinar_db" => webinar}) do
    conn
    |> put_view(MembraneLiveWeb.ProductView)
    |> render("index.json", products: webinar.products)
  end

  defp handle_error({:error, :no_webinar}),
    do: %{error: :not_found, message: "Webinar does not exist"}

  defp handle_error({:error, :no_product}),
    do: %{error: :not_found, message: "Product does not exist"}

  defp handle_error({:error, :not_a_moderator}),
    do: %{
      error: :forbidden,
      message: "User does not have permission to alter products in this webinar"
    }

  defp handle_error({:error, reason}) do
    Logger.error("""
    Failed to alter products in the webinar.
    Reason: #{inspect(reason)}
    """)

    %{
      error: :internal_server_error,
      message: "Altering product list in the webinar failed."
    }
  end
end
