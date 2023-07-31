defmodule MembraneLive.Chats do
  @moduledoc """
  The Chats context.
  """
  import Ecto.Query, warn: false

  alias MembraneLive.Accounts
  alias MembraneLive.Accounts.User
  alias MembraneLive.Chats.Chat
  alias MembraneLive.Repo

  def get_event_chat_messages(event_id) do
    from(chat in Chat,
      left_join: user in User,
      on: chat.user_id == user.uuid,
      where: chat.event_id == ^event_id,
      order_by: [chat.time_offset, chat.inserted_at],
      select: %{
        user_name: chat.user_name,
        anon_id: chat.anon_id,
        content: chat.content,
        offset: chat.time_offset,
        auth_user_email: user.email,
        auth_user_name: user.name
      }
    )
    |> Repo.all()
  end

  def add_chat_message(event_id, user, content) do
    key =
      if user.is_auth and user.is_presenter, do: :start_timestamps, else: :client_start_timestamps

    offset =
      case :ets.lookup(key, event_id) do
        [{_key, timestamp}] ->
          System.monotonic_time(:millisecond) - timestamp

        [] ->
          0
      end

    if user.is_auth do
      add_authenticated_chat_message(event_id, user.email, content, offset)
    else
      add_anonnymous_chat_message(event_id, user.email, user.name, content, offset)
    end

    %{
      "email" => user.email,
      "name" => user.name,
      "content" => content,
      "offset" => offset
    }
  end

  def set_timestamp_client(event_id, target_segment_duration) do
    :ets.insert_new(
      :client_start_timestamps,
      {event_id, System.monotonic_time(:millisecond) - target_segment_duration}
    )
  end

  def set_timestamp_presenter(event_id) do
    :ets.insert_new(:start_timestamps, {event_id, System.monotonic_time(:millisecond)})
  end

  def delete_timestamps(event_id) do
    :ets.delete(:client_start_timestamps, event_id)
    :ets.delete(:start_timestamps, event_id)
  end

  def clear_offsets(event_id) do
    from(chat in Chat, where: chat.event_id == ^event_id)
    |> Repo.update_all(set: [time_offset: 0])
  end

  def remove_messages_from_user(event_id, email) do
    query =
      case Ecto.Type.cast(EctoFields.Email, email) do
        {:ok, email} ->
          user = Accounts.get_user_by_email(email)
          from(chat in Chat, where: chat.event_id == ^event_id and chat.user_id == ^user.uuid)

        :error ->
          from(chat in Chat, where: chat.event_id == ^event_id and chat.anon_id == ^email)
      end

    Repo.delete_all(query)
  end

  defp add_anonnymous_chat_message(event_id, user_email, user_name, content, time_offset) do
    attrs = %{
      event_id: event_id,
      user_name: user_name,
      anon_id: user_email,
      content: content,
      time_offset: time_offset
    }

    %Chat{}
    |> Chat.changeset(attrs)
    |> Repo.insert()
  end

  defp add_authenticated_chat_message(event_id, user_email, content, time_offset) do
    %User{uuid: user_id} = Accounts.get_user_by_email(user_email)
    attrs = %{event_id: event_id, user_id: user_id, content: content, time_offset: time_offset}

    %Chat{}
    |> Chat.changeset(attrs)
    |> Repo.insert()
  end
end
