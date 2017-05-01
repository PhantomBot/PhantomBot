@echo off
setlocal enableextensions enabledelayedexpansion
set first=1
for /f "delims=" %%a in ("%comspec%") do set "compath=%%~DPa"
PATH %PATH%;%compath%;%JAVA_HOME%\bin\
WHERE java >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo You must have Java installed, please install it from: https://java.com/download
    pause
    exit
)
java -Dinteractive -Dfile.encoding=UTF-8 -jar PhantomBot.jar
endlocal
pause
