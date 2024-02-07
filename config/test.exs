import Config

bypass_port = 2137

config :membrane_live, MembraneLive.Repo,
  username: "swm",
  password: "swm123",
  hostname: "localhost",
  database: "membrane_live_test",
  pool: Ecto.Adapters.SQL.Sandbox

config :membrane_live, MembraneLiveWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "/KNhS9gaf+T6d+c+o1fFbocEd5sfyHFSGW5kd4VOQb7+7TAta0C44JJrTI9YEWxT",
  server: false

config :membrane_live, MembraneLive.Mailer, adapter: Swoosh.Adapters.Test

config :membrane_live,
  bypass_port: bypass_port,
  google_private_key_path: Path.expand("./test/files/keys/jwtRS256.key"),
  google_invalid_priv_key_path: Path.expand("./test/files/keys/jwtRS256-invalid.key"),
  google_public_key_path: Path.expand("./test/files/keys/jwtRS256.key.pub"),
  google_pems_url: "http://localhost:#{bypass_port}",
  empty_event_timeout_ms: 100,
  last_peer_timeout_ms: 100,
  response_timeout_ms: 100

config :logger, level: :warning

config :phoenix, :plug_init_mode, :runtime
