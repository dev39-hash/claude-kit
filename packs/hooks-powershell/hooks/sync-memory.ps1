# Stop hook (pack hooks-powershell; for machines without Node): mirror Claude's global memory
# dir for this project into paths.memoryMirror. PowerShell twin of the core sync-memory.js.
#   powershell -File sync-memory.ps1              global -> mirror  (default, runs at Stop)
#   powershell -File sync-memory.ps1 -Restore     mirror -> global  (fresh machine; never deletes)
#   powershell -File sync-memory.ps1 -DryRun      report what would change, write nothing
#   powershell -File sync-memory.ps1 -Status      print both paths and the file lists
# The mirror is kept identical to the source (top-level *.md; files absent in the source are
# removed from the mirror, README.md excepted); a restore only copies. Safety: the source must
# contain MEMORY.md, otherwise nothing is copied or deleted. Never fails the hook: errors go to
# stderr, exit code 0. Does not read stdin. Pure ASCII file.
param([switch]$Restore, [switch]$DryRun, [switch]$Status)

. (Join-Path $PSScriptRoot 'lib.ps1')

function Get-GlobalMemoryDir([string]$root) {
    if ($env:CLAUDE_MEMORY_DIR) { return $env:CLAUDE_MEMORY_DIR }
    $projects = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.claude\projects'
    $resolved = [IO.Path]::GetFullPath($root).TrimEnd('\', '/')
    if ($resolved -match '^[a-z]:') { $resolved = $resolved.Substring(0, 1).ToUpper() + $resolved.Substring(1) }
    # Claude names the per-project dir after the project path with every non-alphanumeric
    # character replaced by '-' (C:\Work\x -> C--Work-x); the match is case-insensitive.
    $exact = [regex]::Replace($resolved, '[^A-Za-z0-9]', '-')
    $hit = Get-ChildItem -LiteralPath $projects -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ieq $exact } | Select-Object -First 1
    if ($hit) { return (Join-Path $hit.FullName 'memory') }
    return (Join-Path (Join-Path $projects $exact) 'memory')
}

function List-Md([string]$dir) {
    return @(Get-ChildItem -LiteralPath $dir -File -Filter '*.md' -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })
}

function Same-Bytes([string]$a, [string]$b) {
    if (-not (Test-Path -LiteralPath $b)) { return $false }
    $x = [IO.File]::ReadAllBytes($a)
    $y = [IO.File]::ReadAllBytes($b)
    if ($x.Length -ne $y.Length) { return $false }
    for ($i = 0; $i -lt $x.Length; $i++) { if ($x[$i] -ne $y[$i]) { return $false } }
    return $true
}

try {
    $root = Get-ProjectRoot $null
    $cfg = Get-KitConfig $root
    $mirrorRel = ([string](Get-Prop $cfg @('paths', 'memoryMirror') '.claude/memory')) -replace '/', '\'
    $mirror = Join-Path $root $mirrorRel
    $global = Get-GlobalMemoryDir $root
    if ($Restore) { $src = $mirror; $dst = $global } else { $src = $global; $dst = $mirror }

    if ($Status) {
        Write-Output ('global: ' + $global)
        Write-Output ('  ' + ((List-Md $global) -join ', '))
        Write-Output ('mirror: ' + $mirror)
        Write-Output ('  ' + ((List-Md $mirror) -join ', '))
        exit 0
    }

    $files = List-Md $src
    if (-not ($files | Where-Object { $_ -ieq 'MEMORY.md' })) {
        [Console]::Error.WriteLine('[sync-memory.ps1] no MEMORY.md in ' + $src + '; nothing copied or removed')
        exit 0
    }
    if (-not $DryRun -and -not (Test-Path -LiteralPath $dst)) { New-Item -ItemType Directory -Force -Path $dst | Out-Null }
    $copied = @()
    $removed = @()
    foreach ($f in $files) {
        $a = Join-Path $src $f
        $b = Join-Path $dst $f
        if (-not (Same-Bytes $a $b)) {
            if (-not $DryRun) { [IO.File]::Copy($a, $b, $true) }
            $copied += $f
        }
    }
    if (-not $Restore) {
        foreach ($f in (List-Md $dst)) {
            if ($f -ieq 'README.md') { continue }
            if (-not ($files | Where-Object { $_ -eq $f })) {
                if (-not $DryRun) { Remove-Item -LiteralPath (Join-Path $dst $f) -Force }
                $removed += $f
            }
        }
    }
    if ($DryRun -or $copied.Count -gt 0 -or $removed.Count -gt 0) {
        $mode = if ($DryRun) { 'dry-run ' } else { '' }
        $dir = if ($Restore) { 'restore' } else { 'mirror' }
        [Console]::Error.WriteLine('[sync-memory.ps1] ' + $mode + $dir + ': copied ' + $copied.Count + ' (' + ($copied -join ', ') + '), removed ' + $removed.Count + ' (' + ($removed -join ', ') + ')')
    }
} catch {
    [Console]::Error.WriteLine('[sync-memory.ps1] failed: ' + $_.Exception.Message)
}
exit 0
