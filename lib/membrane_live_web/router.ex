defmodule MembraneLiveWeb.Router do
  use MembraneLiveWeb, :router

  pipeline :browser do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, {MembraneLiveWeb.LayoutView, :root})
    # plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
  end

  pipeline :api do
    plug(:accepts, ["json"])
  end

  scope "/", MembraneLiveWeb do
    # TODO add Plug for checking jwt and g_csrf
    pipe_through(:browser)

    get("/", PageController, :index)
    resources("/webinars", WebinarController, except: [:edit, :new], param: "uuid")
    get("/event/*page", PageController, :index)
  end

  scope "/auth", MembraneLiveWeb do
    pipe_through(:browser)

    get("/", LoginController, :index)
    post("/login", LoginController, :create)
  end

  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/" do
      pipe_through(:browser)

      live_dashboard("/dashboard", metrics: MembraneLiveWeb.Telemetry)
    end
  end

  if Mix.env() == :dev do
    scope "/dev" do
      pipe_through(:browser)

      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end
end
