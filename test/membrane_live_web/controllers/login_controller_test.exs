defmodule MembraneLiveWeb.LoginControllerTest do
  use MembraneLiveWeb.ConnCase

  alias MembraneLive.Support.GoogleTokenMock
  alias Membrane

  describe "google auth" do
    test "[200]: jwt passes" do
      _mock_google_token = GoogleTokenMock.get_mock_jwt(%{})
      # NOT IMPLEMENTED YET
    end

    test "[401]: jwt is wrongly signed" do
      # NOT IMPLEMENTED YET
    end
  end

  describe "refresh" do
    test "[200] refresh token is valid" do
      _mock_google_token = GoogleTokenMock.get_mock_jwt(%{})

      # TODO
    end

    test "[401] refresh token is invalid" do
    end
  end
end
