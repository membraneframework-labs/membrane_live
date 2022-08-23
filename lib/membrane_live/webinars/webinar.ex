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
          presenters: list,
          start_date: NaiveDateTime.t(),
          title: String.t()
        }

  schema "webinars" do
    field(:description, :string)
    field(:presenters, {:array, :string})
    field(:start_date, :naive_datetime)
    field(:title, :string)
    belongs_to(:moderator, MembraneLive.Webinars.Webinar, references: :uuid, type: :binary_id)

    timestamps()
  end

  @doc false
  def changeset(webinar, attrs) do
    webinar
    |> cast(attrs, [:title, :start_date, :description, :presenters, :moderator_id])
    |> validate_required([:title, :start_date, :moderator_id])
  end
end
