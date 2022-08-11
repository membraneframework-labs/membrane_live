defmodule MembraneLiveWeb.FallbackController do
  @moduledoc """
  Translates controller action results into valid `Plug.Conn` responses.

  See `Phoenix.Controller.action_fallback/1` for more details.
  """
  # credo:disable-for-this-file
  use MembraneLiveWeb, :controller

  # This clause handles errors returned by Ecto's insert/update/delete.
  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(MembraneLiveWeb.ChangesetView)
    |> render("error.json", changeset: changeset)
  end

  # This clause is an example of how to handle generic
  def call(conn, %{error: :not_found} = params) do
    conn
    |> put_status(:not_found)
    |> put_view(MembraneLiveWeb.ErrorView)
    |> render("error.json", params)
  end

  # This clause is an example of how to handle unathorized user
  def call(conn, %{error: :unauthorized} = params) do
    conn
    |> put_status(:unauthorized)
    |> put_view(MembraneLiveWeb.ErrorView)
    |> render("error.json", params)
  end
end
