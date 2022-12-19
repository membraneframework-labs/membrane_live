defmodule MembraneLive.Products do
  @moduledoc """
  The Products context.
  """

  import Ecto.Query, warn: false
  alias MembraneLive.Repo

  def list_products do
    Repo.all(Product)
  end
end
