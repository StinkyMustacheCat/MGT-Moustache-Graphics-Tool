# SPDX-License-Identifier: GPL-3.0-or-later
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (!(Test-Path -LiteralPath $compiler)) { throw 'No se encuentra el compilador de .NET Framework de Windows.' }
$iconPath = Join-Path $project 'public\icon.ico'
$outputPath = Join-Path $project 'MGT.exe'
$sourcePath = Join-Path $PSScriptRoot 'MGT.cs'
& $compiler /nologo /target:winexe /platform:x64 /reference:System.Windows.Forms.dll /reference:System.Drawing.dll "/win32icon:$iconPath" "/out:$outputPath" $sourcePath
if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar MGT.exe.' }
