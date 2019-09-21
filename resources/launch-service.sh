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
# % chmod +x launch-service.sh
# % ./launch-service.sh
#

unset DISPLAY

if [[ "$OSTYPE" == "darwin"* ]]; then
    SOURCE="${BASH_SOURCE[0]}"
    while [ -h "$SOURCE" ]; do
        DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
        SOURCE="$(readlink "$SOURCE")"
        [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
    done
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    cd "$DIR"
    JAVA="./java-runtime-macos/bin/java"
elif [[ "$MACHTYPE" == "arm"* ]];
    cd $(dirname $(readlink -f $0))
    JAVA=$(which java)
    
    if (( $? > 0 )); then
        jvermaj=0
    else
        jvermaj=$(java --version | awk 'FNR == 1 { print $2 }' | cut -d . -f 1)
    fi
    
    if (( jvermaj < 11 )); then
        echo "PhantomBot requires Java 11 or later to run."
        echo
        echo "Please install the package openjdk-11-jre-headless"
        echo
        echo "The commands to do this are:"
        echo "   sudo apt-get install openjdk-11-jre-headless"
        echo "   sudo update-alternatives --config java"
        echo
        echo "When you issue the update-alternatives command, select the option for java-11-openjdk"
        exit 1
    fi
else
    cd $(dirname $(readlink -f $0))
    JAVA="./java-runtime-linux/bin/java"
fi

${JAVA} -Xms1m -Dfile.encoding=UTF-8 -jar PhantomBot.jar ${1}