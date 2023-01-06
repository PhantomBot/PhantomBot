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

#
# PhantomBot Service Restart - Docker
#
#
# To enable this script:
# % Stop the bot
# % Add the following line to botlogin.txt: restartcmd=/opt/PhantomBot/restartbot-docker.sh
# % Replace the path as appropriate, the full path must be used
# % Start the bot
#
# Also, ensure your Docker container is configured with a restart policy of "always" or "unless-stopped"
#
# WARNING: This script, when setup as above, will run with full root privileges.
# It is a MAJOR security risk to allow any variables to be used in this script.
# HARD CODE THE PROPER COMMAND FOR THIS BOT INSTALLATION AND DO NOT USE VARIABLES OR LOGIC AT ALL!
#

kill $(pidof java)
