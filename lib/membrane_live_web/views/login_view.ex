defmodule MembraneLiveWeb.LoginView do
  use MembraneLiveWeb, :view

  def render("token.json", %{token: token}) do
    %{token: token}
  end
end
