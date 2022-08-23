defmodule MembraneLive.Webinars do
  @moduledoc """
  The Webinars context.
  """

  import Ecto.Query, warn: false
  alias MembraneLive.Repo

  alias MembraneLive.Webinars.Webinar

  @spec list_webinars :: list(Webinar.t())
  def list_webinars, do: Repo.all(Webinar)

  @spec get_webinar(binary()) :: Webinar.t() | nil
  def get_webinar(uuid), do: Repo.get(Webinar, uuid)

  @spec get_webinar!(binary()) :: {:ok, Webinar.t()}
  def get_webinar!(uuid), do: Repo.get!(Webinar, uuid)

  @spec create_webinar(map(), binary()) :: any
  def create_webinar(attrs, moderator_id) do
    %Webinar{}
    |> Webinar.changeset(Map.put(attrs, "moderator_id", moderator_id))
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

  @spec check_is_user_moderator(binary(), binary()) :: boolean()
  def check_is_user_moderator(user_uuid, webinar_uuid) do
    case get_webinar(webinar_uuid) do
      nil -> false
      webinar -> user_uuid == webinar.moderator_id
    end
  end
end
