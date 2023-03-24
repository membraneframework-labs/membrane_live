defmodule MembraneLiveWeb.Router do
  use MembraneLiveWeb, :router

  pipeline :browser do
    plug(:accepts, ["json"])
    plug(:put_root_layout, {MembraneLiveWeb.LayoutView, :root})
  end

  pipeline :api do
    plug(:accepts, ["json"])
  end

  pipeline :auth_unrestricted do
    plug(MembraneLiveWeb.Plugs.Auth, :unrestricted)
  end

  pipeline :auth_restricted do
    plug(MembraneLiveWeb.Plugs.Auth, :restricted)
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
    pipe_through(:auth_restricted)
    get("/me", UserInfoController, :index)
  end

  scope "/resources/webinars", MembraneLiveWeb do
    pipe_through(:browser)

    get("/:uuid", WebinarController, :show)
    get("/:uuid/products", WebinarProductController, :index)
  end

  scope "/resources/webinars", MembraneLiveWeb do
    pipe_through(:browser)
    pipe_through(:auth_unrestricted)

    get("/", WebinarController, :index)
  end

  scope "/resources/recordings", MembraneLiveWeb do
    pipe_through(:browser)

    get("/:uuid", RecordingsController, :show)
  end

  scope "/resources/recordings", MembraneLiveWeb do
    pipe_through(:browser)
    pipe_through(:auth_unrestricted)

    get("/", RecordingsController, :index)
  end

  scope "/resources/chat", MembraneLiveWeb do
    pipe_through(:browser)

    get("/:uuid", ChatController, :index)
  end

  scope "/resources", MembraneLiveWeb do
    pipe_through(:browser)
    pipe_through(:auth_restricted)

    get("/products", ProductController, :index)

    resources("/recordings", RecordingsController,
      except: [:edit, :new, :index, :create, :update, :show],
      param: "uuid"
    )

    resources("/users", UserController, except: [:edit, :new, :create], param: "uuid")
    resources("/webinars", WebinarController, except: [:edit, :new, :index, :show], param: "uuid")

    resources("/webinars/:webinar_uuid/products", WebinarProductController,
      only: [:create, :delete],
      param: "product_uuid"
    )
  end

  scope "/auth", MembraneLiveWeb do
    pipe_through(:browser)

    post("/", LoginController, :create)
    post("/refresh", LoginController, :refresh)
  end
end
