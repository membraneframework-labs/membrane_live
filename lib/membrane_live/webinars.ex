defmodule MembraneLive.Webinars do
  @moduledoc """
  The Webinars context.
  """

  import Ecto.Query, warn: false
  alias MembraneLive.Repo

  alias MembraneLive.Webinars.Webinar

  @spec list_webinars :: list(Webinar.t())
  def list_webinars do
    Repo.all(Webinar)
  end

  @spec get_webinar(integer()) :: Webinar.t() | nil
  def get_webinar(id), do: Repo.get(Webinar, id)

  @spec get_webinar!(integer()) :: Webinar.t()
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
  def update_webinar(%Webinar{} = webinar, attrs) do
    webinar
    |> Webinar.changeset(attrs)
    |> Repo.update()
  end

  @spec delete_webinar(MembraneLive.Webinars.Webinar.t()) :: any
  def delete_webinar(%Webinar{} = webinar) do
    Repo.delete(webinar)
  end

  @spec change_webinar(
          MembraneLive.Webinars.Webinar.t(),
          :invalid | %{optional(:__struct__) => none, optional(atom | binary) => any}
        ) :: Ecto.Changeset.t()
  def change_webinar(%Webinar{} = webinar, attrs \\ %{}) do
    Webinar.changeset(webinar, attrs)
  end

  defp add_links(attrs) do
    attrs = Map.put(attrs, "viewer_link", "webinars/event/#{UUID.uuid4()}")
    Map.put(attrs, "moderator_link", "webinars/event/#{UUID.uuid4()}")
  end
end
