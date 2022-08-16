import Config

config :phoenix, :json_library, Jason

config :esbuild,
  version: "0.14.29",
  default: [
    args:
      ~w(js/app.tsx --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
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
