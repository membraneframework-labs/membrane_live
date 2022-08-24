defmodule MembraneLive.Repo.Migrations.ChangeIdToUuidInUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      remove(:id)
      add(:uuid, :binary_id, primary_key: true)
    end
  end
end
