#!/bin/bash
#
# PhantomBot Launcher - Linux
#
# Please run the following to launch the bot, the chmod is required only once.
# % chmod +x launch.sh
# % ./launch.sh
#

cd $(dirname $(readlink -f $0))

unset DISPLAY

if type -p java; then
    _java=java
elif [[ -n "$JAVA_HOME" ]] && [[ -x "$JAVA_HOME/bin/java" ]];  then
    _java="$JAVA_HOME/bin/java"
else
    echo "You don't have Java installed! Download it from https://www.java.com/en/download/"
fi

if [[ "$_java" ]]; then
    version=$("$_java" -version 2>&1 | awk -F '"' '/version/ {print $2}')
    if [[ "$version" > "1.8" ]]; then
        java -Dinteractive -Dfile.encoding=UTF-8 -jar PhantomBot.jar
    else
        echo Your Java is out of date! Please download Java 8 at https://www.java.com/en/download/
    fi
fi
