ExUnit.start(capture_log: true)
Ecto.Adapters.SQL.Sandbox.mode(MembraneLive.Repo, :manual)
Application.ensure_all_started(:bypass)
