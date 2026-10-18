# Tests for the hooks-powershell pack:
#   powershell -NoProfile -ExecutionPolicy Bypass -File test-hooks.ps1 [filter]
# Table-driven: each case runs a hook as a child process with a JSON input on stdin and expects
# allow / ask / deny (PreToolUse JSON on stdout, or nothing for allow). A throwaway project with
# its own kit.config.json is created under the temp folder. Exit 1 on any failure.
# Pure ASCII file.
param([string]$Filter = '')

$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$exe = (Get-Process -Id $PID).Path

$T = Join-Path ([IO.Path]::GetTempPath()) ('kit-ps-hooks-' + [IO.Path]::GetRandomFileName())
$P = Join-Path $T 'proj'
New-Item -ItemType Directory -Force -Path (Join-Path $P '.claude') | Out-Null
$config = @{
    project   = @{ name = 't' }
    models    = @{ worker = 'sonnet'; reviewer = 'opus'; forceAll = $false; allowFork = $false }
    git       = @{ identity = @{ name = ''; email = '' }; deniedEmails = @('denied@example.com'); aiAttribution = 'deny'; forbiddenPhrases = @('WIP junk'); push = 'ask'; forcePush = 'ask-with-lease' }
    paths     = @{ readOnly = @('reference_source/'); localOnly = @('.wt/', 'product_release/'); protectedDelete = @('.git/', '.claude', '.claude/memory/'); memoryMirror = '.claude/memory' }
    processes = @{ neverKill = @('machine_ui', 'machine_runtime'); neverLaunch = @('machine_ui', 'machine_runtime') }
    encoding  = @{ codePage = 'cp932'; asciiExtensions = @('.cpp', '.h', '.pro', '.pri', '.ui', '.ps1') }
}
[IO.File]::WriteAllText((Join-Path $P '.claude\kit.config.json'), (ConvertTo-Json $config -Depth 6), (New-Object System.Text.UTF8Encoding $false))
$env:CLAUDE_PROJECT_DIR = $P

# Runs one hook as a child process and returns its stdout. Windows PowerShell 5.1 turns every
# stderr line of a native command into a NativeCommandError record once the stream is
# redirected, and under $ErrorActionPreference = 'Stop' the first such line (the fail-open note
# of guard-shell.ps1, the summary sync-memory.ps1 prints) would terminate this script. The
# preference is lowered to Continue for the call only; stderr is dropped and stdout compared.
# The hooks themselves are not affected: Claude Code starts them directly and reads stderr as
# plain text; only a PowerShell parent that redirects the stream sees the records.
function Invoke-Hook([string]$hook, [string]$stdin, [string[]]$extra = @()) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $out = $stdin | & $exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $here $hook) @extra 2>$null
    } finally {
        $ErrorActionPreference = $prev
    }
    return ($out | Out-String).Trim()
}
function Run-Hook([string]$hook, [string]$json) {
    $text = Invoke-Hook $hook $json
    if (-not $text) { return 'allow' }
    try { return (ConvertFrom-Json $text).hookSpecificOutput.permissionDecision } catch { return 'bad:' + $text }
}
function ShellCase([string]$cmd, [string]$expect, [string]$tool = 'Bash') {
    return @{ hook = 'guard-shell.ps1'; json = (ConvertTo-Json @{ tool_name = $tool; tool_input = @{ command = $cmd }; cwd = $P } -Compress); expect = $expect; label = $cmd }
}
function AgentCase($ti, [string]$expect) {
    $json = if ($null -eq $ti) { 'null' } else { ConvertTo-Json @{ tool_name = 'Agent'; tool_input = $ti; cwd = $P } -Compress }
    return @{ hook = 'subagent-model-guard.ps1'; json = $json; expect = $expect; label = (ConvertTo-Json $ti -Compress) }
}

