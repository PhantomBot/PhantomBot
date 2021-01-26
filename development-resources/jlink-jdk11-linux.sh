#!/bin/bash
#  
# Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
#  
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#  
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

# This script is designed for use on Ubuntu 18.04 LTS

cd $(dirname $(readlink -f $0))

JDK="/usr/lib/jvm/jdk-11.0.4/bin"
${JDK}/jlink --no-header-files --no-man-pages --compress=2 --strip-debug --add-modules java.base,java.desktop,java.management,java.sql,java.naming,jdk.crypto.cryptoki,jdk.httpserver,jdk.jdwp.agent --output ../resources/java-runtime-linux
