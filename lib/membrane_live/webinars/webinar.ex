defmodule MembraneLive.Webinars.Webinar do
  @moduledoc """
  Struct for webinar
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias MembraneLive.Webinars.Webinar

  @derive {Phoenix.Param, key: :uuid}
  @primary_key {:uuid, :binary_id, autogenerate: true}

  @type t :: %__MODULE__{
          description: String.t(),
          presenters: list,
          start_date: NaiveDateTime.t(),
          title: String.t(),
          is_finished: boolean(),
          is_private: boolean()
        }

  @desc_limit 255

  schema "webinars" do
    field(:description, :string)
    field(:presenters, {:array, :string})
    field(:start_date, :naive_datetime)
    field(:title, :string)
    field(:is_finished, :boolean)
    field(:is_private, :boolean)
    belongs_to(:moderator, Webinar, references: :uuid, type: :binary_id)

    timestamps()
  end

  @doc false
  def changeset(webinar, attrs) do
    webinar
    |> cast(attrs, [:title, :start_date, :description, :presenters, :moderator_id, :is_private])
    |> Ecto.Changeset.put_change(:is_finished, false)
    |> validate_required([:title, :start_date, :moderator_id, :is_private])
    |> validate_length(:description, max: @desc_limit)
  end
end
