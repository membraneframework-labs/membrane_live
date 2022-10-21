defmodule MembraneLive.WebinarsTest do
  use MembraneLive.DataCase
  import MembraneLive.AccountsFixtures
  import MembraneLive.WebinarsFixtures

  alias MembraneLive.Webinars
  alias MembraneLive.Webinars.Webinar

  setup do
    user = user_fixture()

    %{user: user}
  end

  describe "webinars" do
    @invalid_attrs %{
      "description" => nil,
      "presenters" => nil,
      "start_date" => nil,
      "title" => nil
    }

    test "list_webinars/0 returns all webinars", %{user: user} do
      webinar = webinar_fixture(user) |> Map.put(:email, user.email)
      assert Webinars.list_webinars() == [webinar]
    end

    test "get_webinar!/1 returns the webinar with given id", %{user: user} do
      webinar = webinar_fixture(user)
      assert Webinars.get_webinar!(webinar.uuid) == webinar
    end

    test "create_webinar/1 with valid data creates a webinar", %{user: user} do
      valid_attrs = %{
        "description" => "some description",
        "presenters" => [],
        "start_date" => ~N[2022-07-17 10:20:00],
        "title" => "some title"
      }

      assert {:ok, %Webinar{} = webinar} = Webinars.create_webinar(valid_attrs, user.uuid)
      assert webinar.description == "some description"
      assert webinar.presenters == []
      assert webinar.start_date == ~N[2022-07-17 10:20:00]
      assert webinar.title == "some title"
    end

    test "create_webinar/1 with invalid data returns error changeset", %{user: user} do
      assert {:error, %Ecto.Changeset{}} = Webinars.create_webinar(@invalid_attrs, user.uuid)
    end

    test "update_webinar/2 with valid data updates the webinar", %{user: user} do
      webinar = webinar_fixture(user)

      update_attrs = %{
        "description" => "some updated description",
        "presenters" => [],
        "start_date" => ~N[2022-07-18 10:20:00],
        "title" => "some updated title"
      }

      assert {:ok, %Webinar{} = webinar} = Webinars.update_webinar(webinar, update_attrs)
      assert webinar.description == "some updated description"
      assert webinar.presenters == []
      assert webinar.start_date == ~N[2022-07-18 10:20:00]
      assert webinar.title == "some updated title"
    end

    test "update_webinar/2 with invalid data returns error changeset", %{user: user} do
      webinar = webinar_fixture(user)
      assert {:error, %Ecto.Changeset{}} = Webinars.update_webinar(webinar, @invalid_attrs)
      assert webinar == Webinars.get_webinar!(webinar.uuid)
    end

    test "delete_webinar/1 deletes the webinar", %{user: user} do
      webinar = webinar_fixture(user)
      assert {:ok, %Webinar{}} = Webinars.delete_webinar(webinar)
      assert_raise Ecto.NoResultsError, fn -> Webinars.get_webinar!(webinar.uuid) end
    end

    test "change_webinar/1 returns a webinar changeset", %{user: user} do
      webinar = webinar_fixture(user)
      assert %Ecto.Changeset{} = Webinars.change_webinar(webinar)
    end
  end
end