$cases = @(
    # git push / remote
    (ShellCase 'git push origin main' 'ask'),
    (ShellCase 'git push --force origin main' 'deny'),
    (ShellCase 'git push -f' 'deny'),
    (ShellCase 'git push origin +main' 'deny'),
    (ShellCase 'git push --force-with-lease origin task/1' 'ask'),
    (ShellCase 'git remote add origin https://example.com/x.git' 'ask'),
    (ShellCase 'git config --global user.name x' 'deny'),
    (ShellCase 'git config --global --list' 'allow'),
    (ShellCase 'git status' 'allow'),
    (ShellCase 'git log --oneline -5' 'allow'),
    # destructive
    (ShellCase 'git reset --hard HEAD~1' 'ask'),
    (ShellCase 'git clean -fd' 'ask'),
    (ShellCase 'git clean -fdx' 'deny'),
    (ShellCase 'git clean -n' 'allow'),
    (ShellCase 'git checkout -- src/a.cpp' 'ask'),
    (ShellCase 'git checkout task/1' 'allow'),
    (ShellCase 'git rebase main' 'ask'),
    (ShellCase 'git commit --amend --no-edit' 'ask'),
    (ShellCase 'git stash drop' 'ask'),
    # staging and commits
    (ShellCase 'git add -A' 'deny'),
    (ShellCase 'git add .' 'deny'),
    (ShellCase 'git add src/a.cpp src/a.h' 'allow'),
    (ShellCase 'git commit -am "fix"' 'deny'),
    (ShellCase 'git commit -m "feat: add parser"' 'allow'),
    (ShellCase 'git commit --no-verify -m "x"' 'deny'),
    (ShellCase 'git commit --author="a <a@b>" -m x' 'deny'),
    (ShellCase 'git -c user.email=x@y commit -m x' 'deny'),
    (ShellCase 'GIT_AUTHOR_NAME=x git commit -m x' 'deny'),
    (ShellCase 'git commit -m "feat: x" -m "Co-Authored-By: Someone"' 'deny'),
    (ShellCase 'git commit -m "docs: mention Claude Code in README"' 'deny'),
    (ShellCase 'git commit -m "WIP junk"' 'deny'),
    (ShellCase 'git commit -m "x" --author denied@example.com' 'deny'),
    (ShellCase 'echo denied@example.com' 'allow'),
    # processes
    (ShellCase 'taskkill /IM machine_runtime.exe /F' 'deny'),
    (ShellCase 'Get-Process machine_ui | Stop-Process' 'deny' 'PowerShell'),
    (ShellCase 'Get-Process machine_runtime,machine_ui -ErrorAction SilentlyContinue' 'allow' 'PowerShell'),
    (ShellCase 'taskkill /IM other_tests.exe /F' 'ask'),
    (ShellCase 'taskkill /PID 1234 /F' 'allow'),
    (ShellCase 'Stop-Process -Id 1234' 'allow' 'PowerShell'),
    (ShellCase 'Start-Process machine_ui.exe' 'deny' 'PowerShell'),
    (ShellCase './build/bin/machine_runtime.exe --help' 'deny'),
    (ShellCase './build/bin/other_tool.exe --help' 'allow'),
    # PowerShell writes on a code-page machine
    (ShellCase 'Set-Content src/a.cpp "x"' 'deny' 'PowerShell'),
    (ShellCase '"x" | Out-File -FilePath src/a.h' 'deny' 'PowerShell'),
    (ShellCase 'echo x > src/a.pro' 'deny' 'PowerShell'),
    (ShellCase 'echo x > build/log.txt' 'allow' 'PowerShell'),
    (ShellCase 'Get-Content src/a.cpp' 'allow' 'PowerShell'),
    (ShellCase 'echo x > src/a.cpp' 'allow'),
    # deletes
    (ShellCase 'rm -rf .git' 'deny'),
    (ShellCase 'Remove-Item -Recurse .claude\memory' 'deny' 'PowerShell'),
    (ShellCase 'rm -rf reference_source/old' 'deny'),
    (ShellCase 'rm -rf .wt/slot1' 'ask'),
    (ShellCase 'rm -rf build/old' 'allow'),
    (ShellCase 'rm src/tmp.txt' 'allow'),
    # model guard
    (AgentCase @{ subagent_type = 'implementer'; model = 'sonnet'; prompt = 'x' } 'allow'),
    (AgentCase @{ subagent_type = 'implementer'; model = 'claude-sonnet-5-5'; prompt = 'x' } 'allow'),
    (AgentCase @{ subagent_type = 'implementer'; model = 'opus'; prompt = 'x' } 'deny'),
    (AgentCase @{ subagent_type = 'reviewer'; model = 'opus'; prompt = 'x' } 'allow'),
    (AgentCase @{ subagent_type = 'reviewer'; model = 'sonnet'; prompt = 'x' } 'deny'),
    (AgentCase @{ subagent_type = 'controller-reviewer'; model = 'opus'; prompt = 'x' } 'allow'),
    (AgentCase @{ subagent_type = 'Explore'; model = 'sonnet'; prompt = 'x' } 'allow'),
    (AgentCase @{ subagent_type = 'general-purpose'; model = 'haiku'; prompt = 'x' } 'deny'),
    (AgentCase @{ subagent_type = 'implementer'; prompt = 'x' } 'deny'),
    (AgentCase @{ subagent_type = 'fork'; model = 'sonnet'; prompt = 'x' } 'deny'),
    (AgentCase $null 'deny')
)

