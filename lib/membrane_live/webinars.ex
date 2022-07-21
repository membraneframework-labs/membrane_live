defmodule MembraneLive.Webinars do
  @moduledoc """
  The Webinars context.
  """

  import Ecto.Query, warn: false
  alias MembraneLive.Repo

  alias MembraneLive.Webinars.Webinar

  @spec list_webinars :: list(Webinar.t())
  def list_webinars, do: Repo.all(Webinar)

  @spec get_webinar(integer()) :: Webinar.t() | nil
  def get_webinar(id), do: Repo.get(Webinar, id)

  @spec get_webinar!(integer()) :: {:ok, Webinar.t()}
  def get_webinar!(id), do: Repo.get!(Webinar, id)

  @spec create_webinar(map) :: any
  def create_webinar(attrs \\ %{}) do
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

  @spec get_links(atom | %{:uuid => any, optional(any) => any}) :: %{
          moderator_link: <<_::64, _::_*8>>,
          viewer_link: <<_::64, _::_*8>>
        }
  def get_links(webinar) do
    %{
      viewer_link: "/event/#{webinar.uuid}",
      moderator_link: "/event/#{webinar.uuid}/moderator"
    }
  end
end
