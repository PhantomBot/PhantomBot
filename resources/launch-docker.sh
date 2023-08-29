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

# Required Java major version
javarequired=17

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
success=0
hwname="$( uname -m )"
trylinux=0
tryarm64=0
tryarm32=0

if [[ "$hwname" =~ "arm64" || "$hwname" =~ "aarch64" ]]; then
    tryarm64=1
elif [[ "$hwname" =~ "arm" ]]; then
    tryarm32=1
fi
if [[ "$hwname" =~ "x86_64" || "$MACHTYPE" =~ "x86_64" ]]; then
    trylinux=1
fi

if (( success == 0 )); then
    JAVA="/opt/java/openjdk/bin/java"
    jver=$($JAVA --version 2>/dev/null)
    res=$?
    jvermaj=$(echo "$jver" | awk 'FNR == 1 { print $2 }' | cut -d . -f 1)
    if (( res == 0 && jvermaj == javarequired )); then
        success=1
    fi
fi

if (( success == 0 && trylinux == 1 )); then
    JAVA="./java-runtime-linux/bin/java"
    chm=$(chmod u+x $JAVA 2>/dev/null)
    jver=$($JAVA --version 2>/dev/null)
    res=$?
    jvermaj=$(echo "$jver" | awk 'FNR == 1 { print $2 }' | cut -d . -f 1)
    if (( res == 0 && jvermaj == javarequired )); then
        success=1
    fi
fi

if (( success == 0 && tryarm64 == 1 )); then
    JAVA="./java-runtime-arm64/bin/java"
    chm=$(chmod u+x $JAVA 2>/dev/null)
    jver=$($JAVA --version 2>/dev/null)
    res=$?
    jvermaj=$(echo "$jver" | awk 'FNR == 1 { print $2 }' | cut -d . -f 1)
    if (( res == 0 && jvermaj == javarequired )); then
        success=1
    fi
fi

if (( success == 0 && tryarm32 == 1 )); then
    JAVA="./java-runtime-arm32/bin/java"
    chm=$(chmod u+x $JAVA 2>/dev/null)
    jver=$($JAVA --version 2>/dev/null)
    res=$?
    jvermaj=$(echo "$jver" | awk 'FNR == 1 { print $2 }' | cut -d . -f 1)
    if (( res == 0 && jvermaj == javarequired )); then
        success=1
    fi
fi

if (( success == 0 )); then
    JAVA=$(which java)
    res1=$?
    jver=$($JAVA --version 2>/dev/null)
    res2=$?
    jvermaj=$(echo "$jver" | awk 'FNR == 1 { print $2 }' | cut -d . -f 1)
    if (( res1 == 0 && res2 == 0 && jvermaj == javarequired )); then
        success=1
    fi
fi

if (( success == 0 )); then
    echo "PhantomBot requires Java ${javarequired} to run"
    exit 1
fi

if mount | grep '/tmp' | grep -q noexec; then
    mkdir -p $(dirname $(readlink -f $0))/tmp
    tmp="-Djava.io.tmpdir=$(dirname $(readlink -f $0))/tmp"
fi

${JAVA} --add-exports java.base/sun.security.x509=ALL-UNNAMED ${tmp} -Duser.language=en -Djava.security.policy=config/security -Xms256m -XX:+UseG1GC -XX:+UseStringDeduplication -Dfile.encoding=UTF-8 -jar PhantomBot.jar "$@" &

wait_term
