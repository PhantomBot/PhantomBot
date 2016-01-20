@echo off
setlocal enableextensions enabledelayedexpansion
set first=1
for /f "delims=" %%a in ("%comspec%") do set "compath=%%~DPa"
PATH %PATH%;%compath%;%JAVA_HOME%\bin\
WHERE java >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo You must have Java installed, please install it from http://java.com
    pause
    exit
)
FOR /f tokens^=2-5^ delims^=.-_^" %%j in ('java -version 2^>^&1') do (
    if !first!==1 set "jver=%%j%%k%%l%%m"
    set first=0
)
IF %jver% LSS 17000 (
    echo You must have Java 7 or later installed, please update it from http://java.com
    pause
    exit
)
java -Dinteractive -Dfile.encoding=UTF-8 -jar PhantomBot.jar
endlocal