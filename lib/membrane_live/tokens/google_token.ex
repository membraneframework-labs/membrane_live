defmodule MembraneLive.Tokens.GoogleToken do
  @moduledoc """
  Module for verifying and validating google tokens
  """

  alias Joken.Config

  @possible_issuers ["accounts.google.com", "https://accounts.google.com"]

  def verify_and_validate(jwt, signer) do
    Joken.verify_and_validate(get_claims(), jwt, signer)
  end

  defp get_claims() do
    %{}
    |> Config.add_claim("aud", nil, &(&1 == Application.fetch_env!(:membrane_live, :client_id)))
    |> Config.add_claim("exp", nil, &(Joken.current_time() <= &1))
    |> Config.add_claim("iss", nil, &Enum.member?(@possible_issuers, &1))
  end
end
