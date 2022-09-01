defmodule MembraneLive.AccountsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `MembraneLive.Accounts` context.
  """
  alias MembraneLive.Accounts
  alias MembraneLive.Tokens

  @default_user_attrs %{
    email: "john@gmail.com",
    name: "John Kowalski",
    picture: "kowalski.img"
  }

  @doc """
  Generate a user.
  """
  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(@default_user_attrs)
      |> MembraneLive.Accounts.create_user()

    user
  end

  def user_attrs(), do: @default_user_attrs

  def create_user_with_token(google_claims) do
    {:ok, user} = Accounts.create_user_if_not_exists(google_claims)
    {:ok, token, _claims} = Tokens.auth_encode(user.uuid)
    {:ok, user, token}
  end
end
