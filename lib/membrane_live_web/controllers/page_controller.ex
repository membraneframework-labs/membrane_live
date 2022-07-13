defmodule MembraneLiveWeb.PageController do
  use MembraneLiveWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
