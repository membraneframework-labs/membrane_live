defmodule MembraneLive.Tokens.GoogleToken do
  @moduledoc """
  Module for verifying and validating google tokens
  """

  alias Joken.Config

  @client_id "1003639280735-i6pl1d6m7f70m4ml66hgbno54qdj4a7o.apps.googleusercontent.com"
  @possible_issuers ["accounts.google.com", "https://accounts.google.com"]

  def verify_and_validate(jwt, signer) do
    Joken.verify_and_validate(get_claims(), jwt, signer)
  end

  defp get_claims() do
    %{}
    |> Config.add_claim("aud", nil, &(&1 == @client_id))
    |> Config.add_claim("exp", nil, &(Joken.current_time() <= &1))
    |> Config.add_claim("iss", nil, &Enum.member?(@possible_issuers, &1))
  end
end
