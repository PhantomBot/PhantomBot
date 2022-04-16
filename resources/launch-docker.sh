#!/bin/bash
#
# Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

#
# PhantomBot Launcher - Docker
#

unset DISPLAY

tmp=""

JAVA=$(which java)

if mount | grep '/tmp' | grep -q noexec; then
    mkdir -p $(dirname $(readlink -f $0))/tmp
    tmp="-Djava.io.tmpdir=$(dirname $(readlink -f $0))/tmp"
fi

if [[ ! -O "PhantomBot.jar" ]]; then
    echo "The directory is not chown by the service user"
    echo "Please run the following command to fix this:"
    echo "   sudo docker exec --user root -it phantombot chown -R -H -L phantombot:phantombot /opt/PhantomBot"
    echo "                                    ^"
    echo "                                    Replace with the name of the container"

    exit 1
fi

if [[ ! -O "/opt/PhantomBot_data" ]]; then
    echo "The data directory is not chown by the service user"
    echo "Please run the following command to fix this:"
    echo "   sudo docker exec --user root -it phantombot chown -R -H -L phantombot:phantombot /opt/PhantomBot_data"
    echo "                                    ^"
    echo "                                    Replace with the name of the container"

    exit 1
fi

mkdir -p /opt/PhantomBot_data/config/ || true

if [[ ! -O "/opt/PhantomBot_data/config" ]]; then
    echo "The data directory is not chown by the service user"
    echo "Please run the following command to fix this:"
    echo "   sudo docker exec --user root -it phantombot chown -R -H -L phantombot:phantombot /opt/PhantomBot_data"
    echo "                                    ^"
    echo "                                    Replace with the name of the container"

    exit 1
fi

touch /opt/PhantomBot_data/config/botlogin.txt || true

if [[ ! -O "/opt/PhantomBot_data/config/botlogin.txt" ]]; then
    echo "The data directory is not chown by the service user"
    echo "Please run the following command to fix this:"
    echo "   sudo docker exec --user root -it phantombot chown -R -H -L phantombot:phantombot /opt/PhantomBot_data"
    echo "                                    ^"
    echo "                                    Replace with the name of the container"

    exit 1
fi

${JAVA} --add-exports java.base/sun.security.x509=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED ${tmp} -Duser.language=en -Djava.security.policy=config/security -Xms1m -Dfile.encoding=UTF-8 -jar PhantomBot.jar
