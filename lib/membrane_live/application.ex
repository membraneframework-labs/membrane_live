defmodule MembraneLive.Application do
  @moduledoc false
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      MembraneLive.Repo,
      MembraneLiveWeb.Telemetry,
      {Phoenix.PubSub, name: MembraneLive.PubSub},
      MembraneLiveWeb.Presence,
      MembraneLiveWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: MembraneLive.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    MembraneLiveWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
