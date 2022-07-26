defmodule MembraneLiveWeb.EventChannelTest do
  use MembraneLiveWeb.ChannelCase
  alias MembraneLive.{Repo, Webinars.Webinar}
  alias MembraneLiveWeb.Presence

  setup do
    {:ok, %{uuid: uuid}} =
      Repo.insert(%Webinar{
        description: "a",
        presenters: [],
        start_date: ~N[2019-10-31 23:00:07],
        title: "Test webinar"
      })

    %{uuid: uuid}
  end

  test "check if users are in presence", %{uuid: uuid} do
    socket1 = MembraneLiveWeb.EventSocket |> socket("event_id1", %{})
    socket2 = MembraneLiveWeb.EventSocket |> socket("event_id2", %{})

    {:ok, _reply, socket1} =
      subscribe_and_join(socket1, MembraneLiveWeb.EventChannel, "event:#{uuid}", %{
        name: "John"
      })

    {:ok, _reply, socket2} =
      subscribe_and_join(socket2, MembraneLiveWeb.EventChannel, "event:#{uuid}", %{name: "Adam"})

    pres = Presence.list("event:#{uuid}")
    assert is_map_key(pres, "John") and is_map_key(pres, "Adam")

    Process.unlink(socket1.channel_pid)
    close(socket1)

    pres = Presence.list("event:#{uuid}")
    assert is_map_key(pres, "Adam") and not is_map_key(pres, "John")

    Process.unlink(socket2.channel_pid)
    close(socket2)

    assert Presence.list("event:#{uuid}") == %{}
  end
end
