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

  defp is_user_authorized(webinar, _jwt_user_uuid, true), do: {:ok, webinar}

  defp is_user_authorized(webinar, jwt_user_uuid, _is_show_callback?)
       when jwt_user_uuid == webinar.moderator_id,
       do: {:ok, webinar}

  defp is_user_authorized(_webinar, _jwt_user_uuid, _is_show_callback?), do: {:error, :forbidden}
end
