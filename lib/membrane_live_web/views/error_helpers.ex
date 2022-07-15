defmodule MembraneLiveWeb.ErrorHelpers do
  @moduledoc """
  Conveniences for translating and building error messages.
  """

  use Phoenix.HTML

  @spec error_tag(atom | %{:errors => [{any, any}], optional(any) => any}, atom) :: list
  @doc """
  Generates tag for inlined form input errors.
  """
  def error_tag(form, field) do
    Enum.map(Keyword.get_values(form.errors, field), fn error ->
      content_tag(:span, translate_error(error),
        class: "invalid-feedback",
        phx_feedback_for: input_name(form, field)
      )
    end)
  end

  @spec translate_error({binary, keyword | map}) :: binary
  @doc """
  Translates an error message using gettext.
  """
  def translate_error({msg, opts}) do
    if count = opts[:count] do
      Gettext.dngettext(MembraneLiveWeb.Gettext, "errors", msg, msg, count, opts)
    else
      Gettext.dgettext(MembraneLiveWeb.Gettext, "errors", msg, opts)
    end
  end
end
