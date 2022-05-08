@echo off

REM  
REM Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
REM  
REM This program is free software: you can redistribute it and/or modify
REM it under the terms of the GNU General Public License as published by
REM the Free Software Foundation, either version 3 of the License, or
REM (at your option) any later version.
REM 
REM This program is distributed in the hope that it will be useful,
REM but WITHOUT ANY WARRANTY; without even the implied warranty of
REM MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
REM GNU General Public License for more details.
REM  
REM You should have received a copy of the GNU General Public License
REM along with this program.  If not, see <http://www.gnu.org/licenses/>.
REM

REM
REM PhantomBot Service Restart - Windows
REM
REM To enable this script:
REM % Stop the bot
REM % Add the following line to botlogin.txt: restartcmd=C:\path\to\restartbot.bat
REM % Replace the path as appropriate, the full path must be used
REM % Start the bot
REM
REM Check if the commands below are the correct commands to restart your PhantomBot service, and adjust accordingly
REM
REM NOTE: The bot must be running as a user who has permissions to restart the service

net stop PhantomBotService
timeout /t 2
net start PhantomBotService
