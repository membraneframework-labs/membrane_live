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

    {:ok, _reply, pub_socket} =
      MembraneLiveWeb.EventSocket
      |> socket("event_id", %{})
      |> subscribe_and_join(MembraneLiveWeb.EventChannel, "event:#{uuid}", %{
        name: "Mark"
      })

    %{uuid: uuid, pub_socket: pub_socket}
  end

  test "check if users are in presence", %{uuid: uuid, pub_socket: pub_socket} do
    socket1 = MembraneLiveWeb.EventSocket |> socket("event_id1", %{})

    {:ok, _reply, socket1} =
      subscribe_and_join(socket1, MembraneLiveWeb.EventChannel, "event:#{uuid}", %{
        name: "John"
      })

    pres = Presence.list("event:#{uuid}")
    assert is_map_key(pres, "John") and is_map_key(pres, "Mark")

    Process.unlink(socket1.channel_pid)
    close(socket1)

    pres = Presence.list("event:#{uuid}")
    assert is_map_key(pres, "Mark") and not is_map_key(pres, "John")

    Process.unlink(pub_socket.channel_pid)
    close(pub_socket)

    assert Presence.list("event:#{uuid}") == %{}
  end

  test "set and remove presenter", %{uuid: uuid, pub_socket: pub_socket} do
    @endpoint.subscribe("private:#{uuid}:Mark")

    push(pub_socket, "presenter_prop", %{
      "moderator" => "private:#{uuid}:Mark",
      "presenter" => "private:#{uuid}:Mark"
    })

    assert_broadcast("presenter_prop", %{moderator: _})

    push(pub_socket, "presenter_answer", %{
      "moderator" => "private:#{uuid}:Mark",
      "name" => "Mark",
      "answer" => "accept"
    })

    assert_broadcast("presence_diff", %{joins: %{"Mark" => %{metas: [%{"is_presenter" => true}]}}})

    assert_broadcast("presenter_answer", %{name: "Mark", answer: "accept"})

    push(pub_socket, "presenter_remove", %{"presenter_topic" => "private:#{uuid}:Mark"})
    assert_broadcast("presenter_remove", %{})

    push(pub_socket, "presenter_remove", %{"presenter" => "Mark"})

    assert_broadcast("presence_diff", %{
      joins: %{"Mark" => %{metas: [%{"is_presenter" => false}]}}
    })
  end

  test "set presenter who rejects", %{uuid: uuid, pub_socket: pub_socket} do
    @endpoint.subscribe("private:#{uuid}:Mark")

    push(pub_socket, "presenter_prop", %{
      "moderator" => "private:#{uuid}:Mark",
      "presenter" => "private:#{uuid}:Mark"
    })

    assert_broadcast("presenter_prop", %{moderator: _})

    push(pub_socket, "presenter_answer", %{
      "moderator" => "private:#{uuid}:Mark",
      "name" => "Mark",
      "answer" => "reject"
    })

    assert_broadcast("presenter_answer", %{name: "Mark", answer: "reject"})
  end
end
