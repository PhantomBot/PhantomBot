#!/bin/bash

cd $(dirname $(readlink -f $0))

java -Dfile.encoding=UTF-8 -jar PhantomBot.jar
