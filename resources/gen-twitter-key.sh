#!/bin/bash
#
# PhantomBot Twitter OAuth Key Generator
#
# Please run the following to generate Twitter OAuth keys, the chmod is required only once.
#     chmod +x gen-twitter-key.sh
#     ./gen-twitter-key.sh
#

cd $(dirname $(readlink -f $0))
java -jar GenerateTwitterTokens.jar
