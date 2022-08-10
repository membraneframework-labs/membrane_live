defmodule MembraneLive.AccountsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `MembraneLive.Accounts` context.
  """

  @doc """
  Generate a user.
  """
  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(%{
        email: "john@gmail.com",
        name: "John Kowalski",
        picture: "kowalski.img"
      })
      |> MembraneLive.Accounts.create_user()

    user
  end
end
