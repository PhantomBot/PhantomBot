#!/bin/bash

cd $(dirname $(readlink -f $0))

java -Dinteractive -Dfile.encoding=UTF-8 -jar PhantomBot.jar
