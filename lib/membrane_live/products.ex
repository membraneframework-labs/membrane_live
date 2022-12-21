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
    camelized_attrs = Helpers.camelize_keys(attrs)

    %Product{}
    |> Product.changeset(camelized_attrs)
    |> Repo.insert!()
  end
end
