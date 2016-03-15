#!/bin/bash
#
# PhantomBot Launch Service Script - Linux
#
# Please run the following to launch the bot, the chmod is required only once.
# % chmod +x launch-service.sh
# % ./launch-service.sh
#


cd $(dirname $(readlink -f $0))

java -Dfile.encoding=UTF-8 -jar PhantomBot.jar
