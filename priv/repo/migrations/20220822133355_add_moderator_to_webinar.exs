defmodule MembraneLive.Repo.Migrations.AddModeratorToWebinar do
  use Ecto.Migration

  def change do
    alter table(:webinars) do
      add(
        :creator_id,
        references("users", column: :uuid, type: :binary_id, on_delete: :delete_all),
        null: false
      )
    end
  end
end
