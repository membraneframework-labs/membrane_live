defmodule MembraneLiveWeb.Router do
  use MembraneLiveWeb, :router

  pipeline :browser do
    plug(:accepts, ["json"])
    plug(:put_root_layout, {MembraneLiveWeb.LayoutView, :root})
  end

  pipeline :api do
    plug(:accepts, ["json"])
  end

  pipeline :auth do
    plug(MembraneLiveWeb.Plugs.Auth)
  end

  scope "/", MembraneLiveWeb do
    pipe_through(:browser)

    get("/", PageController, :index)
    get("/event/*page", PageController, :index)
    get("/video/:prefix/:filename", HLSController, :index)
  end

  scope "/resources", MembraneLiveWeb do
    pipe_through(:browser)
    pipe_through(:auth)

    resources("/webinars", WebinarController, except: [:edit, :new], param: "uuid")
    resources("/users", UserController, except: [:edit, :new], param: "uuid")
  end

  scope "/auth", MembraneLiveWeb do
    pipe_through(:browser)

    get("/", LoginController, :index)
    post("/", LoginController, :create)
  end
end
