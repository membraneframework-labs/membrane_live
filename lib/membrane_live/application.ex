defmodule MembraneLive.Application do
  @moduledoc false
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      MembraneLive.Repo,
      {Phoenix.PubSub, name: MembraneLive.PubSub},
      MembraneLiveWeb.Presence,
      MembraneLiveWeb.Endpoint,
      {MembraneLive.EventController, name: EventController}
    ]

    [
      :presenters,
      :presenting_requests,
      :banned_from_chat,
      :start_timestamps,
      :client_start_timestamps,
      :main_presenters,
      :partial_segments
    ]
    |> Enum.each(&:ets.new(&1, [:public, :set, :named_table]))

    opts = [strategy: :one_for_one, name: MembraneLive.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    MembraneLiveWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
