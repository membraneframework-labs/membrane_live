defmodule MembraneLiveWeb.ProductController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Products

  action_fallback(MembraneLiveWeb.FallbackController)

  def index(conn, _params) do
    products = Products.list_products()
    render(conn, "index.json", products: products)
  end
end
