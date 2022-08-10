defmodule MembraneLiveWeb.UserView do
  use MembraneLiveWeb, :view
  alias MembraneLiveWeb.UserView

  def render("index.json", %{users: users}) do
    %{data: render_many(users, UserView, "user.json")}
  end

  def render("show.json", %{user: user}) do
    %{data: render_one(user, UserView, "user.json")}
  end

  def render("user.json", %{user: user}) do
    %{
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      picture: user.picture
    }
  end
end
