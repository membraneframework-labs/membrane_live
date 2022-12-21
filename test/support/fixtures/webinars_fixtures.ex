defmodule MembraneLive.WebinarsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `MembraneLive.Webinars` context.
  """
  alias MembraneLive.Accounts.User

  @default_webinar_attrs %{
    "description" => "some description",
    "presenters" => [],
    "start_date" => ~N[2022-07-17 10:20:00],
    "title" => "some title"
  }

  @spec webinar_fixture(any, User.t()) :: Webinar.t()
  @doc """
  Generate a webinar.
  """
  def webinar_fixture(attrs \\ %{}, %User{} = user) do
    {:ok, webinar} =
      attrs
      |> Enum.into(@default_webinar_attrs)
      |> MembraneLive.Webinars.create_webinar(user.uuid)

    webinar
  end

  def webinar_attrs(), do: @default_webinar_attrs

  def webinar_attrs(moderator_uuid),
    do: Enum.into(@default_webinar_attrs, %{"moderator" => moderator_uuid})
end
