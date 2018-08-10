@ECHO OFF
echo/|set /p=%CD%! | findstr source! >NUL 2>&1
if %ERRORLEVEL%==1 (
  echo error: must be ran in javascript-source directory
  exit /b %ERRORLEVEL%
)

where uglifyjs >NUL 2>&1
if %ERRORLEVEL%==1 (
  echo error: uglifyjs is not in path
  exit /b %ERRORLEVEL%
)

if "%~1"=="" (
  echo "usage: uglify path\to\file.js, ...
  exit /b 1
)


:filesLoop
IF "%~1"=="" GOTO end
set "destfile=..\resources\scripts\%1"
echo Running uglifyjs %1 -c -m -o %destfile%
call uglifyjs %1 -c -m -o %destfile%
SHIFT
GOTO filesLoop

:end
set destfile=
