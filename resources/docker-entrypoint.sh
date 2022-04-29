#!/bin/bash
set -e

# allow the container to be started with `--user`
if [ "$(id -u)" = '0' -a ! -v ALLOW_ROOT ]; then
	find /opt/PhantomBot \! -type l \! -user phantombot -exec chown phantombot:phantombot '{}' +
	find /opt/PhantomBot_data \! -type l \! -user phantombot -exec chown phantombot:phantombot '{}' +
	exec gosu phantombot "$0" "$@"
fi

exec "$@"
