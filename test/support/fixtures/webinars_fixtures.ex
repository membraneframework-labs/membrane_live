defmodule MembraneLive.WebinarsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `MembraneLive.Webinars` context.
  """
  alias MembraneLive.Accounts.User

  @spec webinar_fixture(any) :: any
  @doc """
  Generate a webinar.
  """
  def webinar_fixture(attrs \\ %{}, %User{} = user) do
    {:ok, webinar} =
      attrs
      |> Enum.into(%{
        "description" => "some description",
        "presenters" => [],
        "start_date" => ~N[2022-07-17 10:20:00],
        "title" => "some title"
      })
      |> MembraneLive.Webinars.create_webinar(user.uuid)

    webinar
  end
end
