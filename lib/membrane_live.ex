defmodule MembraneLive do
  @moduledoc """
  MembraneLive keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  @spec get_env!(atom) :: any
  def get_env!(key), do: Application.fetch_env!(:membrane_live, key)
end
