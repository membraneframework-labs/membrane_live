defmodule MembraneLive.Tokens do
  @moduledoc """
  Module for generating, signing, verifying and validating the tokens used in the app.

  Google Token: - decode:   verification and validation
  Custom Token:
    - encode: generation and signing
    - decode: verification and validation
  """
  alias MembraneLive.Tokens.CustomToken
  alias MembraneLive.Tokens.GoogleToken

  @google_pems_url "https://www.googleapis.com/oauth2/v1/certs"
  @custom_secret "secret"

  def google_decode(jwt) do
    GoogleToken.verify_and_validate(jwt, get_signer(jwt))
  end

  defp get_signer(jwt) do
    Joken.Signer.create("RS256", get_public_keys(jwt))
  end

  defp get_public_keys(jwt) do
    {:ok, %{"kid" => key_id}} = Joken.peek_header(jwt)

    HTTPoison.get!(@google_pems_url)
    |> Map.get(:body)
    |> Jason.decode!()
    |> Map.get(key_id)
    |> then(&%{"pem" => &1})
  end

  def custom_encode(user_id) do
    signer = Joken.Signer.create("HS256", @custom_secret)
    CustomToken.generate_and_sign(%{"user_id" => user_id}, signer)
  end

  def custom_decode(jwt) do
    signer = Joken.Signer.create("HS256", @custom_secret)
    CustomToken.verify_and_validate(jwt, signer)
  end
end
