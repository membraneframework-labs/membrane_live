defmodule MembraneLiveWeb.ErrorView do
  # credo:disable-for-this-file
  use MembraneLiveWeb, :view

  def render("error.json", %{error: :not_found, message: message}) do
    %{status: 404, message: message}
  end
end
