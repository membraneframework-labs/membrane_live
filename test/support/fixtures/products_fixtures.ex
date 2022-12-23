defmodule MembraneLive.ProductFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `MembraneLive.Products` context.
  """

  alias MembraneLive.Products

  @default_product_attrs %{
    "name" => "Perfumes smelling like alien",
    "price" => "19.38",
    "itemUrl" =>
      "https://www.amazon.co.uk/Alien-Inspired-Alternative-Fragrance-Abduction/dp/B09V88R6GD?th=1",
    "imageUrl" => "https://m.media-amazon.com/images/I/418WzcwB+7L._AC_SX522_.jpg"
  }

  @spec product_fixture(any) :: Product.t()
  @doc """
  Generate a webinar.
  """
  def product_fixture(attrs \\ %{}) do
    attrs
    |> Enum.into(@default_product_attrs)
    |> Products.create_product!()
  end

  def product_attrs(), do: @default_product_attrs
end
