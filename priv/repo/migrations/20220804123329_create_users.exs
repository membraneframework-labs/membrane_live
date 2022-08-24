defmodule MembraneLive.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add(:uuid, :binary_id, primary_key: true)
      add(:name, :string)
      add(:email, :string)
      add(:picture, :string)

      timestamps()
    end
  end
end
