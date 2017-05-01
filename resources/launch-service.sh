#!/bin/bash
#
# PhantomBot Launcher - Linux and macOS
#
# Please run the following to launch the bot, the chmod is required only once.
# % chmod +x launch-service.sh
# % ./launch-service.sh
#

unset DISPLAY

if [[ $(uname) -eq "Darwin" ]]; then
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
fi

java -Dfile.encoding=UTF-8 -jar PhantomBot.jar
