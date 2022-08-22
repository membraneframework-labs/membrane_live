import Config

config :membrane_live, MembraneLive.Repo,
  username: "swm",
  password: "swm123",
  hostname: "localhost",
  database: "membrane_live_test",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

config :membrane_live, MembraneLiveWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "/KNhS9gaf+T6d+c+o1fFbocEd5sfyHFSGW5kd4VOQb7+7TAta0C44JJrTI9YEWxT",
  server: false

config :membrane_live, MembraneLive.Mailer, adapter: Swoosh.Adapters.Test

config :membrane_live,
  google_private_key_path: Path.expand("./test/files/keys/jwtRS256.key"),
  google_public_key_path: Path.expand("./test/files/keys/jwtRS256.key.pub")

config :logger, level: :warn

config :phoenix, :plug_init_mode, :runtime
