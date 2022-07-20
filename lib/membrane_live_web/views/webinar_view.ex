defmodule MembraneLiveWeb.WebinarView do
  use MembraneLiveWeb, :view
  alias MembraneLiveWeb.WebinarView

  # credo:disable-for-this-file

  def render("index.json", %{webinars: webinars}) do
    %{webinars: render_many(webinars, WebinarView, "webinar.json")}
  end

  def render("show.json", %{webinar: webinar}) do
    %{webinar: render_one(webinar, WebinarView, "webinar.json")}
  end

  def render("show_links.json", %{webinar: webinar}) do
    %{webinar_links: render_one(webinar, WebinarView, "webinar_links.json")}
  end

  def render("webinar.json", %{webinar: webinar}) do
    %{
      id: webinar.id,
      title: webinar.title,
      start_date: webinar.start_date,
      description: webinar.description,
      presenters: webinar.presenters,
      viewer_link: webinar.viewer_link,
      moderator_link: webinar.moderator_link
    }
  end

  def render("webinar_links.json", %{webinar: webinar}) do
    %{
      viewer_link: webinar.viewer_link,
      moderator_link: webinar.moderator_link
    }
  end
end
