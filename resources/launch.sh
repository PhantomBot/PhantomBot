#!/bin/bash
#
# Copyright (C) 2016-2018 phantombot.tv
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
# PhantomBot Launcher - Linux and macOS
#
# Please run the following to launch the bot, the chmod is required only once.
# % chmod +x launch.sh
# % ./launch.sh
#

unset DISPLAY

if [[ $(uname -m) == "arm"* ]] && [[ $(java -version 2>&1) == *"OpenJDK"* ]]; then
    echo "It appears you are using a Raspberry Pi with OpenJDK."
    echo "OpenJDK causes fatal errors and unexpected behavior on Raspberry Pi devices."
    echo "Please switch to Oracle JDK".
    echo
    echo "Commands for Raspbian:"
    echo "  apt-get install oracle-java8-jdk"
    echo "  update-alternatives --config java"
    echo
    echo "When you issue the update-alternatives command, select Oracle JDK"
    exit 1
elif [[ $(uname)=="Darwin" ]]; then
    SOURCE="${BASH_SOURCE[0]}"
    while [ -h "$SOURCE" ]; do
        DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
        SOURCE="$(readlink "$SOURCE")"
        [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
    done
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    cd "$DIR"
else
    cd $(dirname $(readlink -f $0))
fi

if type -p java 1>/dev/null 2>/dev/null; then
    _java=java
elif [[ -n "$JAVA_HOME" ]] && [[ -x "$JAVA_HOME/bin/java" ]];  then
    _java="$JAVA_HOME/bin/java"
else
    echo "You don't have Java installed! Download it from https://www.java.com/en/download/"
    exit 1
fi

java -Dinteractive -Xms1m -Dfile.encoding=UTF-8 -jar PhantomBot.jar ${1}
