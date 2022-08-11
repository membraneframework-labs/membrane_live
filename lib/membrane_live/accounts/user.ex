defmodule MembraneLive.Accounts.User do
  @moduledoc """
  Data about users persisted into the database
  """
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Phoenix.Param, key: :uuid}
  @primary_key {:uuid, :binary_id, autogenerate: true}

  schema "users" do
    field(:email, EctoFields.Email)
    field(:name, :string)
    field(:picture, :string)

    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email, :picture])
    |> validate_required([:name, :email, :picture])
  end
end
