defmodule MembraneLive.Support.GoogleTokenMock do
  @moduledoc """
  Module imitating the google auth jwt creation process
  """

  use Joken.Config
  alias MembraneLive.Accounts.User

  @impl true
  def token_config, do: default_claims(iss: "accounts.google.com")

  @spec get_public_key :: binary
  def get_public_key() do
    public_key_location = Application.fetch_env!(:membrane_live, :google_p_key_path)
    File.read!(public_key_location)
  end

  def get_mock_jwt(%User{} = user) do
    claims = claims_from_user(user)
    signer = get_default_signer()
    generate_and_sign!(claims, signer)
  end

  defp get_default_signer() do
    private_key =
      Application.fetch_env!(:membrane_live, :google_private_key_path)
      |> File.read!()

    Joken.Signer.create("RS256", %{"pem" => private_key})
  end

  defp claims_from_user(%User{} = user) do
    %{
      "name" => user.name,
      "email" => user.email,
      "picture" => user.picture
    }
  end
end
