defmodule MembraneLiveWeb.RecordingsController do
  use MembraneLiveWeb, :controller

  alias MembraneLiveWeb.Helpers.ControllerCallbackHelper
  alias MembraneLive.Webinars
  alias MembraneLive.Webinars.Webinar

  action_fallback(MembraneLiveWeb.FallbackController)

  @spec index(Plug.Conn.t(), any) :: Plug.Conn.t()
  def index(conn, _params) do
    webinars = Webinars.list_recordings()
    render(conn, "index.json", webinars: webinars)
  end

  @spec show(Plug.Conn.t(), map) :: Plug.Conn.t()
  def show(conn, params) do
    ControllerCallbackHelper.get_with_callback(conn, params, &show_callback/2, true)
  end

  @spec delete(any, map) :: any
  def delete(conn, params) do
    ControllerCallbackHelper.get_with_callback(conn, params, &delete_callback/2, false)
  end

  defp show_callback(conn, %{"webinar_db" => webinar}) do
    render(conn, "show.json", webinar: webinar)
  end

  defp delete_callback(conn, %{"webinar_db" => webinar}) do
    with {:ok, %Webinar{}} <- Webinars.delete_webinar(webinar) do
      send_resp(conn, :no_content, "")
    end
  end
end
