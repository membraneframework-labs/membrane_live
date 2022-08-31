#!/bin/sh
# Docker entrypoint script.

bin/membrane_live eval "MembraneLive.Release.create_and_migrate"

exec "$@"
