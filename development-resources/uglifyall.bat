@echo off
for /f "tokens=1* delims=\" %%A in (
  'forfiles /s /m *.js /c "cmd /c echo @relpath"'
) do for %%F in (^"%%B) do ( 
echo Running uglifyjs  %%~F -c -m -o ..\resources\scripts\%%~F
call uglifyjs  %%~F -c -m -o ..\resources\scripts\%%~F
)
