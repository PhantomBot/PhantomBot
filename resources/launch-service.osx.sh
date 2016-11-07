#!/usr/bin/env bash
#
# PhantomBot Launch Service Script - OSX
#
# Please run the following to launch the bot, the chmod is required only once.
# % chmod +x launch-service.osx.sh
# % ./launch-service.osx.sh
#

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

cd "$DIR"

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
        java -Dfile.encoding=UTF-8 -jar PhantomBot.jar
    else
        echo Your Java is out of date! Please download Java 8 at https://www.java.com/en/download/
    fi
fi
