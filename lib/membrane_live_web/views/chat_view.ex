defmodule MembraneLiveWeb.ChatView do
  use MembraneLiveWeb, :view

  alias MembraneLiveWeb.ChatView

  def render("index.json", %{chat_messages: chat_messages}) do
    %{chats: render_many(chat_messages, ChatView, "chat.json")}
  end

  def render("chat.json", %{chat: chat}) do
    %{
      content: chat.content,
      email: chat.email,
      name: chat.name,
      offset: chat.offset
    }
  end
end
