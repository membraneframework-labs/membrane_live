defmodule Membrane.Live.Mixfile do
  use Mix.Project

  @version "0.1.0"
  @github_url "https://github.com/membraneframework-labs/membrane_live"

  def project do
    [
      app: :membrane_live,
      version: @version,
      elixir: "~> 1.13",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      aliases: aliases(),
      preferred_cli_env: [ci: :test],

      # hex
      description: "Membrane Live App",
      package: package(),

      # docs
      name: "Membrane Live",
      source_url: @github_url,
      homepage_url: "https://membraneframework.org",
      docs: docs()
    ]
  end

  def application do
    [
      mod: {MembraneLive.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:phoenix, "~> 1.6.11"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_sql, "~> 3.6"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix_html, "~> 3.0"},
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:phoenix_live_view, "~> 0.17.5"},
      {:esbuild, "~> 0.4", runtime: Mix.env() == :dev},
      {:swoosh, "~> 1.3"},
      {:gettext, "~> 0.18"},
      {:jason, "~> 1.2"},
      {:plug_cowboy, "~> 2.5"},
      {:membrane_core, "~> 0.10.0"},
      {:ex_doc, ">= 0.0.0", only: :dev, runtime: false},
      {:credo, ">= 0.0.0", only: [:dev, :test], runtime: false},
      {:membrane_rtc_engine, github: "membraneframework/membrane_rtc_engine"},
      {:phoenix_inline_svg, "~> 1.4"},
      {:uuid, "~> 1.1"},
      {:cowlib, "~> 2.11.0", override: true},
      {:joken, "~> 2.5"},
      {:httpoison, "~> 1.8"},
      {:ecto_fields, "~> 1.3.0"},

      # Otel
      {:opentelemetry, "~> 1.0"},
      {:opentelemetry_api, "~> 1.0"},
      {:opentelemetry_exporter, "1.0.4"},
      {:opentelemetry_zipkin, "~> 1.0"},

      # HLS_Endpoint deps
      {:membrane_http_adaptive_stream_plugin, "~> 0.8.0"},
      {:membrane_mp4_plugin, "~> 0.16.0"},
      {:membrane_h264_ffmpeg_plugin, "~> 0.21.5"},
      {:membrane_aac_plugin, "~> 0.12.0"},
      {:membrane_aac_format, "~> 0.7.0"},
      {:membrane_aac_fdk_plugin, "~> 0.13.0"},
      {:membrane_opus_plugin, github: "membraneframework/membrane_opus_plugin", override: true}
    ]
  end

  defp package do
    [
      maintainers: ["Membrane Team"],
      licenses: ["Apache-2.0"],
      links: %{
        "GitHub" => @github_url,
        "Membrane Framework Homepage" => "https://membraneframework.org"
      }
    ]
  end

  defp docs do
    [
      main: "readme",
      extras: ["README.md", "LICENSE"],
      formatters: ["html"],
      source_ref: "v#{@version}",
      nest_modules_by_prefix: [Membrane.Template]
    ]
  end

  def aliases do
    [
      ci: [
        "format --check-formatted",
        "compile --force --warnings-as-errors",
        "test --warnings-as-errors",
        "credo"
      ],
      setup: ["deps.get", "cmd --cd assets npm ci"],
      "assets.deploy": [
        "esbuild default --minify",
        "phx.digest"
      ]
    ]
  end
end
