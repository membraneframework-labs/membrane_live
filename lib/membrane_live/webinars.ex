defmodule MembraneLive.Webinars do
  @moduledoc """
  The Webinars context.
  """

  import Ecto.Query, warn: false
  alias MembraneLive.Repo

  alias MembraneLive.Webinars.Webinar

  @spec list_webinars :: any
  @doc """
  Returns the list of webinars.

  ## Examples

      iex> list_webinars()
      [%Webinar{}, ...]

  """
  def list_webinars do
    Repo.all(Webinar)
  end

  @spec get_webinar(any) :: any
  def get_webinar(id), do: Repo.get(Webinar, id)

  @spec get_webinar!(any) :: any
  @doc """
  Gets a single webinar.

  Raises `Ecto.NoResultsError` if the Webinar does not exist.

  ## Examples

      iex> get_webinar!(123)
      %Webinar{}

      iex> get_webinar!(456)
      ** (Ecto.NoResultsError)

  """
  def get_webinar!(id), do: Repo.get!(Webinar, id)

  @spec get_webinar_by_link(String.t()) :: Webinar.t() | nil
  def get_webinar_by_link(link) do
    get_webinar_by_link(link, :viewer_link)
  end

  defp get_webinar_by_link(link, :viewer_link) do
    case Repo.get_by(Webinar, viewer_link: link) do
      nil -> get_webinar_by_link(link, :moderator_link)
      webinar -> webinar
    end
  end

  defp get_webinar_by_link(link, :moderator_link) do
    Repo.get_by(Webinar, moderator_link: link)
  end

  @spec create_webinar(map) :: any
  @doc """
  Creates a webinar.

  ## Examples

      iex> create_webinar(%{field: value})
      {:ok, %Webinar{}}

      iex> create_webinar(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_webinar(attrs \\ %{}) do
    attrs = add_links(attrs)

    %Webinar{}
    |> Webinar.changeset(attrs)
    |> Repo.insert()
  end

  @spec update_webinar(
          MembraneLive.Webinars.Webinar.t(),
          :invalid | %{optional(:__struct__) => none, optional(atom | binary) => any}
        ) :: any
  @doc """
  Updates a webinar.

  ## Examples

      iex> update_webinar(webinar, %{field: new_value})
      {:ok, %Webinar{}}

      iex> update_webinar(webinar, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_webinar(%Webinar{} = webinar, attrs) do
    webinar
    |> Webinar.changeset(attrs)
    |> Repo.update()
  end

  @spec delete_webinar(MembraneLive.Webinars.Webinar.t()) :: any
  @doc """
  Deletes a webinar.

  ## Examples

      iex> delete_webinar(webinar)
      {:ok, %Webinar{}}

      iex> delete_webinar(webinar)
      {:error, %Ecto.Changeset{}}

  """
  def delete_webinar(%Webinar{} = webinar) do
    Repo.delete(webinar)
  end

  @spec change_webinar(
          MembraneLive.Webinars.Webinar.t(),
          :invalid | %{optional(:__struct__) => none, optional(atom | binary) => any}
        ) :: Ecto.Changeset.t()
  @doc """
  Returns an `%Ecto.Changeset{}` for tracking webinar changes.

  ## Examples

      iex> change_webinar(webinar)
      %Ecto.Changeset{data: %Webinar{}}

  """
  def change_webinar(%Webinar{} = webinar, attrs \\ %{}) do
    Webinar.changeset(webinar, attrs)
  end

  defp add_links(attrs) do
    hash_code =
      :crypto.hash(:sha256, "#{attrs["title"]}#{attrs["description"]}#{:rand.uniform(1_000_000)}")
      |> Base.encode16()
      |> String.downcase()

    attrs = Map.put(attrs, "viewer_link", "webinars/event/#{hash_code}")
    Map.put(attrs, "moderator_link", "webinars/event/#{hash_code}/moderator")
  end
end
