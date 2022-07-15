defmodule MembraneLiveWeb.ErrorView do
  use MembraneLiveWeb, :view

  @spec template_not_found(any, any) :: any
  def template_not_found(template, _assigns) do
    Phoenix.Controller.status_message_from_template(template)
  end
end
