#requires -Version 7.0
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$SourceRepo,
  [Parameter(Mandatory)][string]$TargetRepo,
  [Parameter(Mandatory)][ValidatePattern('^[a-z0-9-]{1,64}$')][string]$Module,
  [ValidateSet('Preview', 'Stage', 'CopyNew')][string]$Action = 'Preview',
  [string]$SourceRevision = '',
  [string]$ManifestPath = (Join-Path $PSScriptRoot '../../docs/rebuild-kit/modules.json'),
  [ValidatePattern('^[a-z0-9-]{1,64}$')][string]$BatchId = '',
  [switch]$ReuseAllowed,
  [string]$RulesReference = ''
)
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$pathComparison = if ($IsWindows) { [StringComparison]::OrdinalIgnoreCase } else { [StringComparison]::Ordinal }

function Git-Text([string]$Root, [string[]]$GitArguments) {
  $lines = & git -C $Root @GitArguments 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Git failed: $($GitArguments[0]). No target import performed." }
  return (($lines | ForEach-Object { "$_" }) -join "`n").Trim()
}
function Full-Path([string]$Value) { return [IO.Path]::GetFullPath($Value).TrimEnd([IO.Path]::DirectorySeparatorChar) }
function Equal-Path([string]$Left, [string]$Right) { return [string]::Equals($Left, $Right, $pathComparison) }
function Inside([string]$Path, [string]$Root) { return $Path.StartsWith($Root + [IO.Path]::DirectorySeparatorChar, $pathComparison) }
function No-Reparse([string]$Path) {
  $cursor = $Path
  while ($cursor) {
    if (Test-Path -LiteralPath $cursor) {
      if ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "Reparse point is not allowed: $cursor"
      }
    }
    $parent = [IO.Path]::GetDirectoryName($cursor)
    if ($parent -eq $cursor) { break }
    $cursor = $parent
  }
}
function Repo-Root([string]$Path) {
  $full = Full-Path ((Resolve-Path -LiteralPath $Path).Path)
  No-Reparse $full
  $top = Full-Path (Git-Text $full @('rev-parse', '--show-toplevel'))
  if (-not (Equal-Path $full $top)) { throw 'Pass the Git repository root, not a subdirectory.' }
  return $full
}
function Safe-Relative([string]$Path) {
  if (-not $Path -or $Path -match '[\\:< >"|?*\x00-\x1f]' -or $Path.StartsWith('/')) {
    throw "Unsafe module path: $Path"
  }
  $parts = $Path.Split('/')
  if ($parts | Where-Object { $_ -in @('', '.', '..', '.git', '.local', '.venv', 'node_modules', 'local-models', 'dist', '.codex', '.claude', '.openai', '.agents') }) {
    throw "Private or escaping module path: $Path"
  }
  if (($parts | Where-Object { $_ -like '.env*' -and $_ -ne '.env.example' }) -or
      $Path -in @('AGENTS.md', 'CLAUDE.md', 'GEMINI.md')) { throw "Protected module path: $Path" }
}
function Target-Path([string]$Relative) {
  Safe-Relative $Relative
  $full = Full-Path (Join-Path $target $Relative)
  if (-not (Inside $full $target)) { throw 'Destination escapes target repository.' }
  No-Reparse $full
  return $full
}
function Save-Receipt($Value, [string]$Path) {
  $Value | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $Path -Encoding utf8NoBOM
}

$source = Repo-Root $SourceRepo
$target = Repo-Root $TargetRepo
if ((Equal-Path $source $target) -or (Inside $source $target) -or (Inside $target $source)) {
  throw 'A and B must be separate, non-nested repositories.'
}
$sourceCommon = Git-Text $source @('rev-parse', '--path-format=absolute', '--git-common-dir')
$targetCommon = Git-Text $target @('rev-parse', '--path-format=absolute', '--git-common-dir')
if (Equal-Path (Full-Path $sourceCommon) (Full-Path $targetCommon)) {
  throw 'A and B cannot share Git metadata. A worktree is not an empty independent B repository.'
}
$manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
if ($manifest.schema_version -ne 'transfer-modules-1.0') { throw 'Unsupported transfer manifest.' }
$pack = @($manifest.modules | Where-Object id -eq $Module)
if ($pack.Count -ne 1) { throw 'Module must match exactly one manifest entry.' }
$pack = $pack[0]
$revision = if ($SourceRevision) { $SourceRevision } else { $manifest.source_revision }
if ($revision -notmatch '^[0-9a-f]{7,40}$') { throw 'Use an immutable hexadecimal source commit, not a moving branch.' }
$commit = Git-Text $source @('rev-parse', '--verify', "$($revision)^{commit}")
$paths = @($pack.paths)
if ($paths.Count -lt 1 -or $paths.Count -gt 50 -or @($paths | Select-Object -Unique).Count -ne $paths.Count) {
  throw 'Module paths must be unique and bounded.'
}
foreach ($relative in $paths) {
  Safe-Relative $relative
  $entry = Git-Text $source @('ls-tree', $commit, '--', $relative)
  if ($entry -notmatch '^100(644|755)\s+blob\s+[0-9a-f]+\t') { throw "Only regular tracked files may be transferred: $relative" }
  $null = Target-Path $relative
}
if (-not $BatchId) { $BatchId = $Module }
# .local is private; only this tool-owned path may use it, never source modules.
$stageRoot = Full-Path (Join-Path $target ".local/transfer/$BatchId")
if (-not (Inside $stageRoot $target)) { throw 'Invalid staging destination.' }
No-Reparse $stageRoot
$filesRoot = Join-Path $stageRoot 'files'
$receiptPath = Join-Path $stageRoot 'receipt.json'
if ($Action -eq 'Preview') {
  [ordered]@{
    action = 'Preview'; module = $Module; source_commit = $commit; target_root = $target
    prerequisites = @($pack.requires); integration_notes = @($pack.integration_notes)
    files = @($paths | ForEach-Object { @{ path = $_; target_exists = (Test-Path -LiteralPath (Target-Path $_)) } })
    next_step = 'Confirm contest permission, implement prerequisites, then Stage. No files written.'
  } | ConvertTo-Json -Depth 10
  return
}
if (-not $ReuseAllowed -or [string]::IsNullOrWhiteSpace($RulesReference)) {
  throw 'Stage/CopyNew requires -ReuseAllowed and a real -RulesReference. The tool does not determine contest permission.'
}
if (-not (Test-Path -LiteralPath (Join-Path $target 'docs/RULES.md') -PathType Leaf)) {
  throw 'Create and review docs/RULES.md in B before importing source code.'
}
$null = & git -C $target check-ignore --quiet -- '.local/transfer/check' 2>&1
if ($LASTEXITCODE -ne 0) { throw 'B must ignore .local/ before staging.' }

