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

  FYI: pem = Privacy-Enhanced Mail - format for storing cryptographic keys. In this case: google public keys
  """
  alias MembraneLive.Tokens.{AuthToken, GoogleToken, RefreshToken}

  def google_decode(jwt) do
    with {:ok, signer} <- get_signer(jwt) do
      GoogleToken.verify_and_validate(jwt, signer)
    else
      err -> err
    end
  end

  defp get_signer(jwt) do
    with {:ok, public_keys} <- get_public_keys(jwt) do
      {:ok, Joken.Signer.create("RS256", public_keys)}
    else
      err -> err
    end
  end

  defp get_public_keys(jwt) do
    with {:ok, %{"kid" => key_id}} <- Joken.peek_header(jwt),
         {:ok, pem_response} <- fetch_google_public_pems() do
      pem_response
      |> Map.get(:body)
      |> Jason.decode!()
      |> Map.get(key_id)
      |> then(&{:ok, %{"pem" => &1}})
    else
      {:error, :token_malformed} -> {:error, :invalid_jwt_header}
      err -> err |> IO.inspect()
    end
  end

  defp fetch_google_public_pems() do
    :membrane_live
    |> Application.fetch_env!(:google_pems_url)
    |> HTTPoison.get()
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
