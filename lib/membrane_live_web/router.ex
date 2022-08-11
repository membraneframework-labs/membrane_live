defmodule MembraneLiveWeb.Router do
  use MembraneLiveWeb, :router

  pipeline :browser do
    plug(:accepts, ["json"])
    plug(:put_root_layout, {MembraneLiveWeb.LayoutView, :root})
  end

  pipeline :api do
    plug(:accepts, ["json"])
  end

  pipeline :bearer do
    plug(MembraneLiveWeb.Plugs.BearerPlug)
  end

  scope "/", MembraneLiveWeb do
    pipe_through(:browser)
    pipe_through(:bearer)

    resources("/webinars", WebinarController, except: [:edit, :new], param: "uuid")
    get("/", PageController, :index)
    get("/video/:prefix/:filename", HLSController, :index)
    get("/event/*page", PageController, :index)
    resources("/users", UserController, except: [:edit, :new], param: "uuid")
  end

  scope "/auth", MembraneLiveWeb do
    pipe_through(:browser)

    get("/", LoginController, :index)
    post("/", LoginController, :create)
  end

  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/" do
      pipe_through(:browser)

      live_dashboard("/dashboard", metrics: MembraneLiveWeb.Telemetry)
    end
  end
end
