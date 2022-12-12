defmodule MembraneLive.Event.Timer do
  @moduledoc false
  @enforce_keys [:timer_ref, :state, :receiver]

  defstruct @enforce_keys

  @type t :: %__MODULE__{
          timer_ref: nil | reference(),
          state: :idle | :notify | :kill,
          receiver: pid() | atom()
        }

  @minute 60 * 1000

  @notify_timeout 15 * @minute
  @kill_timeout_long 15 * @minute
  @kill_timeout_short 2 * @minute

  @spec create(pid() | atom()) :: __MODULE__.t()
  def create(receiver) do
    %__MODULE__{
      timer_ref: nil,
      state: :idle,
      receiver: receiver
    }
  end

  @spec start_notify(__MODULE__.t()) :: __MODULE__.t()
  def start_notify(timer) do
    cancel(timer)

    ref = Process.send_after(timer.receiver, :notify, @notify_timeout)
    %__MODULE__{timer | timer_ref: ref, state: :notify}
  end

  @spec start_kill(__MODULE__.t()) :: __MODULE__.t()
  def start_kill(timer) do
    cancel(timer)

    ref = Process.send_after(timer.receiver, :kill, @kill_timeout_long)
    %__MODULE__{timer | timer_ref: ref, state: :kill}
  end

  @spec stop(__MODULE__.t()) :: __MODULE__.t()
  def stop(timer) do
    cancel(timer)

    %__MODULE__{timer | timer_ref: nil, state: :idle}
  end

  defp cancel(timer) do
    case timer.timer_ref do
      nil -> false
      ref -> Process.cancel_timer(ref)
    end
  end
end
