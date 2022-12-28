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
          {:ok, Product.t()} | {:error, :no_webinar | :no_product | Ecto.Changeset.t()}
  def add_product_to_webinar(%{webinar_id: webinar_uuid, product_id: product_uuid}) do
    with {:ok, webinar} <- Webinars.get_webinar(webinar_uuid),
         {:ok, product} <- Products.get_product(product_uuid),
         {:ok, _webinar_product_assoc} <-
           Repo.insert(%WebinarsProducts{webinar: webinar, product: product}) do
      {:ok, product}
    end
  end

  @spec delete_product_from_webinar(%{
          :product_id => binary,
          :webinar_id => binary,
          optional(any) => any
        }) :: :ok | {:error, :no_webinar | :no_product | Ecto.Changeset.t()}
  def delete_product_from_webinar(%{webinar_id: webinar_uuid, product_id: product_uuid}) do
    with {:ok, webinar} <- Webinars.get_webinar(webinar_uuid),
         {:ok, product} <- Products.get_product(product_uuid),
         {:ok, _webinar_product_assoc} <-
           Repo.delete(%WebinarsProducts{webinar_id: webinar.uuid, product_id: product.uuid}) do
      :ok
    end
  end

  @spec product_in_webinar?(Product.t(), Webinar.t()) :: boolean
  def product_in_webinar?(product, webinar) do
    case Repo.get_by(WebinarsProducts, webinar_id: webinar.uuid, product_id: product.uuid) do
      nil -> false
      _webinar_product -> true
    end
  end
end
