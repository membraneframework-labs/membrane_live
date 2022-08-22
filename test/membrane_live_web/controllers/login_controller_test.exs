defmodule MembraneLiveWeb.LoginControllerTest do
  use MembraneLiveWeb.ConnCase

  import MembraneLive.AccountsFixtures

  alias MembraneLive.Accounts.User
  alias MembraneLive.Support.GoogleTokenMock
  alias MembraneLive.Repo
  alias MembraneLive.Tokens

  describe "google auth" do
    test "[200]: jwt passes" do
      user = user_fixture() |> Repo.insert!()
      _mock_google_token = GoogleTokenMock.get_mock_jwt(user)
      # NOT IMPLEMENTED YET
    end

    test "[401]: jwt is wrongly signed" do
      # NOT IMPLEMENTED YET
    end
  end

  describe "refresh" do
    test "[200] refresh token is valid" do
      user = user_fixture() |> Repo.insert!()

      # TODO
    end

    test "[401] refresh token is invalid" do
    end
  end
end
