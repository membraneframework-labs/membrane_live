defmodule MembraneLiveWeb.Helpers.ControllerCallbackHelper do
  @moduledoc false
  # Helper functions for WebinarController and RecordingsController

  alias MembraneLive.Webinars

  def get_with_callback(
        %{assigns: %{user_id: user_id}} = conn,
        %{"uuid" => uuid} = params,
        callback,
        is_show_callback?
      ) do
    with {:ok, webinar} <- Webinars.get_webinar(uuid),
         {:ok, webinar_db} <- is_user_authorized(webinar, user_id, is_show_callback?) do
      callback.(conn, Map.put(params, "webinar_db", webinar_db))
    else
      {:error, :no_webinar} ->
        %{error: :not_found, message: "Webinar with uuid #{uuid} could not be found"}

      {:error, :forbidden} ->
        %{
          error: :forbidden,
          message: "User with uuid #{user_id} does not have access to webinar with uuid #{uuid}"
        }
    end
  end

  def get_with_callback(
        conn,
        %{"uuid" => uuid} = params,
        callback,
        is_show_callback?
      ) do
    with {:ok, webinar} <- Webinars.get_webinar(uuid),
         true <- is_show_callback? do
      callback.(conn, Map.put(params, "webinar_db", webinar))
    else
      {:error, :no_webinar} ->
        %{error: :not_found, message: "Webinar with uuid #{uuid} could not be found"}

      false ->
        %{error: :forbidden, message: "Unauthenticated user does not have access to this action."}
    end
  end

  defp is_user_authorized(webinar, _jwt_user_uuid, true), do: {:ok, webinar}

  defp is_user_authorized(webinar, jwt_user_uuid, _is_show_callback?) do
    if Webinars.check_is_user_moderator?(jwt_user_uuid, webinar.uuid) do
      {:ok, webinar}
    else
      {:error, :forbidden}
    end
  end
end
