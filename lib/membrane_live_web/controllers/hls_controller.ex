defmodule MembraneLiveWeb.HLSController do
  use MembraneLiveWeb, :controller

  alias MembraneLive.Helpers
  alias Plug

  def index(conn, %{"prefix" => prefix, "filename" => filename} = params) do
    prefix = Path.join(prefix, Map.get(params, "event_id", ""))
    path = Helpers.hls_output_path(prefix, filename)

    if File.exists?(path) do
      conn |> Plug.Conn.send_file(200, path)
    else
      conn |> Plug.Conn.send_resp(404, "File not found")
    end
  end
end
