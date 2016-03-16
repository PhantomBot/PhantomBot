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

java -Dfile.encoding=UTF-8 -jar PhantomBot.jar
