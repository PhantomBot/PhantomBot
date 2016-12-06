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

if type -p java 1>/dev/null 2>/dev/null; then
    _java=java
elif [[ -n "$JAVA_HOME" ]] && [[ -x "$JAVA_HOME/bin/java" ]];  then
    _java="$JAVA_HOME/bin/java"
else
    echo "You don't have Java installed! Download the Java 8 JDK for MacOS from: http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html"
fi

if [[ "$_java" ]]; then
    version=$(java -version 2>&1)
    version=${version#*.}
    version=${version%%.*}
    if [[ $version -ge 8 ]]; then
        java -Dfile.encoding=UTF-8 -jar PhantomBot.jar
    else
        echo "Your Java is out of date! Please download the Java 8 JDK for MacOS from: http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html"
    fi
fi
