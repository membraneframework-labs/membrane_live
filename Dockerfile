FROM hexpm/elixir:1.14.3-erlang-25.2.3-alpine-3.16.3 AS build

# install build dependencies
RUN apk add --no-cache \
    build-base \
    npm \
    git \
    python3 \
    make \
    cmake \
    curl \
    openssl-dev \ 
    libsrtp-dev \
    ffmpeg-dev \
    fdk-aac-dev \
    opus-dev \
    pkgconf


RUN git clone https://github.com/asdf-vm/asdf.git /root/.asdf -b v0.11.2
ENV PATH /root/.asdf/bin:/root/.asdf/shims:$PATH

RUN apk add --no-cache bash

# Rust
RUN asdf plugin-add rust \
    && asdf install rust 1.65.0 \
    && asdf global rust 1.65.0 \
    && rm -rf /tmp/*

# Ensure Rust was installed correctly
RUN \ 
    rustc --version; \
    rustup --version; \
    cargo --version;

ARG VERSION
ENV VERSION=${VERSION}

# Create build workdir
WORKDIR /app

# install hex + rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# set build ENV
ENV MIX_ENV=prod

# install mix dependencies
COPY mix.exs mix.lock ./
COPY config config
COPY assets assets
COPY priv priv
# the lib code must be there first so the tailwindcss can properly inspect the code
# to gather necessary classes to generate
COPY lib lib

RUN mix deps.get
RUN mix setup
RUN RUSTFLAGS="-C target-feature=-crt-static" mix deps.compile

RUN mix assets.deploy

# compile and build release
RUN mix do compile, release

# prepare release image
FROM alpine:3.16.3 AS app

# install runtime dependencies
RUN apk add --no-cache \ 
    openssl \
    libsrtp \
    ffmpeg \
    fdk-aac \
    curl \
    wget

WORKDIR /app

COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

ENTRYPOINT [ "./docker-entrypoint.sh" ]

RUN addgroup -S membrane && adduser -S membrane -G membrane

RUN chown membrane:membrane /app

USER membrane:membrane

COPY --from=build /app/_build/prod/rel/membrane_live ./

ENV HOME=/app

EXPOSE 4000

HEALTHCHECK CMD curl --fail http://localhost:4000 || exit 1  

CMD ["bin/membrane_live", "start"]