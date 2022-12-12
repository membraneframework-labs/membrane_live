defmodule MembraneLive.Event.Timer do
  @moduledoc false
  @enforce_keys [:timer_ref, :state, :receiver]

  defstruct @enforce_keys

  @type t :: %__MODULE__{
          timer_ref: nil | reference(),
          state: :idle | :notify | :kill,
          receiver: pid() | atom()
        }

  @spec create(pid() | atom()) :: __MODULE__.t()
  def create(receiver) do
    %__MODULE__{
      timer_ref: nil,
      state: :idle,
      receiver: receiver
    }
  end

  @spec handle_action(
          __MODULE__.t(),
          :start_notify | :start_kill | :reset | :stop | :end_event,
          Keyword.t()
        ) ::
          {:ok | :timeout, __MODULE__.t()}
  def handle_action(timer, action, opts \\ [])

  def handle_action(timer, :start_notify, timeout: timeout) do
    cancel(timer)

    ref = Process.send_after(timer.receiver, {:timer_timeout, :notify}, timeout)
    {:ok, %{timer | timer_ref: ref, state: :notify}}
  end

  def handle_action(timer, :start_kill, timeout: timeout) do
    cancel(timer)

    ref = Process.send_after(timer.receiver, {:timer_timeout, :kill}, timeout)
    {:ok, %{timer | timer_ref: ref, state: :kill}}
  end

  def handle_action(timer, :stop, _opts) do
    cancel(timer)

    {:ok, %{timer | timer_ref: nil, state: :idle}}
  end

  def handle_action(timer, :reset, timeout: timeout) do
    case timer.state do
      :kill ->
        cancel(timer)
        ref = Process.send_after(timer.receiver, {:timer_timeout, :notify}, timeout)
        {:ok, %{timer | timer_ref: ref, state: :notify}}

      _state ->
        {:ok, timer}
    end
  end

  def handle_action(timer, :end_event, _opts) do
    case timer.state do
      :kill ->
        cancel(timer)
        {:timeout, %{timer | timer_ref: nil, state: :idle}}

      _state ->
        {:ok, timer}
    end
  end

  defp cancel(timer) do
    case timer.timer_ref do
      nil -> false
      ref -> Process.cancel_timer(ref)
    end
  end
end
