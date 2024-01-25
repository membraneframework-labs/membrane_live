defmodule MembraneLiveWeb.Helpers.EtsHelper do
  @moduledoc false
  # Helper functions for EventChannel

  def check_if_banned_from_chat(email, id),
    do: check_if_exist_in_ets(:banned_from_chat, email, true, id)

  def check_if_presenter(email, should_be_presenter, id),
    do: check_if_exist_in_ets(:presenters, email, should_be_presenter, id)

  def check_if_request_presenting(email, requests_presenting, id),
    do: check_if_exist_in_ets(:presenting_requests, email, requests_presenting, id)

  def remove_from_banned_from_chat(email, id),
    do: remove_from_list_in_ets(:banned_from_chat, email, id)

  def add_to_banned_from_chat(email, id), do: add_to_list_in_ets(:banned_from_chat, email, id)
  def remove_from_presenters(email, id), do: remove_from_list_in_ets(:presenters, email, id)

  def add_to_presenters(email, id), do: add_to_list_in_ets(:presenters, email, id)

  def remove_from_presenting_requests(email, id),
    do: remove_from_list_in_ets(:presenting_requests, email, id)

  def add_to_presenting_request(email, id),
    do: add_to_list_in_ets(:presenting_requests, email, id)

  def is_ets_empty?(ets_key, id) do
    [{_key, presenters}] = :ets.lookup(ets_key, id)
    if presenters == MapSet.new([]), do: true, else: false
  end

  defp check_if_exist_in_ets(ets_key, email, client_bool, id) do
    [{_key, presenters}] = :ets.lookup(ets_key, id)
    in_ets = MapSet.member?(presenters, email)

    case {client_bool, in_ets} do
      {true, _in_ets} ->
        {:ok, in_ets}

      {false, true} ->
        remove_from_presenters(email, id)
        {:ok, false}

      {false, false} ->
        {:ok, false}
    end
  end

  defp remove_from_list_in_ets(ets_key, email, id) do
    [{_key, presenters}] = :ets.lookup(ets_key, id)
    :ets.insert(ets_key, {id, MapSet.delete(presenters, email)})
  end

  defp add_to_list_in_ets(ets_key, email, id) do
    [{_key, presenters}] = :ets.lookup(ets_key, id)
    :ets.insert(ets_key, {id, MapSet.put(presenters, email)})
  end
end
