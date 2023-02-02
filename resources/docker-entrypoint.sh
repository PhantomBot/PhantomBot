#!/bin/bash
set -e

if [[ ${UID+x} && ${GID+x} ]]; then
	if [[ "$(id -u phantombot)" != $UID ]]; then
		echo "Setting user to UID/GID: $UID / $GID"
		groupmod -g $GID phantombot
		usermod -u $UID -g $GID phantombot
	fi
fi

# allow the container to be started with `--user`
if [ "$(id -u)" = '0' -a ! -v ALLOW_ROOT ]; then
	mkdir -p /opt/PhantomBot_data/logs /opt/PhantomBot_data/dbbackup /opt/PhantomBot_data/addons /opt/PhantomBot_data/config /opt/PhantomBot_data/gameslist
	touch /opt/PhantomBot_data/gameslist/gamesList.txt
	chown -R phantombot:phantombot /opt/PhantomBot_data;
	find /opt/PhantomBot \! -type l \! -user phantombot -exec chown phantombot:phantombot '{}' +
	find /opt/PhantomBot_data \! -type l \! -user phantombot -exec chown phantombot:phantombot '{}' +
	exec setpriv --reuid phantombot --regid phantombot --init-groups "$0" "$@"
fi

exec "$@"
