import Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :membrane_live, MembraneLive.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "membrane_live_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :membrane_live, MembraneLiveWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "/KNhS9gaf+T6d+c+o1fFbocEd5sfyHFSGW5kd4VOQb7+7TAta0C44JJrTI9YEWxT",
  server: false

# In test we don't send emails.
config :membrane_live, MembraneLive.Mailer, adapter: Swoosh.Adapters.Test

# Print only warnings and errors during test
config :logger, level: :warn

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
