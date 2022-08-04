defmodule MembraneLive.Repo.Migrations.ChangeIdToUuidInUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      remove(:id)
      add(:uuid, :binary_id)
    end
  end
end
