defmodule MembraneLive.Webinars.Webinar do
  @moduledoc """
  Struct for webinar
  """
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{
          description: String.t(),
          moderator_link: String.t(),
          presenters: list,
          start_date: NaiveDateTime.t(),
          title: String.t(),
          viewer_link: String.t()
        }

  schema "webinars" do
    field(:description, :string)
    field(:moderator_link, :string)
    field(:presenters, {:array, :string})
    field(:start_date, :naive_datetime)
    field(:title, :string)
    field(:viewer_link, :string)

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  @doc false
  def changeset(webinar, attrs) do
    webinar
    |> cast(attrs, [:title, :start_date, :description, :presenters, :viewer_link, :moderator_link])
    |> validate_required([:title, :start_date, :viewer_link, :moderator_link])
    |> unique_constraint([:viewer_link, :moderator_link])
  end
end
