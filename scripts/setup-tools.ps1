param([ValidateSet('codex', 'claude', 'agy', 'none')][string]$Agent = 'codex')
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$env:UV_TOOL_DIR = Join-Path $repoRoot '.local/uv-tools'
$env:UV_TOOL_BIN_DIR = Join-Path $repoRoot '.local/bin'
$env:UV_CACHE_DIR = Join-Path $repoRoot '.local/uv-cache'
$toolName = if ($IsWindows -or $env:OS -eq 'Windows_NT') { 'specify.exe' } else { 'specify' }
$specify = Join-Path $env:UV_TOOL_BIN_DIR $toolName
if (-not (Test-Path -LiteralPath $specify)) {
  uv tool install --from 'git+https://github.com/github/spec-kit.git@7370e592f3cd9c06e5b698983957e227c75b30e2' specify-cli
  if ($LASTEXITCODE -ne 0) { throw 'Specify installation failed.' }
}
Push-Location $repoRoot
try {
  # Switch only Spec Kit-managed integrations, not generic coding skills or user rules.
  $status = (& $specify integration status --json | ConvertFrom-Json)
  if ($LASTEXITCODE -ne 0 -or $status.modified_managed_files -gt 0 -or $status.missing_managed_files -gt 0) {
    throw 'Managed Spec Kit files differ; preserve and review them before switching integrations.'
  }
  $initialState = Get-Content -LiteralPath '.specify/integration.json' -Raw | ConvertFrom-Json
  if ($initialState.installed_integrations -contains 'none') {
    & $specify integration use none
  } else {
    # Spec Kit removes the previous integration on switch, including `none`.
    & $specify integration switch none --script ps
  }
  if ($LASTEXITCODE -ne 0) { throw 'Cannot select shared baseline; inspect integration status.' }
  $state = Get-Content -LiteralPath '.specify/integration.json' -Raw | ConvertFrom-Json
  foreach ($key in $state.installed_integrations) {
    if ($key -ne 'none' -and $key -ne $Agent) {
      & $specify integration uninstall $key
      if ($LASTEXITCODE -ne 0) { throw "Integration $key has changes; preserved for review." }
    }
  }
  if ($Agent -ne 'none') {
    & $specify integration switch $Agent --script ps
    if ($LASTEXITCODE -ne 0) { throw 'Integration switch failed; no force overwrite attempted.' }
  }
  python scripts/sync_claude_skills.py
  if ($LASTEXITCODE -ne 0) { throw 'Skill synchronization failed.' }
  & $specify integration status
  if ($LASTEXITCODE -ne 0) { throw 'Spec Kit integration needs review.' }
} finally { Pop-Location }
