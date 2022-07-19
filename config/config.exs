import Config

config :membrane_live,
  ecto_repos: [MembraneLive.Repo]

config :membrane_live, MembraneLiveWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [
    view: MembraneLiveWeb.ErrorView,
    format: "json",
    accepts: ~w(html json),
    layout: false
  ],
  pubsub_server: MembraneLive.PubSub,
  live_view: [signing_salt: "s4HsMuAM"]

config :membrane_live, MembraneLive.Mailer, adapter: Swoosh.Adapters.Local

config :swoosh, :api_client, false

config :esbuild,
  version: "0.14.29",
  default: [
    args:
      ~w(js/app.tsx --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
