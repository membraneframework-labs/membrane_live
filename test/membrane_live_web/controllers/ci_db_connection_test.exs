defmodule MembraneLiveWeb.CiDbConnectionTest do
  use MembraneLiveWeb.ConnCase
  alias MembraneLive.{Repo, User}

  test "write and read from db", _params do
    name = "John Doe"
    Repo.insert(%User{name: name})
    [john | _] = Repo.all(User)

    assert john.name == "aa"
  end
end
