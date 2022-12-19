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
    get("/recordings/*page", PageController, :index)
    get("/video/:event_id/:filename", HLSController, :index)
    get("/video/:event_id/:stream_id/:filename", HLSController, :index)
  end

  scope "/", MembraneLiveWeb do
    pipe_through(:browser)
    pipe_through(:auth)
    get("/me", UserInfoController, :index)
  end

  scope "/resources/webinars", MembraneLiveWeb do
    pipe_through(:browser)

    get("/", WebinarController, :index)
    get("/:uuid", WebinarController, :show)
  end

  scope "/resources/recordings", MembraneLiveWeb do
    pipe_through(:browser)

    get("/", RecordingsController, :index)
    get("/:uuid", RecordingsController, :show)
  end

  scope "/resources", MembraneLiveWeb do
    pipe_through(:browser)
    pipe_through(:auth)

    resources("/webinars", WebinarController, except: [:edit, :new, :index, :show], param: "uuid")

    resources("/recordings", RecordingsController,
      except: [:edit, :new, :index, :create, :update, :show],
      param: "uuid"
    )

    resources("/users", UserController, except: [:edit, :new, :create], param: "uuid")

    get("/products", ProductController, :index)
  end

  scope "/auth", MembraneLiveWeb do
    pipe_through(:browser)

    post("/", LoginController, :create)
    post("/refresh", LoginController, :refresh)
  end
end
