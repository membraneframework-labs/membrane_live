defmodule MembraneLiveWeb.LoginView do
  use MembraneLiveWeb, :view

  def render("token.json", %{auth_token: auth_token, refresh_token: ref_token}) do
    %{authToken: auth_token, refreshToken: ref_token}
  end
end
