defmodule MembraneLive.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :name, :string
      add :email, :string
      add :picture, :string

      timestamps()
    end
  end
end
