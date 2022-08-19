defmodule MembraneLive.Tokens do
  @moduledoc """
  Module for generating, signing, verifying and validating the tokens used in the app.

  Google Token: - decode:   verification and validation
  Auth Token:
    - encode: generation and signing
    - decode: verification and validation
  Refresh Token:
    - encode: generation and signing
    - decode: verification and validation
  """
  alias MembraneLive.Tokens.{AuthToken, GoogleToken, RefreshToken}

  @google_pems_url "https://www.googleapis.com/oauth2/v1/certs"

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

  @spec auth_encode(any) :: {:error, atom | keyword} | {:ok, binary, %{optional(binary) => any}}
  def auth_encode(user_id) do
    signer = create_auth_signer()
    AuthToken.generate_and_sign(%{"user_id" => user_id}, signer)
  end

  @spec auth_decode(binary) :: {:error, atom | keyword} | {:ok, %{optional(binary) => any}}
  def auth_decode(jwt) do
    signer = create_auth_signer()
    AuthToken.verify_and_validate(jwt, signer)
  end

  @spec refresh_encode(any) ::
          {:error, atom | keyword} | {:ok, binary, %{optional(binary) => any}}
  def refresh_encode(user_id) do
    signer = create_refresh_signer()
    RefreshToken.generate_and_sign(%{"user_id" => user_id}, signer)
  end

  @spec refresh_decode(binary) :: {:error, atom | keyword} | {:ok, %{optional(binary) => any}}
  def refresh_decode(jwt) do
    signer = create_refresh_signer()
    RefreshToken.verify_and_validate(jwt, signer)
  end

  defp create_auth_signer(),
    do: create_other_signer(:token_auth_secret)

  defp create_refresh_signer(),
    do: create_other_signer(:token_refresh_secret)

  defp create_other_signer(env_variable_atom),
    do:
      :membrane_live
      |> Application.fetch_env!(env_variable_atom)
      |> create_signer()

  defp create_signer(secret),
    do: Joken.Signer.create("HS256", secret)
end
