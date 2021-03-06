defmodule MembraneLiveWeb.EventChannel do
  @moduledoc """
  Channel for communicating in each event.
  """
  use Phoenix.Channel

  import Ecto.Query, only: [from: 2]

  alias MembraneLive.Repo
  alias MembraneLive.Webinars.Webinar
  alias MembraneLiveWeb.Presence

  def join("event:" <> id, %{"name" => name}, socket) do
    case Repo.exists?(from(w in Webinar, where: w.uuid == ^id)) do
      false ->
        {:error, %{reason: "This event doesn't exists."}}

      true ->
        viewer_data = Presence.get_by_key(socket, name)

        case viewer_data do
          [] ->
            send(self(), {:after_join, name})
            {:ok, socket}

          _viewer_exists ->
            {:error, %{reason: "Viewer with this name already exists."}}
        end
    end
  rescue
    Ecto.Query.CastError -> {:error, %{reason: "This link is wrong."}}
  end

  def join(_topic, _params, _socket) do
    {:error, %{reason: " This link is wrong."}}
  end

  def handle_info({:after_join, name}, socket) do
    Presence.track(socket, name, %{})
    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end
end
