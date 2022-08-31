defmodule MembraneLive.WebinarsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `MembraneLive.Webinars` context.
  """

  @default_webinar_atrrs %{
    "description" => "some description",
    "presenters" => [],
    "start_date" => ~N[2022-07-17 10:20:00],
    "title" => "some title"
  }

  @spec webinar_fixture(any) :: any
  @doc """
  Generate a webinar.
  """
  def webinar_fixture(attrs \\ %{}) do
    {:ok, webinar} =
      attrs
      |> Enum.into(@default_webinar_atrrs)
      |> MembraneLive.Webinars.create_webinar()

    webinar
  end

  def webinar_attrs(), do: @default_webinar_atrrs
end
