defmodule MembraneLive.EventServiceTest do
  @moduledoc false

  use MembraneLiveWeb.ChannelCase, async: true

  alias MembraneLive.EventService

  setup do
    event_id = Ecto.UUID.generate()
    @endpoint.subscribe("event:#{event_id}")

    {:ok, room_pid} = EventService.start_room(event_id)

    Process.monitor(room_pid)

    %{room_pid: room_pid, event_id: event_id}
  end

  test "sends notify when there is one user", %{room_pid: room_pid, event_id: event_id} do
    EventService.user_joined(event_id)

    assert_last_viewer_active()
    assert_finish_event()
    assert_down(room_pid)
  end

  test "sends only finish event when event is empty", %{room_pid: room_pid, event_id: event_id} do
    EventService.user_joined(event_id)
    EventService.user_left(event_id)

    refute_last_viewer_active()
    assert_finish_event()
    assert_down(room_pid)
  end

  test "sends nothing when there are more then one user", %{
    room_pid: room_pid,
    event_id: event_id
  } do
    EventService.user_joined(event_id)
    EventService.user_joined(event_id)

    refute_last_viewer_active()
    refute_finish_event()
    refute_down(room_pid)
  end

  test "handles client responses correctly", %{room_pid: room_pid, event_id: event_id} do
    EventService.user_joined(event_id)

    assert_last_viewer_active()

    EventService.stay_response(event_id)

    refute_finish_event(100)
    assert_last_viewer_active()

    EventService.leave_response(event_id)

    assert_finish_event()
    assert_down(room_pid)
  end

  test "returns error when room already exists", %{room_pid: room_pid, event_id: event_id} do
    response = EventService.start_room(event_id)
    assert {:error, {:already_started, ^room_pid}} = response
  end

  defp assert_finish_event(timeout \\ 1_000), do: assert_broadcast("finish_event", %{}, timeout)
  defp refute_finish_event(timeout \\ 1_000), do: refute_broadcast("finish_event", %{}, timeout)

  defp assert_last_viewer_active(), do: assert_broadcast("last_viewer_active", %{}, 1_000)
  defp refute_last_viewer_active(), do: refute_broadcast("last_viewer_active", %{}, 1_000)

  def assert_down(room_pid),
    do: assert_receive({:DOWN, _ref, :process, ^room_pid, _reason}, 11_000)

  def refute_down(room_pid),
    do: refute_receive({:DOWN, _ref, :process, ^room_pid, _reason}, 11_000)
end
