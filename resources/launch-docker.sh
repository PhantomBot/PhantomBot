#!/bin/bash
#
# Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

# https://unix.stackexchange.com/questions/146756/forward-sigterm-to-child-in-bash/444676#444676
prep_term()
{
    unset term_child_pid
    unset term_kill_needed
    trap 'handle_term' TERM INT
}

handle_term()
{
    if [ "${term_child_pid}" ]; then
        kill -TERM "${term_child_pid}" 2>/dev/null
    else
        term_kill_needed="yes"
    fi
}

wait_term()
{
    term_child_pid=$!
    if [ "${term_kill_needed}" ]; then
        kill -TERM "${term_child_pid}" 2>/dev/null
    fi
    wait ${term_child_pid} 2>/dev/null
    trap - TERM INT
    wait ${term_child_pid} 2>/dev/null
}

prep_term

unset DISPLAY

tmp=""

JAVA=$(which java)

if mount | grep '/tmp' | grep -q noexec; then
    mkdir -p $(dirname $(readlink -f $0))/tmp
    tmp="-Djava.io.tmpdir=$(dirname $(readlink -f $0))/tmp"
fi

${JAVA} --add-exports java.base/sun.security.x509=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED ${tmp} -Duser.language=en -Djava.security.policy=config/security -Xms1m -Dfile.encoding=UTF-8 -jar PhantomBot.jar "$@" &

wait_term
