defmodule MembraneLive.Repo.Migrations.AddIsPrivateFieldToWebinars do
  use Ecto.Migration

  def change do
    alter table(:webinars) do
      add(:is_private, :boolean, default: false)
    end
  end
end
