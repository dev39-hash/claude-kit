# PreToolUse guard for the PowerShell/Bash tools (NichirinLaserMark, local only).
# Reads the hook JSON from stdin. Exit 2 blocks the call and shows stderr to Claude;
# exit 0 lets it through. Keep this file pure ASCII (PowerShell 5.1 reads a
# BOM-less script in the ANSI code page, CP932 on this machine).

try {
    [Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false
    $raw = [Console]::In.ReadToEnd().TrimStart([char]0xFEFF).Trim()   # tolerate a BOM
    $cmd = (ConvertFrom-Json $raw).tool_input.command
} catch {
    exit 0   # never block a call because the hook input could not be parsed
}
if (-not $cmd) { exit 0 }

# 1. The repo is local-only: never publish it.
if ($cmd -match '(?i)\bgit(\.exe)?["'']?\s+(push|remote\s+(add|set-url))\b') {
    [Console]::Error.WriteLine('Blocked by .claude/hooks/guard-shell.ps1: this repo is local-only - never git push and never add or change a remote.')
    exit 2
}

# 2. Never write source files through PowerShell text cmdlets or redirection:
#    on this CP932 machine they silently mangle UTF-8 comments.
$src = '\.(cpp|h|hpp|ui|pro|pri|qrc|qss|ts)\b'
$viaCmdlet   = $cmd -match "(?i)\b(Set-Content|Add-Content|Out-File)\b[^|;]*?$src"
$viaRedirect = $cmd -match "(?i)>>?\s*['""]?[^\s|;'""]+$src"
if ($viaCmdlet -or $viaRedirect) {
    [Console]::Error.WriteLine('Blocked by .claude/hooks/guard-shell.ps1: do not write source files (.cpp/.h/.ui/.pro/.pri/.qrc/.qss/.ts) with Set-Content/Add-Content/Out-File or > redirection - CP932 mangles UTF-8. Use the Edit/Write tools, or [IO.File]::WriteAllText with UTF8Encoding($false).')
    exit 2
}

exit 0
