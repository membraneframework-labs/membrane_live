defmodule MembraneLive.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add(:uuid, :binary_id, primary_key: true)
      add(:name, :string, null: false)
      add(:email, :string, null: false)
      add(:picture, :string, null: false)

      timestamps()
    end
  end
end
