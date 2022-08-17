defmodule MembraneLive.WebinarsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `MembraneLive.Webinars` context.
  """

  @spec webinar_fixture(any) :: any
  @doc """
  Generate a webinar.
  """
  def webinar_fixture(attrs \\ %{}) do
    {:ok, webinar} =
      attrs
      |> Enum.into(%{
        "description" => "some description",
        "presenters" => [],
        "start_date" => ~N[2022-07-17 10:20:00],
        "title" => "some title"
      })
      # TODO needs to be replaced with real id in DB
      |> MembraneLive.Webinars.create_webinar("mock_id")

    webinar
  end
end
