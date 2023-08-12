#!/bin/bash
#
# Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

# This script is designed for use on Ubuntu 18.04 LTS with Ubuntu Docker builds

# ----Required ENV vars
# FOLDER: name of java-runtime folder to store output
# PLATFORM: name of Docker/QEMU platform to run
# JDK: Path to JAVA_HOME inside Docker container
# IMAGE: Docker image to use, should have desired JDK already installed

# QEMU must already be setup and registered with Docker for the same platform identifier that is passed in as PLATFORM

rm -rfv ../resources/$FOLDER
mkdir -p ../resources
docker run --rm --platform ${PLATFORM} --privileged --mount type=bind,source="$(pwd)"/../resources,target=/opt/phantombot ${IMAGE} ${JDK}/bin/jlink --no-header-files --no-man-pages --compress=2 --strip-debug --add-modules java.base,java.compiler,java.desktop,java.management,java.sql,java.naming,jdk.crypto.cryptoki,jdk.crypto.ec,jdk.jdwp.agent,jdk.management.agent,jdk.management,jdk.management.jfr,java.instrument,jdk.unsupported,jdk.zipfs --output /opt/phantombot/${FOLDER}
