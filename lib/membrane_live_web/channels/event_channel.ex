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

  def join("private:" <> _subtopic, _data, socket) do
    {:ok, socket}
  end

  def join(_topic, _params, _socket) do
    {:error, %{reason: " This link is wrong."}}
  end

  def handle_info({:after_join, name}, socket) do
    Presence.track(socket, name, %{})
    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  def handle_in("presenter_remove", %{"presenter" => presenter}, socket) do
    Presence.update(socket, presenter, fn map -> Map.put(map, "is_presenter", false) end)
    {:noreply, socket}
  end

  def handle_in("presenter_remove", %{"presenter_topic" => presenter_topic}, socket) do
    MembraneLiveWeb.Endpoint.broadcast_from!(self(), presenter_topic, "presenter_remove", %{})
    {:noreply, socket}
  end

  def handle_in("presenter_prop", %{"moderator" => moderator, "presenter" => presenter}, socket) do
    MembraneLiveWeb.Endpoint.broadcast_from!(self(), presenter, "presenter_prop", %{
      :moderator => moderator
    })

    {:noreply, socket}
  end

  def handle_in(
        "presenter_answer",
        %{"answer" => answer, "name" => name, "moderator" => moderator},
        socket
      ) do
    if answer == "accept" do
      Presence.update(socket, name, fn map -> Map.put(map, "is_presenter", true) end)
    end

    MembraneLiveWeb.Endpoint.broadcast_from!(self(), moderator, "presenter_answer", %{
      :name => name,
      :answer => answer
    })

    {:noreply, socket}
  end
end
