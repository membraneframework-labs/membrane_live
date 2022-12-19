defmodule MembraneLive.WebinarsProducts do
  @moduledoc """
  Intermediate table between webinars and products
  """
  use Ecto.Schema

  alias MembraneLive.Webinars.Webinar
  alias MembraneLive.Products.Product

  schema "webinars_products" do
    belongs_to(:webinar, Webinar, references: :uuid, type: :binary_id)
    belongs_to(:products, Product, references: :uuid, type: :binary_id)

    timestamps()
  end

end
