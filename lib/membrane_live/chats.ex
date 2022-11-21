defmodule MembraneLive.Chats do
  @moduledoc """
  The Chats context.
  """

  alias MembraneLive.Repo
  alias MembraneLive.Chats.Chat
  alias MembraneLive.Accounts
  alias MembraneLive.Accounts.User

  def add_chat_message(event_id, user_name, user_email, is_auth, content, time_offset) do
    case is_auth do
      true -> add_authenticated_chat_message(event_id, user_email, content, time_offset)
      false -> add_anonnymous_chat_message(event_id, user_name, content, time_offset)
    end
  end

  defp add_anonnymous_chat_message(event_id, user_name, content, time_offset) do
    attrs = %{
      event_id: event_id,
      user_name: user_name,
      content: content,
      time_offset: time_offset
    }

    %Chat{}
    |> Chat.changeset(attrs)
    |> Repo.insert()
  end

  defp add_authenticated_chat_message(event_id, email, content, time_offset) do
    %User{uuid: user_id} = Accounts.get_user_by_email(email)
    attrs = %{event_id: event_id, user_id: user_id, content: content, time_offset: time_offset}

    %Chat{}
    |> Chat.changeset(attrs)
    |> Repo.insert()
  end
end
