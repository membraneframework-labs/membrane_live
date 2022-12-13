defmodule MembraneLive.Repo.Migrations.AddChatsTable do
  use Ecto.Migration

  def change do
    create table(:chats, primary_key: false) do
      add(:uuid, :binary_id, primary_key: true)
      add(:event_id, references("webinars", column: :uuid, type: :binary_id, on_delete: :delete_all), null: false)
      add(:user_id, references("users", column: :uuid, type: :binary_id, on_delete: :delete_all), default: nil)
      add(:anon_id, :text, default: nil)
      add(:user_name, :text, default: nil)
      add(:content, :text, null: false)
      add(:time_offset, :integer, null: false)

      timestamps()
    end

    create constraint("chats", :only_one_of_user_columns, check:
      "(user_id IS NULL) <> (user_name IS NULL)"
    )
    create constraint("chats", :anon_user_must_have_id_and_name, check:
      "(user_name IS NULL AND anon_id IS NULL) OR (user_name IS NOT NULL AND anon_id IS NOT NULL)"
    )
    create constraint("chats", :offset_is_valid, check: "time_offset >= 0")
    create constraint("chats", :content_non_empty, check: "(content <> '') IS TRUE")
  end
end
