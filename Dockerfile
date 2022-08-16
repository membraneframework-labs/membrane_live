FROM membraneframeworklabs/docker_membrane AS build


# install build dependencies
RUN apt-get update \
    && apt-get install -y \
    npm \
    git \
    python3 \
    make \
    cmake \
    # openssl-dev \
    libssl-dev \ 
    # libsrtp-dev \
    # libsrtp0-dev \
    libsrtp2-dev \
    ffmpeg \
    clang-format \ 
    # fdk-aac \ 
    # fdk-aac-dev \
    # libfdk-aac1 \
    # opus \
    # opus-dev \
    libopus-dev \
    pkgconf


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
RUN mix deps.compile

RUN mix assets.deploy
# RUN mix phx.digest

# compile and build release


RUN mix do compile, release

# prepare release image
FROM membraneframeworklabs/docker_membrane AS app


# install runtime dependencies
RUN apt-get update \ 
    && apt-get install -y \
    openssl \
    # ncurses-libs \
    libncurses5-dev \
    libncursesw5-dev \
    libsrtp2-dev \
    ffmpeg \
    clang-format \ 
    curl
# libfdk-aac1

WORKDIR /app

COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

ENTRYPOINT [ "./docker-entrypoint.sh" ]


# RUN chown nobody:nobody /app

# USER nobody:nobody

COPY --from=build /app/_build/prod/rel/membrane_live ./

ENV HOME=/app

EXPOSE 4000

HEALTHCHECK CMD curl --fail http://localhost:4000 || exit 1  

CMD ["bin/membrane_live", "start"]