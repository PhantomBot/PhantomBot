@echo off
REM  
REM Copyright (C) 2016-2018 phantombot.tv
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

setlocal enableextensions enabledelayedexpansion
SET JDK="C:\Program Files\Java\jdk-12.0.1\bin"
%JDK%\jlink --no-header-files --no-man-pages --compress=2 --strip-debug --add-modules java.base,java.desktop,java.management,java.sql,jdk.httpserver,jdk.jdwp.agent --output ..\resources\java-runtime
endlocal
pause