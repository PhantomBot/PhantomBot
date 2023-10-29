@echo off

REM
REM Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
REM PhantomBot Launcher - Windows
REM
REM The powershell launcher launch.ps1 is recommended over this one
REM This script will try to launch the powershell version first
REM

IF EXIST %~dp0launch.ps1 GOTO :LAUNCHPWSH
GOTO :LAUNCH

:LAUNCHPWSH
WHERE pwsh >nul 2>nul
IF %ERRORLEVEL% NEQ 0 GOTO :LAUNCHOLDPWSH
pwsh -ExecutionPolicy Bypass -File %~dp0launch.ps1 %*
GOTO :END

:LAUNCHOLDPWSH
WHERE powershell >nul 2>nul
IF %ERRORLEVEL% NEQ 0 GOTO :LAUNCH
powershell -ExecutionPolicy Bypass -File %~dp0launch.ps1 %*
GOTO :END

:LAUNCH
setlocal enableextensions enabledelayedexpansion
pushd %~dp0
type nul >>java.opt.custom
".\java-runtime\bin\java" @java.opt -Dinteractive @java.opt.custom -jar "PhantomBot.jar" %*
popd
endlocal

:END
timeout /t 5
