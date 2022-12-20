defmodule MembraneLive.Products.WebinarsProducts do
  @moduledoc """
  Intermediate table between webinars and products
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias MembraneLive.Products.Product
  alias MembraneLive.Webinars.Webinar

  schema "webinars_products" do
    belongs_to(:webinar, Webinar, references: :uuid, type: :binary_id)
    belongs_to(:products, Product, references: :uuid, type: :binary_id)

    timestamps()
  end

  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, [:webinar_id, :product_id])
    |> validate_required([:webinar_id, :product_id])
  end
end
