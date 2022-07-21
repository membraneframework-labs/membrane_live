defmodule MembraneLiveWeb.EventChannel do
  use Phoenix.Channel
  alias MembraneLiveWeb.Presence

  def join("event:" <> _id, %{"name" => name} , socket) do
    viewer_data = Presence.get_by_key(socket, name)
    case viewer_data do
      [] ->
        send(self(), {:after_join, name})
        {:ok, socket}
      _ ->
        {:error, %{reason: "Viewer with this name already exists."}}
    end
  end

  def join(_topic, _params, _socket) do
    {:error, %{reason: "This event doesn't exist."}}
  end

  def handle_info({:after_join, name}, socket) do
    Presence.track(socket, name, %{})
    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end
end
