#requires -Version 7.0
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$workspace = Join-Path $root ('.local/rebuild-kit-tests/' + [Guid]::NewGuid().ToString('N'))
$source = Join-Path $workspace 'source A'
$target = Join-Path $workspace 'target B'
$tool = Join-Path $PSScriptRoot 'Transfer-Module.ps1'
$manifest = Join-Path $workspace 'modules.json'
$script:passed = 0
function Check([bool]$Condition, [string]$Label) {
  if (-not $Condition) { throw "FAIL: $Label" }
  $script:passed++
  Write-Output "PASS: $Label"
}
function Reject([scriptblock]$Action, [string]$Pattern, [string]$Label) {
  $failure = $null
  try { & $Action | Out-Null } catch { $failure = $_.Exception.Message }
  Check ($null -ne $failure -and $failure -match $Pattern) $Label
}
foreach ($repo in @($source, $target)) {
  $null = New-Item -ItemType Directory -Path $repo
  & git -C $repo init --quiet
  if ($LASTEXITCODE -ne 0) { throw 'Cannot initialize disposable fixture.' }
}
$null = New-Item -ItemType Directory -Path (Join-Path $source 'model')
'source-one' | Set-Content -LiteralPath (Join-Path $source 'model/one.ts') -Encoding utf8NoBOM
'source-two' | Set-Content -LiteralPath (Join-Path $source 'model/two.json') -Encoding utf8NoBOM
& git -C $source add -- model
& git -C $source -c user.name='LumiLab local test fixture' -c user.email='fixture@example.invalid' commit --quiet -m 'fixture inputs'
if ($LASTEXITCODE -ne 0) { throw 'Cannot commit disposable source fixture.' }
$revision = (& git -C $source rev-parse HEAD).Trim()
$null = New-Item -ItemType Directory -Path (Join-Path $target 'docs')
'.local/' | Set-Content -LiteralPath (Join-Path $target '.gitignore')
'Synthetic permission declaration for tool test only, not contest approval.' | Set-Content -LiteralPath (Join-Path $target 'docs/RULES.md')
$data = @{ schema_version='transfer-modules-1.0'; source_revision=$revision; modules=@(
  @{ id='example'; paths=@('model/one.ts','model/two.json'); requires=@('fixture'); integration_notes=@('fixture only') }
)}
$data | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifest
$argsBase = @{ SourceRepo=$source; TargetRepo=$target; Module='example'; ManifestPath=$manifest }
$permission = @{ ReuseAllowed=$true; RulesReference='docs/RULES.md#fixture' }

$preview = & $tool @argsBase -Action Preview | ConvertFrom-Json
Check ($preview.files.Count -eq 2 -and -not (Test-Path -LiteralPath (Join-Path $target '.local'))) 'Preview writes nothing, handles repository paths with spaces'
Reject { & $tool @argsBase -Action Stage } 'ReuseAllowed' 'Stage requires explicit reuse declaration'
Reject { & $tool @argsBase -Action Stage -ReuseAllowed } 'RulesReference' 'Stage requires rule reference'
Reject { & $tool @argsBase -Action Preview -SourceRevision 'main' } 'immutable' 'Moving branch is rejected'
Reject { & $tool @argsBase -Action CopyNew @permission } 'Stage this batch' 'Copy requires prior staging'
& $tool @argsBase -Action Stage @permission
Check (-not (Test-Path -LiteralPath (Join-Path $target 'model'))) 'Stage does not import production files'
Reject { & $tool @argsBase -Action Stage @permission } 'already exists' 'Staging is not overwritten'
$receipt = Join-Path $target '.local/transfer/example/receipt.json'
$original = Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json
Check ($original.source_commit -eq $revision -and $original.files.Count -eq 2) 'Receipt pins commit and every file checksum'
& $tool @argsBase -Action CopyNew @permission
Check ((Get-Content -LiteralPath (Join-Path $target 'model/one.ts') -Raw).Trim() -eq 'source-one') 'CopyNew copies selected file contents'
Reject { & $tool @argsBase -Action CopyNew @permission } 'already exists' 'CopyNew cannot overwrite an existing B file'
Check ((& git -C $source rev-parse HEAD).Trim() -eq $revision) 'A commit remains unchanged'

& $tool @argsBase -Action Stage -BatchId 'tamper' @permission
'changed' | Set-Content -LiteralPath (Join-Path $target '.local/transfer/tamper/files/model/one.ts')
# Use a fresh target path set for tamper checking, while no destination is present.
$target2 = Join-Path $workspace 'target C'
$null = New-Item -ItemType Directory -Path $target2
& git -C $target2 init --quiet
$null = New-Item -ItemType Directory -Path (Join-Path $target2 'docs')
'.local/' | Set-Content -LiteralPath (Join-Path $target2 '.gitignore')
'Fixture only' | Set-Content -LiteralPath (Join-Path $target2 'docs/RULES.md')
$other = @{ SourceRepo=$source; TargetRepo=$target2; Module='example'; ManifestPath=$manifest }
& $tool @other -Action Stage -BatchId 'tamper' @permission
'changed' | Set-Content -LiteralPath (Join-Path $target2 '.local/transfer/tamper/files/model/one.ts')
Reject { & $tool @other -Action CopyNew -BatchId 'tamper' @permission } 'changed' 'Tampered staging is rejected before import'
Check (-not (Test-Path -LiteralPath (Join-Path $target2 'model'))) 'Tamper rejection creates no production files'
& $tool @other -Action Stage -BatchId 'collision' @permission
$null = New-Item -ItemType Directory -Path (Join-Path $target2 'model')
'keep-my-work' | Set-Content -LiteralPath (Join-Path $target2 'model/two.json')
Reject { & $tool @other -Action CopyNew -BatchId 'collision' @permission } 'already exists' 'All destination collisions checked before any copy'
Check (-not (Test-Path -LiteralPath (Join-Path $target2 'model/one.ts'))) 'Collision cannot leave an earlier file imported'
Check ((Get-Content -LiteralPath (Join-Path $target2 'model/two.json') -Raw).Trim() -eq 'keep-my-work') 'Existing B work preserved'
Reject { & $tool -SourceRepo $source -TargetRepo $source -Module example -ManifestPath $manifest } 'separate' 'A cannot be its own target'
foreach ($bad in @('../escape.ts','.env','node_modules/file.ts','AGENTS.md')) {
  $data.modules[0].paths = @($bad)
  $data | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifest
  Reject { & $tool @argsBase } 'path' "Protected/traversal path blocked: $bad"
}
$data.modules[0].paths = @('model/one.ts','model/two.json')
$data | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifest
if ($IsWindows) {
  $junction = Join-Path $target2 '.local/transfer/junction'
  $null = New-Item -ItemType Junction -Path $junction -Target (Join-Path $source 'model')
  Reject { & $tool @other -Action Stage -BatchId 'junction' @permission } 'Reparse' 'Junction cannot redirect staging into source A'
  Check (-not (Test-Path -LiteralPath (Join-Path $source 'model/source.zip'))) 'Junction rejection writes no archive into A'
}
$linked = Join-Path $workspace 'linked-worktree'
& git -C $source worktree add --quiet --detach $linked $revision
if ($LASTEXITCODE -ne 0) { throw 'Cannot make linked fixture.' }
Reject { & $tool -SourceRepo $source -TargetRepo $linked -Module example -ManifestPath $manifest } 'share Git metadata' 'A worktree cannot masquerade as independent repo B'
Write-Output "Completed $script:passed safety checks. Disposable fixtures kept under $workspace; no real B, remote push or recursive cleanup."
