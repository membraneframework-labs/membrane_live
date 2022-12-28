defmodule MembraneLive.Application do
  @moduledoc false
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      MembraneLive.Repo,
      {Phoenix.PubSub, name: MembraneLive.PubSub},
      MembraneLiveWeb.Presence,
      MembraneLiveWeb.Endpoint
    ]

    :ets.new(:presenters, [:public, :set, :named_table])
    :ets.new(:presenting_requests, [:public, :set, :named_table])
    :ets.new(:banned_from_chat, [:public, :set, :named_table])
    :ets.new(:start_timestamps, [:public, :set, :named_table])
    :ets.new(:client_start_timestamps, [:public, :set, :named_table])
    :ets.new(:main_presenters, [:public, :set, :named_table])
    opts = [strategy: :one_for_one, name: MembraneLive.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    MembraneLiveWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
