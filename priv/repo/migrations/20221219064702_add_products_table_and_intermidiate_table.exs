defmodule MembraneLive.Repo.Migrations.AddProductsTableAndIntermidiateTable do
  use Ecto.Migration

  def change do
    create table("products", primary_key: false) do
      add(:uuid, :binary_id, primary_key: true)
      add(:name, :string, null: false)
      add(:price, :string)
      add(:item_url, :string)
      add(:image_url, :string)

      timestamps()
    end

    create table("webinars_products", primary_key: false) do
      add(:webinar_id, references(:webinars, column: :uuid, type: :binary_id, primary_key: true))
      add(:product_id, references(:products, column: :uuid, type: :binary_id, primary_key: true))

      timestamps()
    end
  end
end
