defmodule MembraneLive.Webinars.Webinar do
  @moduledoc """
  Struct for webinar
  """
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Phoenix.Param, key: :uuid}
  @primary_key {:uuid, :binary_id, autogenerate: true}

  @type t :: %__MODULE__{
          description: String.t(),
          presenters: [binary()],
          start_date: NaiveDateTime.t(),
          title: String.t(),
          is_finished: boolean(),
          moderators: [binary()]
        }

  @desc_limit 255

  schema "webinars" do
    field(:description, :string)
    field(:presenters, {:array, :string})
    field(:start_date, :naive_datetime)
    field(:title, :string)
    field(:is_finished, :boolean)
    field(:moderators, {:array, :string})
    belongs_to(:creator, MembraneLive.Accounts.User, references: :uuid, type: :binary_id)
    timestamps()
  end

  @doc false
  def changeset(webinar, attrs) do
    webinar
    |> cast(attrs, [:title, :start_date, :description, :presenters, :creator_id, :moderators])
    |> Ecto.Changeset.put_change(:is_finished, false)
    |> validate_required([:title, :start_date, :creator_id, :moderators])
    |> validate_length(:description, max: @desc_limit)
  end
end
