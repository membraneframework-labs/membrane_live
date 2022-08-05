defmodule MembraneLiveWeb.LoginControllerTest do
  use MembraneLiveWeb.ConnCase

  describe "create" do
    test "[200]: jwt passes" do
    end

    test "[400]: jwt does not include user info" do
    end

    test "[401]: jwt is wrongly signed" do
    end
  end
end
