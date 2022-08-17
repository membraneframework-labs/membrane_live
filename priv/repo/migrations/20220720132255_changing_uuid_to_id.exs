defmodule MembraneLive.Repo.Migrations.ChangingUuidToId do
  use Ecto.Migration

  def change do
    alter table(:webinars) do
      remove(:id)
      add(:uuid, :binary_id, primary_key: true)
    end
  end
end
