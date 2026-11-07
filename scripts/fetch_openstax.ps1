param([switch]$AuditOnly)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $repoRoot
$ledger = Get-Content -LiteralPath 'knowledge/pipeline/sources.json' -Raw | ConvertFrom-Json
if (-not $AuditOnly) {
    foreach ($source in $ledger.sources) {
        if ($source.id -notin @('osbooks-physics','osbooks-chemistry-bundle')) { continue }
        if ($source.url.TrimEnd('/') -ne "https://github.com/openstax/$($source.id)" -or $source.commit -notmatch '^[a-f0-9]{40}$') { throw 'Unrecognized source identity' }
        $target = Join-Path $repoRoot ".local/sources/$($source.id)"
        if (-not (Test-Path -LiteralPath $target)) {
            git clone --filter=blob:none --no-checkout $source.url $target
            if ($LASTEXITCODE) { throw 'Clone failed' }
        } else {
            if (git -C $target status --porcelain) { throw "Preserve local source edits: $target" }
        }
        git -C $target fetch --depth=1 origin $source.commit
        if ($LASTEXITCODE) { throw 'Pinned fetch failed' }
        git -C $target sparse-checkout set --no-cone /LICENSE /README.md /collections/ /modules/
        if ($LASTEXITCODE) { throw 'Sparse checkout failed' }
        git -C $target checkout --detach $source.commit
        if ($LASTEXITCODE) { throw 'Checkout failed' }
    }
}
foreach ($source in $ledger.sources) {
    if ($source.kind -ne 'external') { continue }
    $sourceFolder = $source.id -creplace '^openstax-', ''
    $target = Join-Path $repoRoot ".local/sources/$sourceFolder"
    if (-not (Test-Path -LiteralPath $target -PathType Container)) {
        throw "Missing local source checkout: $target. AuditOnly needs the pinned checkouts to exist first."
    }
}
& "$repoRoot/.venv/Scripts/python.exe" -m lumilab_api.source_inventory
if ($LASTEXITCODE) { throw 'Source inventory failed' }
