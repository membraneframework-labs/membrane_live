defmodule MembraneLiveWeb.ProductView do
  use MembraneLiveWeb, :view
  alias MembraneLiveWeb.ProductView


  def render("index.json", %{products: products}) do
    %{products: render_many(products, ProductView, "product.json")}
  end

  def render("product.json", %{product: product}) do
    %{
      id: product.uuid,
      name: product.name,
      price: product.price,
      itemUrl: product.item_url,
      imageUrl: product.image_url
    }
  end
end
