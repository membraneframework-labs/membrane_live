defmodule MembraneLive.WebinarsTest do
  use MembraneLive.DataCase

  alias MembraneLive.Webinars

  describe "webinars" do
    alias MembraneLive.Webinars.Webinar

    import MembraneLive.WebinarsFixtures

    @invalid_attrs %{
      "description" => nil,
      "presenters" => nil,
      "start_date" => nil,
      "title" => nil
    }

    test "list_webinars/0 returns all webinars" do
      webinar = webinar_fixture()
      assert Webinars.list_webinars() == [webinar]
    end

    test "get_webinar!/1 returns the webinar with given id" do
      webinar = webinar_fixture()
      assert Webinars.get_webinar!(webinar.uuid) == webinar
    end

    test "create_webinar/1 with valid data creates a webinar" do
      valid_attrs = %{
        "description" => "some description",
        "presenters" => [],
        "start_date" => ~N[2022-07-17 10:20:00],
        "title" => "some title"
      }

      assert {:ok, %Webinar{} = webinar} = Webinars.create_webinar(valid_attrs)
      assert webinar.description == "some description"
      assert webinar.presenters == []
      assert webinar.start_date == ~N[2022-07-17 10:20:00]
      assert webinar.title == "some title"
    end

    test "create_webinar/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Webinars.create_webinar(@invalid_attrs)
    end

    test "update_webinar/2 with valid data updates the webinar" do
      webinar = webinar_fixture()

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

    test "update_webinar/2 with invalid data returns error changeset" do
      webinar = webinar_fixture()
      assert {:error, %Ecto.Changeset{}} = Webinars.update_webinar(webinar, @invalid_attrs)
      assert webinar == Webinars.get_webinar!(webinar.uuid)
    end

    test "delete_webinar/1 deletes the webinar" do
      webinar = webinar_fixture()
      assert {:ok, %Webinar{}} = Webinars.delete_webinar(webinar)
      assert_raise Ecto.NoResultsError, fn -> Webinars.get_webinar!(webinar.uuid) end
    end

    test "change_webinar/1 returns a webinar changeset" do
      webinar = webinar_fixture()
      assert %Ecto.Changeset{} = Webinars.change_webinar(webinar)
    end
  end
end
