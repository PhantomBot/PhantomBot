#!/bin/bash
#
# Copyright (C) 2016-2019 phantombot.tv
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

tmp=""

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
elif [[ "$MACHTYPE" != "x86_64"* ]]; then
    cd $(dirname $(readlink -f $0))
    osdist=$(awk '/^ID(_LIKE)?=/' /etc/os-release | sed 's/"//g' | sort --field-separator== --key=1,1 --dictionary-order --reverse | cut -d = -f 2 | awk 'FNR == 1')
    osdist2=$(awk '/^ID(_LIKE)?=/' /etc/os-release | sed 's/"//g' | sort --field-separator== --key=1,1 --dictionary-order --reverse | cut -d = -f 2 | awk 'FNR == 2')
    osver=$(awk '/^VERSION_ID=/' /etc/os-release | sed 's/"//g' | cut -d = -f 2)
    JAVA=$(which java)

    if (( $? > 0 )); then
        jvermaj=0
    else
        jvermaj=$(java --version | awk 'FNR == 1 { print $2 }' | cut -d . -f 1)
    fi

    if (( jvermaj < 11 )); then
        echo "PhantomBot requires Java 11 or later to run."
        echo

        if  [[ "$osdist" == *"debian"* ]]; then
            echo "Please install the package openjdk-11-jre-headless"
            echo

            if (( osver < 10 )); then
                echo "WARNING: You are running a Debian derivative lower than version 10 (buster)"
                echo "Java 11 may not be available on this version"
                echo "It is recommended to upgrade to at least Debian 10 (buster)"
                echo "NOTE: Upgrading the major version of the OS usually means a clean install (wipe)"
                echo

                if (( osver == 9 )); then
                    echo "Alternatively, you can add the stretch-backports repository to apt and then you should be able to install openjdk-11-jre-headless"
                    echo "You can find instructions at https://github.com/superjamie/lazyweb/wiki/Raspberry-Pi-Debian-Backports#installation"
                    echo
                fi
            fi

            echo "The commands to do this are:"
            echo "   sudo apt-get install openjdk-11-jre-headless"
            echo "   sudo update-alternatives --config java"
            echo
            echo "When you issue the update-alternatives command, select the option for java-11-openjdk"
        elif  [[ "$osdist" == *"fedora"* || "$osdist" == *"rhel"* ]]; then
            echo "Please install the package java-11-openjdk-headless"
            echo

            if [[ "$osdist" == *"rhel"* || "$osdist2" == *"rhel"* ]] && (( osver < 7 )); then
                echo "WARNING: You are running a RHEL derivative lower than version 7"
                echo "Java 11 may not be available on this version"
                echo "It is recommended to upgrade to at least RHEL 7"
                echo "NOTE: Upgrading the major version of the OS usually means a clean install (wipe)"
                echo
            elif (( osver < 29 )); then
                echo "WARNING: You are running a Fedora derivative lower than version 29"
                echo "Java 11 may not be available on this version"
                echo "It is recommended to upgrade to at least Fedora 29"
                echo "NOTE: Upgrading the major version of the OS usually means a clean install (wipe)"
                echo
            fi

            echo "The commands to do this are:"
            echo "   sudo yum install java-11-openjdk-headless"
            echo "   sudo alternatives --config java"
            echo
            echo "When you issue the alternatives command, select the option for java-11-openjdk"
        fi

        exit 1
    fi
else
    cd $(dirname $(readlink -f $0))
    JAVA="./java-runtime-linux/bin/java"
fi

if mount | grep '/tmp' | grep -q noexec; then
    mkdir -p $(dirname $(readlink -f $0))/tmp
    tmp="-Djava.io.tmpdir=$(dirname $(readlink -f $0))/tmp"
fi

if [[ ! -x "${JAVA}" ]]; then
    echo "Java does not have the executable permission"
    echo "Please run the following command to fix this:"
    echo "   sudo chmod u+x ${JAVA}"

    exit 1
fi

${JAVA} --add-opens java.base/java.lang=ALL-UNNAMED ${tmp} -Djava.security.policy=config/security -Dinteractive -Xms1m -Dfile.encoding=UTF-8 -jar PhantomBot.jar ${1}
