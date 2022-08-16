#!/bin/sh
# Docker entrypoint script.

bin/membrane_live eval "MembraneLive.Release.migrate"

exec "$@"
