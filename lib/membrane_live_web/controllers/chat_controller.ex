defmodule MembraneLiveWeb.ChatController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Chats

  action_fallback(MembraneLiveWeb.FallbackController)

  def index(conn, %{"uuid" => id}) do
    chat_messages =
      id
      |> Chats.get_event_chat_messages()
      |> Enum.map(
        &%{
          content: &1.content,
          email: (if is_nil(&1.anon_id), do: &1.auth_user_email, else: &1.anon_id),
          name: (if is_nil(&1.user_name), do: &1.auth_user_name, else: &1.user_name),
          offset: &1.offset
        }
      )

    render(conn, "index.json", chat_messages: chat_messages)
  end
end
