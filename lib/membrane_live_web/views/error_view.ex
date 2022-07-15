defmodule MembraneLiveWeb.ErrorView do
  use MembraneLiveWeb, :view

  # credo:disable-for-next-line
  def template_not_found(template, _assigns) do
    Phoenix.Controller.status_message_from_template(template)
  end
end
