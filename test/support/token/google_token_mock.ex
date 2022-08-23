defmodule MembraneLive.Support.GoogleTokenMock do
  @moduledoc """
  Module imitating the google auth jwt creation process
  """

  use Joken.Config

  @kid "1727b6b49402b9cf95be4e8fd38aa7e7c11644b1"

  @impl true
  def token_config,
    do:
      default_claims(
        iss: "accounts.google.com",
        aud: Application.fetch_env!(:membrane_live, :client_id)
      )

  @doc """
  Mocks the response from the www.googleapis.com/oauth2/v1/certs
  """
  def get_google_public_key() do
    public_key_location = Application.fetch_env!(:membrane_live, :google_public_key_path)
    public_key = File.read!(public_key_location)
    %{@kid => public_key} |> Jason.encode!()
  end

  def get_mock_jwt(user) do
    claims = claims_from_user(user)
    signer = get_default_signer()
    generate_and_sign(claims, signer)
  end

  defp get_default_signer() do
    private_key =
      Application.fetch_env!(:membrane_live, :google_private_key_path)
      |> File.read!()

    Joken.Signer.create("RS256", %{"pem" => private_key}, %{"kid" => @kid})
  end

  defp claims_from_user(user) do
    %{
      "name" => user.name,
      "email" => user.email,
      "picture" => user.picture
    }
  end

  def wrongly_signed_jwt() do
    signer = get_invalid_signer()
    generate_and_sign(%{}, signer)
  end

  defp get_invalid_signer() do
    get_signer(:google_invalid_priv_key_path)
  end

  defp get_signer(env_key) do
    private_key = Application.fetch_env!(:membrane_live, env_key) |> File.read!()

    Joken.Signer.create("RS256", %{"pem" => private_key}, %{"kid" => @kid})
  end
end
