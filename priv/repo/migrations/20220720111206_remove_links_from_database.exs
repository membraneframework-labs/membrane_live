defmodule MembraneLive.Repo.Migrations.RemoveLinksFromDatabase do
  use Ecto.Migration

  def change do
    alter table(:webinars) do
      remove(:viewer_link)
      remove(:moderator_link)
    end
  end
end
