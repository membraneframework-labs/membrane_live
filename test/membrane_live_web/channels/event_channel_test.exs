defmodule MembraneLiveWeb.EventChannelTest do
  use MembraneLiveWeb.ChannelCase

  import MembraneLive.AccountsFixtures

  alias MembraneLive.{Accounts.User, Repo, Webinars.Webinar}
  alias MembraneLiveWeb.EventChannel
  alias MembraneLiveWeb.Presence

  @user "mock_user"

  setup do
    %User{uuid: user_uuid} = user_fixture()

    {:ok, %{uuid: uuid}} =
      Repo.insert(%Webinar{
        description: "a",
        presenters: [],
        start_date: ~N[2019-10-31 23:00:07],
        title: "Test webinar",
        moderator_id: user_uuid
      })

    google_claims = %{
      "name" => "mock_user",
      "email" => "mock_email@gmail.com",
      "picture" => "https://google.com"
    }

    {:ok, user, token} = create_user_with_token(google_claims)
    {:ok, _reply, pub_socket} = create_channel_connection(uuid, token)

    %{user: user, token: token, uuid: uuid, pub_socket: pub_socket}
  end

  describe "Joining and leaving webinar:" do
    test "join to nonexistent webinar", %{token: token} do
      return_value =
        MembraneLiveWeb.EventSocket
        |> socket("event_id", %{})
        |> subscribe_and_join(MembraneLiveWeb.EventChannel, "event:invalid_event_id", %{
          token: token
        })

      assert return_value == {:error, %{reason: "This link is wrong."}}
    end

    test "check if users are in presence", %{user: user, uuid: uuid, pub_socket: pub_socket} do
      google_claims = %{
        "name" => "mock_user2",
        "email" => "mock_email2@gmail.com",
        "picture" => "https://google.com/2"
      }

      {:ok, user2, token} = create_user_with_token(google_claims)

      {:ok, _reply, socket2} = create_channel_connection(uuid, token)

      pres = Presence.list("event:#{uuid}")
      assert is_map_key(pres, user2.name) and is_map_key(pres, user.name)

      Process.unlink(socket2.channel_pid)
      close(socket2)

      pres = Presence.list("event:#{uuid}")
      assert is_map_key(pres, user.name) and not is_map_key(pres, user2.name)

      Process.unlink(pub_socket.channel_pid)
      close(pub_socket)

      assert Presence.list("event:#{uuid}") == %{}
    end
  end

  describe "Adding presenter:" do
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
        joins: %{"#{@user}" => %{metas: [%{is_presenter: true}]}}
      })

      # removing: see comment in lib/membrane_live_web/channels/event_channel.ex
      push(pub_socket, "presenter_remove", %{"presenter_topic" => "private:#{uuid}:#{@user}"})
      assert_broadcast("presenter_remove", %{})

      push(pub_socket, "presenter_remove", %{"presenter" => "#{@user}"})

      assert_broadcast("presence_diff", %{
        joins: %{"#{@user}" => %{metas: [%{is_presenter: false}]}}
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

  defp create_channel_connection(uuid, token) do
    MembraneLiveWeb.EventSocket
    |> socket("event_id", %{})
    |> subscribe_and_join(MembraneLiveWeb.EventChannel, "event:#{uuid}", %{
      token: token
    })
  end
end
