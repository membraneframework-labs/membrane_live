defmodule MembraneLive.Chats.Chat do
  @moduledoc """
  Database schema for the chat table
  """
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Phoenix.Param, key: :uuid}
  @primary_key {:uuid, :binary_id, autogenerate: true}

  @type t :: %__MODULE__{
          event_id: Ecto.UUID.t(),
          user_id: Ecto.UUID.t() | nil,
          user_name: String.t() | nil,
          content: String.t(),
          time_offset: integer()
        }

  schema "chats" do
    belongs_to(:event, MembraneLive.Webinars.Webinar, references: :uuid, type: :binary_id)
    belongs_to(:user, MembraneLive.Accounts.User, references: :uuid, type: :binary_id)
    field(:user_name, :string)
    field(:content, :string)
    field(:time_offset, :integer)

    timestamps()
  end

  @doc false
  def changeset(message, attrs) do
    key = if Map.has_key?(attrs, :user_id), do: :user_name, else: :user_id

    message
    |> cast(attrs, [:event_id, :user_id, :user_name, :content, :time_offset])
    |> put_change(key, nil)
    |> validate_required([:event_id, :content, :time_offset])
    |> check_constraint(:user_id, name: :only_one_of_user_columns)
    |> validate_number(:time_offset, greater_than_or_equal_to: 0)
  end
end
