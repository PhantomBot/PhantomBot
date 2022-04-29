# To run this script, use the following command
# powershell -ExecutionPolicy ByPass -File .\launch_logged_win.ps1


$origEnvDir = [Environment]::CurrentDirectory
Push-Location $PSScriptRoot
[Environment]::CurrentDirectory = $PSScriptRoot

$path = ".\PhantomBot_Transcript_$((get-date).ToString("MM-dd-yyyy-hhmmss")).txt"
.\launch.bat --nowt @args 2>&1 | Tee-Object -FilePath $path

Pop-Location
[Environment]::CurrentDirectory = $origEnvDir
