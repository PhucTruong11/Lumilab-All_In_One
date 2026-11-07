#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$EnvFile = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $repoRoot 'docker/compose.yml'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI is not installed or is not on PATH.'
}

$composeArgs = @('compose')
if ($EnvFile) {
    $candidate = if ([IO.Path]::IsPathRooted($EnvFile)) { $EnvFile } else { Join-Path $repoRoot $EnvFile }
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        throw "Environment file not found: $candidate"
    }
    $composeArgs += @('--env-file', (Resolve-Path -LiteralPath $candidate).Path)
}
$composeArgs += @('-f', $composeFile)

Push-Location $repoRoot
try {
    & docker info --format '{{.ServerVersion}}' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Docker daemon is not running.' }

    & docker @composeArgs config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose configuration is invalid.' }

    & docker @composeArgs up -d --build --wait web
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose did not start all services successfully.' }

    $webPorts = @(& docker @composeArgs port web 80)
    if ($LASTEXITCODE -ne 0 -or $webPorts.Count -eq 0) { throw 'Web port was not published.' }
    $webUrl = "http://$($webPorts[0].Trim())"

    $health = Invoke-WebRequest -Uri "$webUrl/healthz" -UseBasicParsing -TimeoutSec 10
    if ($health.StatusCode -ne 200) { throw 'Web health check failed.' }
    $catalog = Invoke-RestMethod -Uri "$webUrl/api/v1/labs" -TimeoutSec 10
    if (-not $catalog.items -or $catalog.items.Count -eq 0) { throw 'API catalog is empty or unavailable through web proxy.' }
    $runtime = Invoke-RestMethod -Uri "$webUrl/api/v1/runtime-labs" -TimeoutSec 10
    if (-not $runtime.items -or $runtime.items.Count -eq 0) { throw 'Runtime labs are unavailable through web proxy.' }

    Write-Host "LumiLab ready: $webUrl"
    Write-Host "API catalog: $($catalog.items.Count) entries; runtime labs: $($runtime.items.Count)"
    Write-Host 'Services: web, api, db (Chroma is optional and remains off).'
} finally {
    Pop-Location
}
