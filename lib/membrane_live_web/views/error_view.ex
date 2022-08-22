defmodule MembraneLiveWeb.ErrorView do
  # credo:disable-for-this-file
  use MembraneLiveWeb, :view

  alias Plug.Conn.Status

  def render("error.json", %{error: error_atom, message: message}) do
    %{status: Status.code(error_atom), message: message}
  end

  def render(_any_error, %{error: error_atom, message: message}) do
    %{status: Status.code(error_atom), message: message}
  end
end
