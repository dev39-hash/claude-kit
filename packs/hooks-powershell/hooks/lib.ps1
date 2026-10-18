# Shared preamble for the hooks-powershell pack; dot-sourced by every hook in this folder.
# Windows PowerShell 5.1 and pwsh 7. Keep this file pure ASCII: PowerShell 5.1 reads a
# BOM-less script in the ANSI code page of the machine.
#
#   Read-HookInput       stdin JSON (BOM tolerated) -> object, or $null when unreadable
#   Get-Prop             safe nested property read with a default
#   Get-ProjectRoot      CLAUDE_PROJECT_DIR, else <root> from this file's place
#                        (<root>/.claude/hooks/hooks-powershell/lib.ps1), else the input's cwd
#   Get-KitConfig        <root>/.claude/kit.config.json (CLAUDE_KIT_CONFIG overrides), or an
#                        empty object when missing; callers pass defaults to Get-Prop
#   Emit-Decision        PreToolUse JSON for deny / ask; nothing for allow (the normal flow)

function Read-HookInput {
    try {
        [Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false
        $raw = [Console]::In.ReadToEnd()
        if ($null -eq $raw) { return $null }
        $raw = $raw.TrimStart([char]0xFEFF).Trim()
        if ($raw -eq '') { return $null }
        return (ConvertFrom-Json $raw)
    } catch {
        return $null
    }
}

function Get-Prop($obj, [string[]]$path, $default) {
    $cur = $obj
    foreach ($p in $path) {
        if ($null -eq $cur) { return $default }
        if ($cur -is [System.Collections.IDictionary]) {
            if (-not $cur.Contains($p)) { return $default }
            $cur = $cur[$p]
            continue
        }
        $prop = $cur.PSObject.Properties[$p]
        if ($null -eq $prop) { return $default }
        $cur = $prop.Value
    }
    if ($null -eq $cur) { return $default }
    return $cur
}

function Get-ProjectRoot($hookInput) {
    if ($env:CLAUDE_PROJECT_DIR) { return [IO.Path]::GetFullPath($env:CLAUDE_PROJECT_DIR) }
    $guess = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
    if (Test-Path -LiteralPath (Join-Path $guess '.claude')) { return $guess }
    $cwd = Get-Prop $hookInput @('cwd') $null
    if ($cwd) { return [IO.Path]::GetFullPath([string]$cwd) }
    return (Get-Location).Path
}

function Get-KitConfig([string]$root) {
    $file = if ($env:CLAUDE_KIT_CONFIG) { $env:CLAUDE_KIT_CONFIG } else { Join-Path $root '.claude\kit.config.json' }
    try {
        $text = [IO.File]::ReadAllText($file, (New-Object System.Text.UTF8Encoding $false))
        $obj = ConvertFrom-Json ($text.TrimStart([char]0xFEFF))
        if ($null -eq $obj) { return (New-Object PSObject) }
        return $obj
    } catch {
        return (New-Object PSObject)
    }
}

function Emit-Decision([string]$tag, [string]$decision, [string[]]$reasons) {
    if ($decision -ne 'deny' -and $decision -ne 'ask') { return }
    $uniq = @($reasons | Where-Object { $_ } | Select-Object -Unique)
    if ($uniq.Count -eq 1) { $text = $uniq[0] } else { $text = ($uniq | ForEach-Object { '- ' + $_ }) -join "`n" }
    $obj = @{
        hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision       = $decision
            permissionDecisionReason = '[' + $tag + '] ' + $text
        }
    }
    [Console]::Out.Write((ConvertTo-Json $obj -Compress -Depth 4))
}
