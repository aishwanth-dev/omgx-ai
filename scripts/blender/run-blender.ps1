# scripts/blender/run-blender.ps1: headless Blender; installs, temp files and config on drive A:
# Usage: powershell -NoProfile -File scripts/blender/run-blender.ps1 [-Script <path relative to site>] [-ScriptArgs <args>]
param([string]$Script = "art/hero-core/build_hero_core.py", [string[]]$ScriptArgs = @())
$ErrorActionPreference = "Stop"
$tools = "A:\OMGX-AI\tools"; $bl = Join-Path $tools "blender-5.2.4-windows-x64"
$env:TEMP = Join-Path $tools "blender-temp"; $env:TMP = $env:TEMP
$env:BLENDER_USER_RESOURCES = Join-Path $bl "portable"; $env:PYTHONDONTWRITEBYTECODE = "1"
if (-not (Test-Path $env:TEMP)) { New-Item -ItemType Directory -Path $env:TEMP | Out-Null }
$site = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
& (Join-Path $bl "blender.exe") --background --factory-startup --python-exit-code 1 `
  --python (Join-Path $site $Script) -- --site $site @ScriptArgs
if ($LASTEXITCODE -ne 0) { throw "Blender build failed ($LASTEXITCODE)" }
