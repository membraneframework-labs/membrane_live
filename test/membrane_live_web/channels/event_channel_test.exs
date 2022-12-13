defmodule MembraneLiveWeb.EventChannelTest do
  use MembraneLiveWeb.ChannelCase

  import MembraneLive.AccountsFixtures

  alias MembraneLive.{Accounts.User, Repo, Tokens, Webinars.Webinar}
  alias MembraneLiveWeb.EventChannel
  alias MembraneLiveWeb.Presence

  @user "mock_user"
  @email "mock_email@gmail.com"

  setup do
    moderator_user = user_fixture()
    %User{uuid: moderator_uuid} = moderator_user
    {:ok, moderator_token, _claims} = Tokens.auth_encode(moderator_uuid)

    {:ok, %{uuid: uuid}} =
      Repo.insert(%Webinar{
        description: "a",
        presenters: [],
        start_date: ~N[2019-10-31 23:00:07],
        title: "Test webinar",
        moderator_id: moderator_uuid
      })

    google_claims = %{
      "name" => "mock_user",
      "email" => "mock_email@gmail.com",
      "picture" => "https://google.com"
    }

    {:ok, user, token} = create_user_with_token(google_claims)
    {:ok, _reply, moderator_socket} = create_channel_connection(uuid, moderator_token)
    {:ok, _reply, pub_socket} = create_channel_connection(uuid, token)

    %{
      user: user,
      token: token,
      uuid: uuid,
      pub_socket: pub_socket,
      moderator_user: moderator_user,
      moderator_socket: moderator_socket
    }
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

    test "check if users are in presence", %{
      user: user,
      uuid: uuid,
      pub_socket: pub_socket,
      moderator_socket: moderator_socket
    } do
      google_claims = %{
        "name" => "mock_user2",
        "email" => "mock_email2@gmail.com",
        "picture" => "https://google.com/2"
      }

      {:ok, user2, token} = create_user_with_token(google_claims)

      {:ok, _reply, socket2} = create_channel_connection(uuid, token)

      pres = Presence.list("event:#{uuid}")
      assert is_map_key(pres, user2.email) and is_map_key(pres, user.email)

      Process.unlink(socket2.channel_pid)
      close(socket2)

      pres = Presence.list("event:#{uuid}")
      assert is_map_key(pres, user.email) and not is_map_key(pres, user2.email)

      Process.unlink(pub_socket.channel_pid)
      close(pub_socket)

      Process.unlink(moderator_socket.channel_pid)
      close(moderator_socket)

      assert Presence.list("event:#{uuid}") == %{}
    end
  end

  describe "Adding presenter:" do
    defp add_presenter(socket, uuid, response) do
      push(socket, "presenter_prop", %{
        "moderatorTopic" => "private:#{uuid}:#{@email}",
        "presenterTopic" => "private:#{uuid}:#{@email}"
      })

      assert_broadcast("presenter_prop", %{moderator_topic: _})

      push(socket, "presenter_answer", %{
        "moderatorTopic" => "private:#{uuid}:#{@email}",
        "email" => "#{@email}",
        "answer" => response
      })

      assert_broadcast("presenter_answer", %{name: "#{@user}", answer: ^response})
    end

    test "set and remove presenter", %{uuid: uuid, pub_socket: pub_socket} do
      @endpoint.subscribe("private:#{uuid}:#{@email}")

      add_presenter(pub_socket, uuid, "accept")

      assert_broadcast("presence_diff", %{
        joins: %{"#{@email}" => %{metas: [%{is_presenter: true}]}}
      })

      # removing: see comment in lib/membrane_live_web/channels/event_channel.ex
      push(pub_socket, "presenter_remove", %{"presenterTopic" => "private:#{uuid}:#{@email}"})
      assert_broadcast("presenter_remove", %{})

      push(pub_socket, "presenter_remove", %{"presenter" => "#{@email}"})

      assert_broadcast("presence_diff", %{
        joins: %{"#{@email}" => %{metas: [%{is_presenter: false}]}}
      })
    end

    test "set presenter who rejects", %{uuid: uuid, pub_socket: pub_socket} do
      @endpoint.subscribe("private:#{uuid}:#{@email}")

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
            %{"presenterTopic" => "private:#{uuid}:invalid"},
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
            %{"presenterTopic" => "private:#{uuid}:#{@email}"},
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
      token: token,
      presenter: false,
      requestPresenting: false
    })
  end
end
