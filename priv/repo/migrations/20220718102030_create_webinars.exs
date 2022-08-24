defmodule MembraneLive.Repo.Migrations.CreateWebinars do
  use Ecto.Migration

  def change do
    create table(:webinars, primary_key: false) do
      add(:uuid, :binary_id, primary_key: true)
      add(:title, :string)
      add(:start_date, :naive_datetime)
      add(:description, :string)
      add(:presenters, {:array, :string})

      timestamps()
    end
  end
end
