import Config

config :membrane_live,
  integrated_turn_domain: System.get_env("VIRTUAL_HOST"),
  token_auth_secret: "auth_secret",
  token_refresh_secret: "refresh_secret",
  token_issuer: System.get_env("TOKEN_ISSUER", "swmansion.com"),
  client_id: System.fetch_env!("GOOGLE_CLIENT_ID")

# if System.get_env("PHX_SERVER") do
#   config :membrane_live, MembraneLiveWeb.Endpoint, server: true
# end

protocol = if System.get_env("USE_TLS") == "true", do: :https, else: :http

get_env = fn env, default ->
  if config_env() == :prod do
    System.fetch_env!(env)
  else
    System.get_env(env, default)
  end
end

host = System.get_env("VIRTUAL_HOST", "localhost")
port = System.get_env("PHOENIX_PORT", "4000")

config :membrane_live, MembraneLive.Repo,
  username: System.get_env("POSTGRES_USER", "swm"),
  password: System.get_env("POSTGRES_PASSWORD", "swm123"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  database: System.get_env("POSTGRES_DB", "membrane_live_db"),
  port: System.get_env("POSTGRES_PORT", "5432"),
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

args =
  if protocol == :https do
    [
      keyfile: get_env.("KEY_FILE_PATH", "priv/certs/key.pem"),
      certfile: get_env.("CERT_FILE_PATH", "priv/certs/certificate.pem"),
      cipher_suite: :strong
    ]
  else
    []
  end
  |> Keyword.merge(otp_app: :membrane_live, port: port)

endpoint_config = [
  {:url, [host: host]},
  {protocol, args}
]

config :membrane_live, MembraneLiveWeb.Endpoint, [
  {:url, [host: host]},
  {protocol, args}
]

config :jellyfish_server_sdk,
  server_address: "localhost:5002",
  server_api_token: "development",
  secure?: false
