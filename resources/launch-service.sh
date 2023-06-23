#!/usr/bin/env bash
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
# PhantomBot Launcher - Linux and macOS
#
# Please run the following to launch the bot, the chmod is required only once.
# % chmod +x launch-service.sh
# % ./launch-service.sh
#

unset DISPLAY

tmp=""
pwd=""

if [[ "$OSTYPE" == "darwin"* ]]; then
    SOURCE="${BASH_SOURCE[0]}"
    while [ -h "$SOURCE" ]; do
        DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
        SOURCE="$(readlink "$SOURCE")"
        [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
    done
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    cd "$DIR"
    pwd="$DIR"
    JAVA="./java-runtime-macos/bin/java"
elif [[ "$MACHTYPE" != "x86_64"* ]]; then
    cd $(dirname $(readlink -f $0))
    pwd=$(dirname $(readlink -f $0))
    osdist=$(awk '/^ID(_LIKE)?=/' /etc/os-release | sed 's/"//g' | sort --field-separator== --key=1,1 --dictionary-order --reverse | cut -d = -f 2 | awk 'FNR == 1')
    osdist2=$(awk '/^ID(_LIKE)?=/' /etc/os-release | sed 's/"//g' | sort --field-separator== --key=1,1 --dictionary-order --reverse | cut -d = -f 2 | awk 'FNR == 2')
    osver=$(awk '/^VERSION_ID=/' /etc/os-release | sed 's/"//g' | cut -d = -f 2)
    JAVA=$(which java)

    if (( $? > 0 )); then
        jvermaj=0
    else
        jvermaj=$(java --version | awk 'FNR == 1 { print $2 }' | cut -d . -f 1)
    fi

    if (( jvermaj < 17 )); then
        echo "PhantomBot requires Java 17 or later to run."
        echo

        if  [[ "$osdist" == *"debian"* ]]; then
            echo "Please install the package openjdk-17-jre-headless"
            echo

            if (( osver < 11 )); then
                echo "WARNING: You are running a Debian derivative lower than version 11 (bullseye)"
                echo "Java 17 may not be available on this version"
                echo "It is recommended to upgrade to at least Debian 11 (bullseye)"
                echo "NOTE: Upgrading the major version of the OS usually means a clean install (wipe)"
                echo
            fi

            echo "The commands to do this are:"
            echo "   sudo apt-get install openjdk-17-jre-headless"
            echo "   sudo update-alternatives --config java"
            echo
            echo "When you issue the update-alternatives command, select the option for java-17-openjdk"
        elif  [[ "$osdist" == *"fedora"* || "$osdist" == *"rhel"* ]]; then
            echo "Please install the package java-17-openjdk-headless"
            echo

            if [[ "$osdist" == *"rhel"* || "$osdist2" == *"rhel"* ]] && (( osver < 9 )); then
                echo "WARNING: You are running a RHEL derivative lower than version 9"
                echo "Java 17 may not be available on this version"
                echo "It is recommended to upgrade to at least RHEL 9"
                echo "NOTE: Upgrading the major version of the OS usually means a clean install (wipe)"
                echo
            elif (( osver < 37 )); then
                echo "WARNING: You are running a Fedora derivative lower than version 37"
                echo "Java 17 may not be available on this version"
                echo "It is recommended to upgrade to at least Fedora 37"
                echo "NOTE: Upgrading the major version of the OS usually means a clean install (wipe)"
                echo
            fi

            echo "The commands to do this are:"
            echo "   sudo dnf install java-17-openjdk-headless"
            echo "   sudo alternatives --config java"
            echo
            echo "When you issue the alternatives command, select the option for java-17-openjdk"
        fi

        exit 1
    fi
else
    cd $(dirname $(readlink -f $0))
    osdist=$(awk '/^ID(_LIKE)?=/' /etc/os-release | sed 's/"//g' | sort --field-separator== --key=1,1 --dictionary-order --reverse | cut -d = -f 2 | awk 'FNR == 1')
    osdist2=$(awk '/^ID(_LIKE)?=/' /etc/os-release | sed 's/"//g' | sort --field-separator== --key=1,1 --dictionary-order --reverse | cut -d = -f 2 | awk 'FNR == 2')
    osver=$(awk '/^VERSION_ID=/' /etc/os-release | sed 's/"//g' | cut -d = -f 2)
    pwd=$(dirname $(readlink -f $0))
    JAVA="./java-runtime-linux/bin/java"

    if  [[ "$osdist" == *"nixos"* ]]; then
        JAVA=$(which java)

        if (( $? > 0 )); then
            jvermaj=0
        else
            jvermaj=$(java --version | awk 'FNR == 1 { print $2 }' | cut -d . -f 1)
        fi

        if (( jvermaj < 17 )); then
            echo "PhantomBot requires Java 17 or later to run."
            echo "Please install it from your package manager and ensure the correct installation is returned by 'which java'"
            exit 1
        fi
    fi
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

if [[ ! -O "PhantomBot.jar" ]]; then
    echo "The directory is not chown by the service user"
    echo "Please run the following command to fix this:"
    echo "   sudo chown ${EUID} ${pwd}"

    exit 1
fi

${JAVA} --add-exports java.base/sun.security.x509=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED ${tmp} -Duser.language=en -Djava.security.policy=config/security -Xms256m -XX:+UseG1GC -XX:+UseStringDeduplication -Dfile.encoding=UTF-8 -jar PhantomBot.jar "$@"
