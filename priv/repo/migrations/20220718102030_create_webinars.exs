defmodule MembraneLive.Repo.Migrations.CreateWebinars do
  use Ecto.Migration

  def change do
    create table(:webinars) do
      add :title, :string
      add :start_date, :naive_datetime
      add :description, :string
      add :presenters, {:array, :string}
      add :viewer_link, :string
      add :moderator_link, :string

      timestamps()
    end
  end
end
