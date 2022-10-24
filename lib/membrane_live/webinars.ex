defmodule MembraneLive.Webinars do
  @moduledoc """
  The Webinars context.
  """

  import Ecto.Query, warn: false
  alias MembraneLive.Repo

  alias MembraneLive.Accounts
  alias MembraneLive.Webinars.Webinar

  @spec list_webinars() :: list(Webinar.t())
  def list_webinars() do
    query =
      from(u in Webinar,
        where: not u.is_finished,
        select: u
      )

    Repo.all(query)
  end

  @spec list_recordings() :: list(Webinar.t())
  def list_recordings() do
    query =
      from(u in Webinar,
        where: u.is_finished,
        select: u
      )

    Repo.all(query)
  end

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
  def create_webinar(attrs, creator_id) do
    attrs =
      attrs
      |> Map.put("creator_id", creator_id)
      |> Map.update!("moderators", fn moderators ->
        if moderators do
          creator_email = MembraneLive.Accounts.get_email!(creator_id)
          if creator_email in moderators, do: moderators, else: [creator_email | moderators]
        else
          nil
        end
      end)

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

  @spec mark_webinar_as_finished(binary()) :: any
  def mark_webinar_as_finished(uuid) do
    with {:ok, webinar} <- get_webinar(uuid),
         webinar <- Ecto.Changeset.change(webinar, is_finished: true),
         {:ok, struct} <- Repo.update(webinar) do
      {:ok, struct}
    else
      {:error, error_code} -> {:error, error_code}
    end
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
  def check_is_user_moderator(user_id, webinar_uuid) do
    case get_webinar(webinar_uuid) do
      {:ok, webinar} ->
        Accounts.get_email!(user_id) in webinar.moderators

      {:error, :no_webinar} ->
        false
    end
  end
end
