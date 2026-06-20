#!/bin/sh
set -e

printf '\033c'

for var in SESSION_SECRET TWITCH_CLIENT_ID TWITCH_CLIENT_SECRET TWITCH_REDIRECT_URI; do
    eval val=\$$var
    if [ -z "$val" ]; then
        echo "[entrypoint] Missing required environment variable: $var" >&2
        exit 1
    fi
done

exec "$@"
