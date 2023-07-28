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
    EventService.update_event(:join, event_id)

    assert_broadcast("last_viewer_active", %{}, 1_000)
    assert_broadcast("finish_event", %{}, 1_000)

    assert_receive({:DOWN, _ref, :process, ^room_pid, _reason}, 11_000)
  end

  test "sends only finish event when event is empty", %{room_pid: room_pid, event_id: event_id} do
    EventService.update_event(:join, event_id)
    EventService.update_event(:leave, event_id)

    refute_broadcast("last_viewer_active", %{}, 1_000)
    assert_broadcast("finish_event", %{}, 1_000)

    assert_receive({:DOWN, _ref, :process, ^room_pid, _reason}, 11_000)
  end

  test "sends nothing when there are more then one user", %{
    room_pid: room_pid,
    event_id: event_id
  } do
    EventService.update_event(:join, event_id)
    EventService.update_event(:join, event_id)

    refute_broadcast("last_viewer_active", %{}, 1_000)
    refute_broadcast("finish_event", %{}, 1_000)

    refute_receive({:DOWN, _ref, :process, ^room_pid, _reason}, 11_000)
  end

  test "handles client responses correctly", %{room_pid: room_pid, event_id: event_id} do
    EventService.update_event(:join, event_id)

    assert_broadcast("last_viewer_active", %{}, 1_000)

    EventService.send_response(:stay, event_id)

    refute_broadcast("finish_event", %{}, 100)
    assert_broadcast("last_viewer_active", %{}, 1_000)

    EventService.send_response(:leave, event_id)

    assert_broadcast("finish_event", %{}, 1_000)

    assert_receive({:DOWN, _ref, :process, ^room_pid, _reason}, 11_000)
  end

  test "returns error when room already exists", %{room_pid: room_pid, event_id: event_id} do
    response = EventService.start_room(event_id)
    assert {:error, {:already_started, ^room_pid}} = response
  end
end
