defmodule MembraneLive.EventService do
  @moduledoc """
  Module responsible for controlling life times of events.

  EventService keeps track of the number of users in each event.
  The event service will set a timer that will:
   * send notification - if there is only one user in the event.
   * end event - if there is no one in the event, or immediately if the response to notification is `:leave`.

  Notification - is a message to the user asking whether he wants to stay or leave the event.
  Each change in the number of users in the event removes the old-timer.
  """

  use GenServer
  use Bunch.Access

  require Logger

  alias MembraneLive.Room

  @notify_after Application.compile_env!(:membrane_live, :last_peer_timeout_ms)
  @kill_after Application.compile_env!(:membrane_live, :empty_event_timeout_ms)
  @response_timeout Application.compile_env!(:membrane_live, :response_timeout_ms)

  @enforce_keys []
  defstruct @enforce_keys ++ [events: %{}, pid_to_id: %{}]

  @type event :: %{users_number: non_neg_integer(), timer_ref: reference()}
  @type event_id :: String.t()
  @type event_action :: :join | :leave
  @type user_response :: :stay | :leave

  @type t :: %{
          events: %{event_id() => event()},
          pid_to_id: %{pid() => event_id()}
        }

  def start(init_arg, opts) do
    GenServer.start(__MODULE__, init_arg, opts)
  end

  def start_link(opts) do
    GenServer.start_link(__MODULE__, [], opts)
  end

  @impl true
  def init(_opts), do: {:ok, %__MODULE__{}}

  @doc """
  Updates event state and start timer with action (`:notify`, `:kill`) if needed.
  Should be called every time someone joins event.
  """
  @spec join_event(event_id()) :: {:event, event_action(), event_id()}
  def join_event(event_id) do
    send(EventService, {:event, :join, event_id})
  end

  @doc """
  Updates event state and start timer with action (`:notify`, `:kill`) if needed.
  Should be called every time someone leaves event.
  """
  @spec leave_event(event_id()) :: {:event, event_action(), event_id()}
  def leave_event(event_id) do
    send(EventService, {:event, :leave, event_id})
  end

  @doc """
  Starts and monitor room.
  In case of a room crash `EventService` will end the event.
  Should be called to spawn a room.
  """
  @spec start_room(event_id()) :: {:ok, pid()} | {:error, {:already_started, pid()}}
  def start_room(event_id) do
    case GenServer.call(EventService, {:start_room, event_id}) do
      {:already_started, _pid} = reason ->
        {:error, reason}

      pid ->
        {:ok, pid}
    end
  end

  @doc """
  Sets new timer with notifiaction.
  Should be called when user sends response to EventService notification `last_viewer_answer`.
  """
  @spec stay_response(event_id()) :: {:response, event_id(), user_response()}
  def stay_response(event_id) do
    send(EventService, {:response, event_id, :stay})
  end

  @doc """
  Ends the event or sets.
  Should be called when user sends `leave` response to EventService notification `last_viewer_answer`.
  """
  @spec leave_response(event_id()) :: {:response, event_id(), user_response()}
  def leave_response(event_id) do
    send(EventService, {:response, event_id, :leave})
  end

  @doc """
  Ends the event and marked is as finished in database.
  """
  @spec send_kill(event_id()) :: {:kill, event_id()}
  def send_kill(event_id), do: send(EventService, {:kill, event_id})

  @impl true
  def handle_call({:start_room, event_id}, _from, state) do
    case :global.whereis_name(event_id) do
      :undefined ->
        {:ok, pid} = Room.start(event_id, name: {:global, event_id})
        state = put_in(state, [:pid_to_id, pid], event_id)
        Process.monitor(pid)
        {:reply, pid, state}

      pid ->
        {:reply, {:already_started, pid}, state}
    end
  end

  @impl true
  def handle_info({:event, action, event_id}, state) do
    previous_users_number = get_in(state.events, [event_id, :users_number]) || 0
    timer_ref = get_in(state.events, [event_id, :timer_ref])

    users_number =
      case action do
        :join -> previous_users_number + 1
        :leave -> previous_users_number - 1
      end

    timer_ref =
      case users_number do
        0 ->
          cancel_action(timer_ref)
          kill_action(event_id)

        1 ->
          cancel_action(timer_ref)
          notify_action(event_id)

        2 ->
          cancel_action(timer_ref)
          nil

        _other ->
          nil
      end

    event = %{users_number: users_number, timer_ref: timer_ref}
    {:noreply, put_in(state, [:events, event_id], event)}
  end

  @impl true
  def handle_info({:notify, event_id}, state) do
    MembraneLiveWeb.Endpoint.broadcast!("event:" <> event_id, "last_viewer_active", %{
      timeout: @response_timeout
    })

    timer_ref = kill_action(event_id)
    {:noreply, put_in(state, [:events, event_id, :timer_ref], timer_ref)}
  end

  @impl true
  def handle_info({:response, event_id, :leave}, state) do
    __MODULE__.send_kill(event_id)
    {:noreply, state}
  end

  @impl true
  def handle_info({:response, event_id, :stay}, state) do
    users_number = get_in(state.events, [event_id, :users_number])
    timer_ref = get_in(state.events, [event_id, :timer_ref])

    cancel_action(timer_ref)

    timer_ref =
      case users_number do
        0 -> kill_action(event_id)
        1 -> notify_action(event_id)
        _other -> nil
      end

    {:noreply, put_in(state, [:events, event_id, :timer_ref], timer_ref)}
  end

  @impl true
  def handle_info({:kill, event_id}, state) do
    pid = :global.whereis_name(event_id)

    {event, state} = pop_in(state, [:events, event_id])
    {_event_id, state} = pop_in(state, [:pid_to_id, pid])

    unless pid == :undefined do
      Room.kill(pid)
    end

    unless is_nil(event) do
      finish_event(event_id)
    end

    {:noreply, state}
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, pid, _reason}, state) do
    {event_id, state} = pop_in(state, [:pid_to_id, pid])
    {_event, state} = pop_in(state, [:events, event_id])

    unless is_nil(event_id) do
      finish_event(event_id)
    end

    {:noreply, state}
  end

  defp notify_action(event_id),
    do: Process.send_after(EventService, {:notify, event_id}, @notify_after)

  defp kill_action(event_id), do: Process.send_after(EventService, {:kill, event_id}, @kill_after)

  defp cancel_action(nil), do: nil
  defp cancel_action(ref), do: Process.cancel_timer(ref)

  defp finish_event(event_id) do
    MembraneLiveWeb.Endpoint.broadcast!("event:" <> event_id, "finish_event", %{})
    MembraneLive.Webinars.mark_webinar_as_finished(event_id)
  end
end
