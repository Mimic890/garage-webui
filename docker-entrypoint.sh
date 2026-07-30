#!/bin/sh
set -e

# State (admin account, cluster list) lives here. Must be writable by the app
# user. Docker named volumes are often created root-owned and overlay the
# image's pre-chowned /app/data, so we fix ownership when started as root.
DATA_DIR="${GARAGE_UI_DATA_DIR:-/app/data}"

mkdir -p "$DATA_DIR"

if [ "$(id -u)" = "0" ]; then
	chown -R garageui:garageui "$DATA_DIR"
	exec su-exec garageui:garageui "$@"
fi

exec "$@"
