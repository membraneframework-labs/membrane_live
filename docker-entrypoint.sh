#!/bin/sh
# Docker entrypoint script.

bin/hls_proxy_api eval "MembraneLive.Release.migrate"

exec "$@"
