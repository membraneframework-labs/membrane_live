defmodule MembraneLive.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias MembraneLive.Repo

  alias MembraneLive.Accounts.User

  def list_users do
    Repo.all(User)
  end

  def get_user(uuid), do: Repo.get(User, uuid)

  def get_user!(uuid), do: Repo.get!(User, uuid)

  def get_user_by_email(email), do: Repo.get_by(User, email: email)

  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  def change_user(%User{} = user, attrs \\ %{}) do
    User.changeset(user, attrs)
  end

  def create_user_if_not_exists(%{"email" => email} = attrs) do
    case get_user_by_email(email) do
      nil -> create_user(attrs)
      user -> {:ok, user}
    end
  end

  def create_user_id_not_exists(_attrs), do: {:error, :email_not_provided}

  def get_username(uuid) do
    case get_user(uuid) do
      nil -> {:error, "User with this id #{uuid} doesn't exist."}
      user -> {:ok, user.name}
    end
  end

  def get_email(uuid) do
    case get_user(uuid) do
      nil -> {:error, "User with this id #{uuid} doesn't exist."}
      user -> {:ok, user.email}
    end
  end
end
