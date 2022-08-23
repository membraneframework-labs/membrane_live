defmodule MembraneLiveWeb.Helpers.TokenErrorInfo do
  @moduledoc """
  module for error infos considering tokens (mostly their validation)
  """

  def get_error_info({:error, :no_jwt_in_header}),
    do: %{error: :bad_request, message: "Lack of authentication data"}

  def get_error_info({:error, :signature_error}),
    do: %{error: :unauthorized, message: "Token has an invalid signature"}

  def get_error_info({:error, [{:message, "Invalid token"} | [{:claim, "exp"} | _tail]]}),
    do: %{error: :unauthorized, message: "Auth token expiration time exceeded"}

  def get_error_info({:error, _error_reason}),
    do: %{error: :unauthorized, message: "Unknown token validation error"}
end
