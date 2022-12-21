defmodule MembraneLive.Products do
  @moduledoc """
  The Products context.
  """

  import Ecto.Query, warn: false

  alias MembraneLive.Helpers
  alias MembraneLive.Products.Product
  alias MembraneLive.Repo

  def list_products do
    Repo.all(Product)
  end

  @spec create_product!(
          :invalid
          | %{optional(:__struct__) => none, optional(atom | binary) => any}
        ) :: Product.t()
  def create_product!(attrs \\ %{}) do
    snake_case_attrs = Helpers.underscore_keys(attrs)

    %Product{}
    |> Product.changeset(snake_case_attrs)
    |> Repo.insert!()
  end

  def get_product(uuid) do
    case Repo.get(Product, uuid) do
      nil -> {:error, :no_product}
      product -> {:ok, product}
    end
  end
end
