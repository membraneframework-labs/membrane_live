import Config

config :membrane_live,
  ecto_repos: [MembraneLive.Repo],
  migration_primary_key: [name: :uuid, type: :binary_id]

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

config :membrane_live,
  hls_output_mount_path: "output",
  custom_secret: "secret",
  google_pems_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_id: "1003639280735-i6pl1d6m7f70m4ml66hgbno54qdj4a7o.apps.googleusercontent.com"

config :swoosh, :api_client, false

config :phoenix, :json_library, Jason

config :esbuild,
  version: "0.14.29",
  default: [
    args:
      ~w(js/app.tsx --bundle  --loader:.svg=dataurl --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :membrane_live, MembraneLiveWeb.Endpoint, pubsub_server: MembraneLive.PubSub

config :logger, level: :error

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

import_config "#{config_env()}.exs"

config :membrane_live,
  ecto_repos: [MembraneLive.Repo],
  migration_primary_key: [name: :uuid, type: :binary_id]

config :membrane_live, hls_output_mount_path: "output"
