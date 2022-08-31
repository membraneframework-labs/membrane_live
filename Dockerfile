FROM membraneframeworklabs/docker_membrane AS build


# install build dependencies
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    npm \
    git \
    python3 \
    make \
    cmake \
    libssl-dev \ 
    libsrtp2-dev \
    ffmpeg \
    clang-format \ 
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

# compile and build release
RUN mix do compile, release

# prepare release image
FROM ubuntu:20.04 AS app

# install runtime dependencies
RUN apt-get update \ 
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    openssl \
    libncurses5-dev \
    libncursesw5-dev \
    libsrtp2-dev \
    ffmpeg \
    clang-format \ 
    curl \
    wget \
    build-essential

RUN cd /tmp/ \
    && wget https://downloads.sourceforge.net/opencore-amr/fdk-aac-2.0.0.tar.gz \
    && tar -xf fdk-aac-2.0.0.tar.gz && cd fdk-aac-2.0.0 \
    && ./configure --prefix=/usr --disable-static \
    && make && make install \
    && cd / \
    && rm -rf /tmp/*

RUN apt remove build-essential -y \
    wget \
    && apt autoremove -y

WORKDIR /app

COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

ENTRYPOINT [ "./docker-entrypoint.sh" ]

RUN groupadd -r membrane && useradd --no-log-init -r -g membrane membrane

RUN chown membrane:membrane /app

USER membrane:membrane

COPY --from=build /app/_build/prod/rel/membrane_live ./

ENV HOME=/app

EXPOSE 4000

HEALTHCHECK CMD curl --fail http://localhost:4000 || exit 1  

CMD ["bin/membrane_live", "start"]