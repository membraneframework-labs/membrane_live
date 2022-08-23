defmodule MembraneLive do
  @moduledoc """
  MembraneLive keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  # TODO ask Radek if this would be useful
  def get_env(key), do: Application.fetch_env!(:membrane_live, key)
end
