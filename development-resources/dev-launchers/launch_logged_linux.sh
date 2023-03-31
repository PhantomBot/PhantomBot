#!/bin/bash

cd $(dirname $(readlink -f $0))

script -c ./launch.sh "./PhantomBot_$(date -u +"%FT%H%MZ").log.txt"
