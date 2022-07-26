defmodule MembraneLiveWeb.EventChannelErrorTest do
  use MembraneLiveWeb.ChannelCase
  alias MembraneLive.{Repo, Webinars.Webinar}

  test "join to nonexistent webinar" do
    return_value =
      MembraneLiveWeb.EventSocket
      |> socket("event_id", %{})
      |> subscribe_and_join(MembraneLiveWeb.EventChannel, "event:teneventnieistnieje", %{
        name: "Andrzej"
      })

    assert return_value == {:error, %{reason: "This link is wrong."}}
  end

  test "join to webinar with user with the same name" do
    {:ok, %{uuid: uuid}} =
      Repo.insert(%Webinar{
        description: "a",
        presenters: [],
        start_date: ~N[2019-10-31 23:00:07],
        title: "Test webinar"
      })

    socket = MembraneLiveWeb.EventSocket |> socket("event_id", %{})

    {:ok, _reply, socket} =
      subscribe_and_join(socket, MembraneLiveWeb.EventChannel, "event:#{uuid}", %{name: "Andrzej"})

    return_value =
      subscribe_and_join(socket, MembraneLiveWeb.EventChannel, "event:#{uuid}", %{name: "Andrzej"})

    assert return_value == {:error, %{reason: "Viewer with this name already exists."}}
  end
end
