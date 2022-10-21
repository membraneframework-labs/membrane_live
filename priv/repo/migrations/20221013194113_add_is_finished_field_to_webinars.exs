defmodule MembraneLive.Repo.Migrations.AddIsFinishedFieldToWebinars do
  use Ecto.Migration

  def change do
    alter table(:webinars) do
      add(:is_finished, :boolean, default: false)
    end
  end
end
