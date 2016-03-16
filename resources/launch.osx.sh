#!/usr/bin/env bash
#
# PhantomBot Launcher - OSX
#
# Please run the following to launch the bot, the chmod is required only once.
# % chmod +x launch.osx.sh
# % ./launch.osx.sh
#

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

cd "$DIR"

java -Dinteractive -Dfile.encoding=UTF-8 -jar PhantomBot.jar
