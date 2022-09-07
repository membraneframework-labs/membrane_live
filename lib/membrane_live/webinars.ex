defmodule MembraneLive.Webinars do
  @moduledoc """
  The Webinars context.
  """

  import Ecto.Query, warn: false
  alias MembraneLive.Repo

  alias MembraneLive.Webinars.Webinar

  @spec list_webinars :: list(Webinar.t())
  def list_webinars, do: Repo.all(Webinar)

  @spec get_webinar(String.t()) :: {:error, :no_webinar} | {:ok, Webinar.t()}
  def get_webinar(uuid) do
    case Repo.get(Webinar, uuid) do
      nil -> {:error, :no_webinar}
      webinar -> {:ok, webinar}
    end
  end

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

  @spec get_link(atom | %{:uuid => any, optional(any) => any}) :: String.t()
  def get_link(webinar) do
    "/event/#{webinar.uuid}"
  end

  @spec check_is_user_moderator(binary(), binary()) :: boolean()
  def check_is_user_moderator(user_uuid, webinar_uuid) do
    case get_webinar(webinar_uuid) do
      {:ok, webinar} -> user_uuid == webinar.moderator_id
      {:error, :no_webinar} -> false
    end
  end
end
