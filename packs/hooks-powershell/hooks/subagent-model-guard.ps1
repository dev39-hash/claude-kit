# PreToolUse hook, matcher: Agent (pack hooks-powershell; for machines without Node).
# PowerShell twin of the core subagent-model-guard.js, driven by kit.config.json:
#   models.worker   - every sub agent type by default
#   models.reviewer - a type whose name contains "review" (unless models.forceAll)
#   models.allowFork - "fork" is denied unless true (it inherits the leader's context and model)
# The call must pass `model` explicitly; the model family (sonnet / opus / haiku / ...) must
# match the configured one. Fails CLOSED: unreadable input denies the call.
# Output: PreToolUse JSON deny, exit 0. Pure ASCII file.

. (Join-Path $PSScriptRoot 'lib.ps1')

function Deny([string]$reason) {
    Emit-Decision 'subagent-model-guard' 'deny' @($reason)
    exit 0
}
function Family($m) {
    $s = ([string]$m).ToLower()
    $hit = [regex]::Match($s, 'sonnet|opus|haiku|fable|mythos')
    if ($hit.Success) { return $hit.Value }
    return $s
}

$hookInput = Read-HookInput
if ($null -eq $hookInput) { Deny 'the hook input could not be parsed as JSON.' }
$ti = Get-Prop $hookInput @('tool_input') $null
if ($null -eq $ti) { Deny 'the hook input has no tool_input.' }

try {
    $root = Get-ProjectRoot $hookInput
    $cfg = Get-KitConfig $root
} catch {
    Deny ('internal error: ' + $_.Exception.Message)
}

$worker = [string](Get-Prop $cfg @('models', 'worker') 'sonnet')
$reviewer = [string](Get-Prop $cfg @('models', 'reviewer') 'opus')
$forceAll = [bool](Get-Prop $cfg @('models', 'forceAll') $false)
$allowFork = [bool](Get-Prop $cfg @('models', 'allowFork') $false)

$type = ([string](Get-Prop $ti @('subagent_type') '')).ToLower()
$model = Get-Prop $ti @('model') $null

if ($type -eq 'fork' -and -not $allowFork) {
    Deny 'subagent_type "fork" inherits the leader''s context and model; use a named agent type and pass model explicitly (models.allowFork is false).'
}
$isReviewer = (-not $forceAll) -and ($type -match 'review')
$want = if ($isReviewer) { $reviewer } else { $worker }
$roleKey = if ($isReviewer) { 'reviewer' } else { 'worker' }
if ($null -eq $model -or ([string]$model).Trim() -eq '') {
    Deny ('pass "model" explicitly on every Agent call (rule 00-roles-and-models): ' + $roleKey + 's run on "' + $want + '".')
}
if ((Family $model) -ne (Family $want)) {
    $shown = if ($type) { $type } else { 'unnamed' }
    Deny ('model "' + $model + '" was requested for "' + $shown + '"; this role runs on "' + $want + '" (kit.config.json models.' + $roleKey + ').')
}
exit 0
