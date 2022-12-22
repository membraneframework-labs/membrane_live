defmodule MembraneLive.WebinarsProducts do
  @moduledoc """
  The Webinars context.
  """

  import Ecto.Query, warn: false

  alias MembraneLive.Products
  alias MembraneLive.Products.WebinarsProducts
  alias MembraneLive.Repo
  alias MembraneLive.Webinars

  @spec add_product_to_webinar(%{
          :product_id => binary,
          :webinar_id => binary,
          optional(any) => any
        }) ::
          {:ok, Product.t()} | {:error, :no_webinar | :no_product | Ecto.changeset()}
  def add_product_to_webinar(%{webinar_id: webinar_uuid, product_id: product_uuid}) do
    with {:ok, webinar} <- Webinars.get_webinar(webinar_uuid),
         {:ok, product} <- Products.get_product(product_uuid),
         {:ok, _webinar_product_assoc} <-
           Repo.insert(%WebinarsProducts{webinar: webinar, product: product}) do
      {:ok, product}
    end
  end

  def delete_product_from_webinar(_webinar_uuid, _product_uuid) do
    # TODO
  end
end
