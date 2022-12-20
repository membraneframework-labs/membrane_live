defmodule MembraneLive.Products do
  @moduledoc """
  The Products context.
  """

  import Ecto.Query, warn: false
  alias MembraneLive.Products.Product
  alias MembraneLive.Repo

  def list_products do
    Repo.all(Product)
  end

  def create_product!(attrs \\ %{}) do
    %Product{}
    |> Product.changeset(attrs)
    |> Repo.insert!()
  end
end
