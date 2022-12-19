defmodule MembraneLive.Products.Product do
  @moduledoc """
  Data about products persisted into the database
  """
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Phoenix.Param, key: :uuid}
  @primary_key {:uuid, :binary_id, autogenerate: true}

  schema "products" do
    field(:name, :string)
    field(:price, :string)
    field(:item_url, :string)
    field(:image_url, :string)

    timestamps()
  end

  @doc false
  def changeset(product, attrs) do
    product
    |> cast(attrs, [:name, :price, :item_url, :image_url])
    |> unique_constraint(:name)
  end
end
