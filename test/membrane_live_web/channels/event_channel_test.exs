defmodule MembraneLiveWeb.EventChannelTest do
  use MembraneLiveWeb.ChannelCase
  alias MembraneLive.{Repo, Webinars.Webinar}
  alias MembraneLiveWeb.EventChannel
  alias MembraneLiveWeb.Presence

  @user "Mark"
  @user2 "John"

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
        name: @user
      })

    %{uuid: uuid, pub_socket: pub_socket}
  end

  test "check if users are in presence", %{uuid: uuid, pub_socket: pub_socket} do
    socket1 = MembraneLiveWeb.EventSocket |> socket("event_id1", %{})

    {:ok, _reply, socket1} =
      subscribe_and_join(socket1, MembraneLiveWeb.EventChannel, "event:#{uuid}", %{
        name: @user2
      })

    pres = Presence.list("event:#{uuid}")
    assert is_map_key(pres, @user2) and is_map_key(pres, @user)

    Process.unlink(socket1.channel_pid)
    close(socket1)

    pres = Presence.list("event:#{uuid}")
    assert is_map_key(pres, @user) and not is_map_key(pres, @user2)

    Process.unlink(pub_socket.channel_pid)
    close(pub_socket)

    assert Presence.list("event:#{uuid}") == %{}
  end

  describe "Presenter:" do
    defp add_presenter(socket, uuid, response) do
      push(socket, "presenter_prop", %{
        "moderator" => "private:#{uuid}:#{@user}",
        "presenter" => "private:#{uuid}:#{@user}"
      })

      assert_broadcast("presenter_prop", %{moderator: _})

      push(socket, "presenter_answer", %{
        "moderator" => "private:#{uuid}:#{@user}",
        "name" => "#{@user}",
        "answer" => response
      })

      assert_broadcast("presenter_answer", %{name: "#{@user}", answer: ^response})
    end

    test "set and remove presenter", %{uuid: uuid, pub_socket: pub_socket} do
      @endpoint.subscribe("private:#{uuid}:#{@user}")

      add_presenter(pub_socket, uuid, "accept")

      assert_broadcast("presence_diff", %{
        joins: %{"#{@user}" => %{metas: [%{"is_presenter" => true}]}}
      })

      # removing: see comment in lib/membrane_live_web/channels/event_channel.ex
      push(pub_socket, "presenter_remove", %{"presenter_topic" => "private:#{uuid}:#{@user}"})
      assert_broadcast("presenter_remove", %{})

      push(pub_socket, "presenter_remove", %{"presenter" => "#{@user}"})

      assert_broadcast("presence_diff", %{
        joins: %{"#{@user}" => %{metas: [%{"is_presenter" => false}]}}
      })
    end

    test "set presenter who rejects", %{uuid: uuid, pub_socket: pub_socket} do
      @endpoint.subscribe("private:#{uuid}:#{@user}")

      add_presenter(pub_socket, uuid, "reject")
    end

    test "remove presenter that does not exist", %{uuid: uuid, pub_socket: pub_socket} do
      # Unfortunately there seems to be no way to assert_raise on function handling incoming message
      # so it is simulated as below
      assert_raise(
        RuntimeError,
        "Error: Trying to remove presenter role from nonexistent participant",
        fn ->
          EventChannel.handle_in(
            "presenter_remove",
            %{"presenter_topic" => "private:#{uuid}:invalid"},
            pub_socket
          )
        end
      )

      assert_raise(
        RuntimeError,
        "Error: Trying to remove presenter role from participant that is no a presenter",
        fn ->
          EventChannel.handle_in(
            "presenter_remove",
            %{"presenter_topic" => "private:#{uuid}:#{@user}"},
            pub_socket
          )
        end
      )
    end
  end
end
