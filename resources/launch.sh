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
java -Dinteractive -Dfile.encoding=UTF-8 -jar PhantomBot.jar 