if ($Action -eq 'Stage') {
  if (Test-Path -LiteralPath $stageRoot) { throw 'Batch already exists. Inspect it or select a new BatchId; no overwrite.' }
  $null = New-Item -ItemType Directory -Path $filesRoot
  $zip = Join-Path $stageRoot 'source.zip'
  $null = Git-Text $source (@('archive', '--format=zip', "--output=$zip", $commit, '--') + $paths)
  $archive = [IO.Compression.ZipFile]::OpenRead($zip)
  try {
    $entries = @($archive.Entries | Where-Object { -not $_.FullName.EndsWith('/') })
    if ($entries.Count -ne $paths.Count) { throw 'Archive omitted or added files; check export-ignore attributes.' }
    foreach ($entry in $entries) {
      Safe-Relative $entry.FullName
      if ($entry.FullName -cnotin $paths) { throw 'Archive paths differ from the selected module.' }
    }
  } finally { $archive.Dispose() }
  Expand-Archive -LiteralPath $zip -DestinationPath $filesRoot
  $files = @(foreach ($relative in $paths) {
    $file = Join-Path $filesRoot $relative
    No-Reparse $file
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw 'Archive file missing.' }
    @{ path = $relative; sha256 = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() }
  })
  $receipt = [ordered]@{
    schema_version = 'transfer-receipt-1.0'; module = $Module; batch = $BatchId
    source_commit = $commit; target_root = $target; rules_reference = $RulesReference
    permission_basis = 'Operator explicitly declared allowed reuse; not automatically verified'
    staged_at = [DateTime]::UtcNow.ToString('o'); status = 'staged'; files = $files
    prerequisites = @($pack.requires); integration_notes = @($pack.integration_notes)
  }
  Save-Receipt $receipt $receiptPath
  Write-Output "Staged $($files.Count) files. Review: $filesRoot"
  Write-Output "Receipt: $receiptPath. Integration has not been performed."
  return
}

if (-not (Test-Path -LiteralPath $receiptPath -PathType Leaf)) { throw 'Stage this batch before CopyNew.' }
No-Reparse $receiptPath
$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json -AsHashtable
if ($receipt.schema_version -ne 'transfer-receipt-1.0' -or $receipt.source_commit -ne $commit -or
    $receipt.module -ne $Module -or $receipt.rules_reference -ne $RulesReference -or
    -not (Equal-Path $receipt.target_root $target)) { throw 'Receipt identity does not match request.' }
if ((@($receipt.files.path | Sort-Object) -join "`n") -cne (@($paths | Sort-Object) -join "`n")) {
  throw 'Receipt paths do not match module manifest.'
}
# Check ALL destinations and checksums before creating ANY production file in B.
foreach ($file in $receipt.files) {
  $destination = Target-Path $file.path
  if (Test-Path -LiteralPath $destination) { throw "Destination already exists; merge manually from staging: $($file.path)" }
  $staged = Join-Path $filesRoot $file.path
  No-Reparse $staged
  if ((Get-FileHash -LiteralPath $staged -Algorithm SHA256).Hash -ne $file.sha256) { throw "Staged content changed: $($file.path)" }
}
$copied = [Collections.Generic.List[string]]::new()
try {
  foreach ($file in $receipt.files) {
    $destination = Target-Path $file.path
    $null = New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($destination)) -Force
    # CreateNew also stops a collision created after preflight; never replace a file.
    $inputStream = [IO.File]::OpenRead((Join-Path $filesRoot $file.path))
    try {
      $outputStream = [IO.File]::Open($destination, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
      try { $inputStream.CopyTo($outputStream) } finally { $outputStream.Dispose() }
    } finally { $inputStream.Dispose() }
    $copied.Add($file.path)
  }
  $receipt.status = 'copied_new_files_integration_pending'
} catch {
  $receipt.status = 'copy_interrupted_inspect_manually'
  throw
} finally {
  $receipt['copied_paths'] = @($copied.ToArray())
  $receipt['copied_at'] = [DateTime]::UtcNow.ToString('o')
  Save-Receipt $receipt $receiptPath
}
Write-Output "Copied $($copied.Count) new files. No existing file was replaced."
Write-Output 'Now adapt imports/registry, record provenance in docs/MIGRATION-LEDGER.md, test in B, then review the Git diff.'
Write-Output 'No Git add/commit/push, install, API call or deployment was performed.'
