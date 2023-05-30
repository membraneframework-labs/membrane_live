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

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:uuid, "~> 1.1"},
      {:jason, "~> 1.2"},
      {:joken, "~> 2.5"},
      {:swoosh, "~> 1.3"},
      {:bypass, "~> 2.1.0"},
      {:gettext, "~> 0.18"},
      {:inflex, "~> 2.0.0"},
      {:ecto_sql, "~> 3.6"},
      {:httpoison, "~> 1.8"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix, "~> 1.6.11"},
      {:plug_cowboy, "~> 2.5"},
      {:phoenix_html, "~> 3.0"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_fields, "~> 1.3.0"},
      {:phoenix_pubsub, "~> 2.1"},
      {:phoenix_inline_svg, "~> 1.4"},
      {:phoenix_live_view, "~> 0.17.5"},
      {:bimap, "~> 1.2", override: true},
      {:cowlib, "~> 2.11.0", override: true},
      {:ex_libsrtp, "~> 0.6.0", override: true},
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:esbuild, "~> 0.6", runtime: Mix.env() == :dev},
      {:ex_doc, ">= 0.0.0", only: :dev, runtime: false},
      {:credo, ">= 0.0.0", only: [:dev, :test], runtime: false},
      {:membrane_rtc_engine, github: "jellyfish-dev/membrane_rtc_engine", ref: "9116fa9f9258a2357f0da1092243fe57a10e71cb"},

      # Otel
      {:opentelemetry, "1.0.5"},
      {:opentelemetry_api, "1.0.3"},
      {:opentelemetry_zipkin, "1.0.0"},
      {:opentelemetry_exporter, "1.0.4"},
      {:membrane_h264_plugin, "~> 0.2.0"},
      {:membrane_mp4_plugin, "~> 0.21.0"},
      {:membrane_aac_plugin, "~> 0.13.0"},
      {:membrane_opus_plugin, "~> 0.16.0"},
      {:membrane_aac_fdk_plugin, "~> 0.14.0"},
      {:membrane_generator_plugin, "~> 0.8.1"},
      {:membrane_realtimer_plugin, "~> 0.6.0"},
      {:membrane_audio_mix_plugin, "~> 0.12.0"},
      {:membrane_audio_filler_plugin, "~> 0.1.0"},
      {:membrane_h264_ffmpeg_plugin, "~> 0.26.2"},
      {:membrane_ffmpeg_swscale_plugin, "~> 0.11.1"},
      {:membrane_video_compositor_plugin, "~> 0.3.1"},
      {:membrane_framerate_converter_plugin, "~> 0.6.0"},
      {:membrane_http_adaptive_stream_plugin, "~> 0.14.0"}
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
      setup: ["deps.get", "cmd --cd assets npm ci --legacy-peer-deps"],
      "assets.deploy": [
        "esbuild default --minify",
        "phx.digest"
      ],
      test: [
        "cmd ./scripts/key-gen.sh",
        "test --warnings-as-errors"
      ],
      "ecto.setup": [
        "ecto.create",
        "ecto.migrate"
      ],
      "ecto.restart": [
        "ecto.drop",
        "ecto.create",
        "ecto.migrate"
      ]
    ]
  end
end