$failures = 0
$ran = 0
foreach ($c in $cases) {
    if ($Filter -and ($c.label -notmatch [regex]::Escape($Filter))) { continue }
    $ran++
    $got = Run-Hook $c.hook $c.json
    $ok = ($got -eq $c.expect)
    if (-not $ok) { $failures++ }
    $tag = if ($ok) { 'ok   ' } else { 'FAIL ' }
    $extra = if ($ok) { '' } else { 'got ' + $got + '  ' }
    Write-Output ($tag + ($c.hook -replace '\.ps1$', '').PadRight(21) + $c.expect.PadRight(6) + $extra + $c.label)
}

# unit checks: counted like the table cases
$units = 0
function Unit([string]$name, [bool]$ok) {
    $script:units++
    if ($ok) { Write-Output ('ok    unit  ' + $name) } else { $script:failures++; Write-Output ('FAIL  unit  ' + $name) }
}

# unreadable input: guard-shell allows, model guard denies
$got = Invoke-Hook 'guard-shell.ps1' 'not json'
Unit 'guard-shell fails open on unreadable input' ($got -eq '')
$got = Invoke-Hook 'subagent-model-guard.ps1' 'not json'
Unit 'model guard fails closed on unreadable input' ($got -match '"permissionDecision":"deny"')

# sync-memory: mirror, remove stale, restore never removes
$G = Join-Path $T 'global'
$M = Join-Path $P '.claude\memory'
New-Item -ItemType Directory -Force -Path $G, $M | Out-Null
[IO.File]::WriteAllText((Join-Path $G 'MEMORY.md'), "# index`n")
[IO.File]::WriteAllText((Join-Path $G 'a.md'), "a`n")
[IO.File]::WriteAllText((Join-Path $M 'stale.md'), "old`n")
[IO.File]::WriteAllText((Join-Path $M 'README.md'), "keep`n")
$env:CLAUDE_MEMORY_DIR = $G
Invoke-Hook 'sync-memory.ps1' '' | Out-Null
$okMirror = (Test-Path (Join-Path $M 'a.md')) -and (Test-Path (Join-Path $M 'MEMORY.md')) -and -not (Test-Path (Join-Path $M 'stale.md')) -and (Test-Path (Join-Path $M 'README.md'))
Unit 'sync-memory mirrors and removes stale, keeps README.md' $okMirror
[IO.File]::WriteAllText((Join-Path $M 'b.md'), "b`n")
Remove-Item (Join-Path $G 'a.md')
Invoke-Hook 'sync-memory.ps1' '' @('-Restore') | Out-Null
$okRestore = (Test-Path (Join-Path $G 'b.md')) -and (Test-Path (Join-Path $G 'MEMORY.md'))
Unit 'sync-memory restore copies and never removes' $okRestore
Remove-Item (Join-Path $G 'MEMORY.md')
Invoke-Hook 'sync-memory.ps1' '' | Out-Null
Unit 'sync-memory refuses a source without MEMORY.md' (Test-Path (Join-Path $M 'b.md'))
Remove-Item Env:\CLAUDE_MEMORY_DIR

# every hook source is ASCII
foreach ($f in Get-ChildItem -LiteralPath $here -File -Filter '*.ps1') {
    $bytes = [IO.File]::ReadAllBytes($f.FullName)
    $ascii = $true
    foreach ($b in $bytes) { if ($b -gt 0x7F) { $ascii = $false; break } }
    Unit ('ASCII source ' + $f.Name) $ascii
}

Write-Output ''
Write-Output ('failures: ' + $failures + ' / ' + ($ran + $units))
try { Remove-Item -LiteralPath $T -Recurse -Force -ErrorAction SilentlyContinue } catch { }
if ($failures -gt 0) { exit 1 }
exit 0
