
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
# PhantomBot Launcher - Windows Powershell
#
# Usage available by using Get-Help -Name .\launch.ps1 -Detailed
#

<#
.SYNOPSIS

Launches PhantomBot

.DESCRIPTION

Searches for a Java executable which matches the currently required Java version and then launches PhantomBot

.PARAMETER Help
Shortcut run the Get-Help cmdlet on this script and then exit

.PARAMETER Daemon
Enables daemon mode (STDIN disabled)

.PARAMETER Java
Overrides the first Java executable attempted. This should be a full path to java.exe

.PARAMETER JavaArgs
Command line arguments to pass to the jar file
#>

# Params
param(
    [switch]$Help = $false,
    [switch]$Daemon = $false,
    [string]$Java,
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$JavaArgs
)

##### Script Settings #######

# Required Java major version
$javarequired = 17

#############################

# Determines the directory of the running script
function Get-ScriptPath()
{
    # If using PowerShell ISE
    if ($psISE)
    {
        $ScriptPath = Split-Path -Parent -Path $psISE.CurrentFile.FullPath
    }
    # If using PowerShell 3.0 or greater
    elseif ($PSVersionTable.PSVersion.Major -gt 3)
    {
        $ScriptPath = $PSScriptRoot
    }
    # If using PowerShell 2.0 or lower
    else
    {
        $ScriptPath = split-path -parent $MyInvocation.MyCommand.Path
    }

    # If still not found
    # I found this can happen if running an exe created using PS2EXE module
    if (-not $ScriptPath) {
        $ScriptPath = [System.AppDomain]::CurrentDomain.BaseDirectory.TrimEnd('\')
    }

    # Return result
    return $ScriptPath
}

if ($Help) {
    $ScriptPath = Get-ScriptPath
    & Get-Help -Name $ScriptPath\launch.ps1 -Detailed
    Exit 0
}

# Switch to script directory
pushd Get-ScriptPath

# Internal vars
$interactive = "-Dinteractive"
$JAVA = ""
$success = $false

# Disable interactive switch if daemon mode
if ($Daemon) {
    $interactive = ""
}

# Try command line Java
if (-not $success -And $PSBoundParameters.ContainsKey('Java')) {
    $JAVA = $Java
    $jver = (& $JAVA --version 2>$null)
    $res = $LASTEXITCODE
    $jvermaj = (($jver[0] -split "\s+")[1] -split "\.")[0]
    if ($res -eq 0 -And $jvermaj -eq $javarequired) {
        $success = $true
    }
}

# Try java-runtime
if (-not $success) {
    $JAVA = ".\java-runtime\bin\java.exe"
    $jver = (& $JAVA --version 2>$null)
    $res = $LASTEXITCODE
    $jvermaj = (($jver[0] -split "\s+")[1] -split "\.")[0]
    if ($res -eq 0 -And $jvermaj -eq $javarequired) {
        $success = $true
    }
}

# Try system Java
if (-not $success) {
    $JAVA = (& Get-Command java 2>$null).Path
    if ($JAVA.Length -gt 0) {
        $jver = (& $JAVA --version 2>$null)
        $res = $LASTEXITCODE
        $jvermaj = (($jver[0] -split "\s+")[1] -split "\.")[0]
        if ($res -eq 0 -And $jvermaj -eq $javarequired) {
            $success = $true
        }
    }
}

# Print instructions if no Java satisfied requirements
if (-not $success) {
    Write-Output "PhantomBot requires Java ${javarequired} to run"
    Write-Output
    Write-Output "Eclipse Temurin by Adoptium is the officially supported JVM of PhantomBot"
    Write-Output "Information about Adoptium is available at: https://adoptium.net"
    Write-Output

    Write-Output "It is recommended to download the Windows package for PhantomBot"
    Write-Output "from our GitHub repo and use the included Java runtime"
    Write-Output "https://github.com/PhantomBot/PhantomBot/releases/latest"

    Exit 1
}

$null >> java.opt.custom

& $JAVA `@java.opt $interactive `@java.opt.custom -jar PhantomBot.jar @JavaArgs
popd
