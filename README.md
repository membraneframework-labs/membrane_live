# Membrane Live

[![API Docs](https://img.shields.io/badge/api-docs-yellow.svg?style=flat)](https://hexdocs.pm/membrane_core)
[![CircleCI](https://circleci.com/gh/membraneframework-labs/membrane_live.svg?style=svg)](https://circleci.com/gh/membraneframework-labs/membrane_live)

This repository contains a project created during the Summer Internship of 2022 in Software Mansion.

## Running app locally

To run the app locally it to have certain tools installed that is:

- Elixir
- Docker
- Rust

Also you need to set environment variables. File `.env.sample` contains all required environment variables with example values. Remember: having a valid google client id is also required.

For valid WebRTC connection follow instructions given at [Membrane Videoroom GitHub repository](https://github.com/membraneframework/membrane_videoroom).

After setting all needed environment variables, you have to start a database. To do this you can use this command:

```sh
docker-compose up membrane-live-db
```

Next you have to initialize database with commands:

```sh
mix ecto.create
mix ecto.migrate
```

or simply with

```sh
mix ecto.setup
```

On the end you can start phoenix app:

```sh
mix phx.server
```

## Copyright and License

Copyright 2022, [Software Mansion](https://swmansion.com/?utm_source=git&utm_medium=readme&utm_campaign=membrane_template_plugin)

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=membrane-github)](https://swmansion.com/?utm_source=git&utm_medium=readme&utm_campaign=membrane_template_plugin)

Licensed under the [Apache License, Version 2.0](LICENSE)
