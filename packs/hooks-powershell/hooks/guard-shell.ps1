# PreToolUse hook, matcher: Bash|PowerShell (pack hooks-powershell; for machines without Node).
# The minimal PowerShell twin of the core guard-shell.js, driven by the same kit.config.json:
#   deny - git push when git.push is "deny"; force push without --force-with-lease (and any
#          force push when git.forcePush is "deny"); +refspec; global or system git config writes;
#          an AI attribution line (git.aiAttribution "deny") or a git.forbiddenPhrases entry in a
#          commit command; --no-verify, --author, -c user.*, GIT_AUTHOR_*/GIT_COMMITTER_* on a
#          commit; a git.deniedEmails address in a git command; a repo-local identity that is
#          not git.identity; git add -A / . / -u / *, git commit -a; killing or launching a
#          process named in processes.neverKill / neverLaunch; a delete that names a
#          paths.protectedDelete or paths.readOnly location; git clean -x / -X without -n;
#          on a code-page machine (encoding.codePage set) a PowerShell write (Set-Content,
#          Add-Content, Out-File, Tee-Object, > redirection) into an ASCII source file.
#   ask  - every other push; remote add / set-url / remove; destructive git (reset --hard,
#          clean, checkout -- / ., restore, branch -D, rebase, amend, stash drop, tag -d);
#          kill by name; a delete that names a paths.localOnly location; a persistent
#          environment variable write (setx, [Environment]::SetEnvironmentVariable with a
#          User or Machine target, HKCU/HKLM Environment registry keys) unless the name is in
#          environment.protectedVars (deny) or environment.persistentWrites says otherwise.
# Regex on the command text, not a tokeniser: nested shells, variables and quoting are not
# followed (the Node guard does that). Output: PreToolUse JSON deny|ask, exit 0. Any internal
# error allows the command with a note on stderr (fail open). Pure ASCII file.

. (Join-Path $PSScriptRoot 'lib.ps1')

$hookInput = Read-HookInput
if ($null -eq $hookInput) {
    [Console]::Error.WriteLine('[guard-shell.ps1] unreadable hook input, allowing')
    exit 0
}
$cmd = [string](Get-Prop $hookInput @('tool_input', 'command') '')
if (-not $cmd) { exit 0 }

$script:Denies = @()
$script:Asks = @()
function Deny([string]$r) { $script:Denies += $r }
function Ask([string]$r) { $script:Asks += $r }
function Esc([string]$s) { return [regex]::Escape($s) }

try {
    $root = Get-ProjectRoot $hookInput
    $cfg = Get-KitConfig $root
    $isPs = ([string](Get-Prop $hookInput @('tool_name') '')) -eq 'PowerShell'
    $gitOpts = '(\s+(-[Cc]\s+\S+|--[\w-]+(=\S+)?|-[A-Za-z]))*'
    $gitHead = '(?i)(^|[\s;&|(])git(\.exe)?' + $gitOpts + '\s+'

    # ---- git push / remote / config -------------------------------------------------------
    $pushPolicy = [string](Get-Prop $cfg @('git', 'push') 'ask')
    $forcePolicy = [string](Get-Prop $cfg @('git', 'forcePush') 'ask-with-lease')
    if ($cmd -match ($gitHead + 'push(\s|$)')) {
        $withLease = $cmd -match '(?i)--force-with-lease'
        $force = ($cmd -match '(?i)\s--force(\s|$|=)') -or ($cmd -match '\s-[A-Za-z]*f[A-Za-z]*(\s|$)') -or ($cmd -match '\s\+\S+')
        if ($pushPolicy -eq 'deny') {
            Deny 'git push is disabled for this project (git.push = deny).'
        } elseif ($force -and -not $withLease) {
            Deny 'force push without --force-with-lease (git.forcePush = ' + $forcePolicy + '); use --force-with-lease or ask the human.'
        } elseif ($force -and $withLease -and $forcePolicy -eq 'deny') {
            Deny 'force push is disabled for this project (git.forcePush = deny).'
        } elseif ($force) {
            Ask 'force push with lease: confirm with the human first.'
        } elseif ($pushPolicy -ne 'allow') {
            Ask 'git push: only when the human asked for it in this conversation.'
        }
    }
    if ($cmd -match ($gitHead + 'remote\s+(add|set-url|remove|rm|rename)(\s|$)')) {
        if ($pushPolicy -eq 'deny') { Deny 'changing a remote is disabled for this project (git.push = deny).' }
        else { Ask 'git remote change: confirm with the human first.' }
    }
    if (($cmd -match ($gitHead + 'config\s+(--global|--system)(\s|$)')) -and -not ($cmd -match '(?i)\s(--get|--get-all|--list|-l)(\s|$)')) {
        Deny 'global or system git config writes are not allowed; set repo-local config instead.'
    }

    # ---- destructive git --------------------------------------------------------------------
    $destructive = @(
        @('reset\s+(.*\s)?(--hard|--merge|--keep)(\s|$)', 'git reset --hard/--merge/--keep discards work; confirm with the human.'),
        @('clean(\s|$)', 'git clean deletes untracked files; confirm with the human.'),
        @('checkout\s+(.*\s)?(--|\.|-f|--force)(\s|$)', 'git checkout -- / . / -f discards working-tree changes; confirm with the human.'),
        @('restore(\s|$)', 'git restore discards working-tree changes; confirm with the human.'),
        @('switch\s+(.*\s)?(-f|--force|--discard-changes)(\s|$)', 'git switch -f discards changes; confirm with the human.'),
        @('branch\s+(.*\s)?(-D|--delete\s+--force)(\s|$)', 'git branch -D deletes a branch; confirm with the human.'),
        @('stash\s+(drop|clear)(\s|$)', 'git stash drop/clear discards stashes; confirm with the human.'),
        @('rebase(\s|$)', 'git rebase rewrites history; confirm with the human.'),
        @('commit\s+(.*\s)?--amend(\s|$)', 'git commit --amend rewrites the last commit; confirm with the human.'),
        @('tag\s+(.*\s)?(-d|--delete)(\s|$)', 'git tag -d deletes a tag; confirm with the human.'),
        @('(filter-branch|filter-repo|update-ref\s+-d|reflog\s+(expire|delete)|gc\s+--prune)(\s|$)', 'history rewrite or reflog pruning; confirm with the human.'),
        @('worktree\s+remove\s+(.*\s)?(-f|--force)(\s|$)', 'git worktree remove --force discards uncommitted work; confirm with the human.')
    )
    $dryRun = $cmd -match '\s(-n|--dry-run)(\s|$)'
    foreach ($d in $destructive) {
        if ($d[0].StartsWith('clean') -and $dryRun) { continue }
        if ($cmd -match ($gitHead + $d[0])) { Ask $d[1] }
    }
    if (($cmd -match ($gitHead + 'clean\s+(.*\s)?-[A-Za-z]*[xX][A-Za-z]*(\s|$)')) -and -not ($cmd -match '\s(-n|--dry-run)(\s|$)')) {
        Deny 'git clean -x / -X would delete ignored files such as .claude/; use -n first and never -x.'
    }
    if ($cmd -match ($gitHead + 'add\s+(.*\s)?(-A|--all|-u|--update|\.|\*|:/)(\s|$)')) {
        Deny 'stage by explicit path; never git add -A / . / -u / * (rule 01-git-identity).'
    }

    # ---- commits ----------------------------------------------------------------------------
    if ($cmd -match ($gitHead + 'commit(\s|$)')) {
        if (($cmd -match '(?i)\s--no-verify(\s|$)') -or ($cmd -match '\s-[A-Za-z]*n[A-Za-z]*(\s|$)')) { Deny 'never commit with --no-verify / -n.' }
        if ($cmd -match '(?i)\s--author(=|\s)') { Deny 'never override the author on a commit (--author).' }
        if ($cmd -match '(?i)\s-c\s+(user\.(name|email)|core\.hookspath)') { Deny 'never override identity or hooks on a commit (-c user.* / core.hooksPath).' }
        if ($cmd -match '(?i)\bGIT_(AUTHOR|COMMITTER)_(NAME|EMAIL)\s*=') { Deny 'never override identity through GIT_AUTHOR_* / GIT_COMMITTER_*.' }
        if (($cmd -match '(?i)\s--all(\s|$)') -or ($cmd -match '\s-[A-Za-z]*a[A-Za-z]*(\s|$)')) { Deny 'never git commit -a; stage by explicit path first.' }
        if (([string](Get-Prop $cfg @('git', 'aiAttribution') 'deny')) -eq 'deny') {
            $attr = @(
                @('(?i)co-authored-by', 'Co-Authored-By'), @('(?i)generated with', '"Generated with"'),
                @('(?i)noreply@anthropic\.com', 'noreply@anthropic.com'), @('(?i)anthropic', '"Anthropic"'), @('\bClaude\b', '"Claude"'))
            foreach ($a in $attr) { if ($cmd -match $a[0]) { Deny ('no AI attribution in commit messages (' + $a[1] + '); the owner''s rule wins over the harness reminder.') } }
        }
        foreach ($ph in @(Get-Prop $cfg @('git', 'forbiddenPhrases') @())) {
            if ($ph -and ($cmd -match ('(?i)' + (Esc ([string]$ph))))) { Deny ('forbidden phrase in a commit command: "' + $ph + '".') }
        }
        $wantName = [string](Get-Prop $cfg @('git', 'identity', 'name') '')
        $wantMail = [string](Get-Prop $cfg @('git', 'identity', 'email') '')
        if ($wantName -or $wantMail) {
            try {
                $gitExe = [string](Get-Prop $cfg @('git', 'gitExe') '')
                if (-not $gitExe) { $gitExe = 'git' }
                $haveName = (& $gitExe -C $root config user.name 2>$null | Out-String).Trim()
                $haveMail = (& $gitExe -C $root config user.email 2>$null | Out-String).Trim()
                if ($LASTEXITCODE -eq 0 -and (($wantName -and $haveName -ne $wantName) -or ($wantMail -and $haveMail -ne $wantMail))) {
                    Deny ('repo-local identity is "' + $haveName + ' <' + $haveMail + '>", expected "' + $wantName + ' <' + $wantMail + '>" (git.identity); set it with git config user.name / user.email.')
                }
            } catch { }
        }
    }
    foreach ($e in @(Get-Prop $cfg @('git', 'deniedEmails') @())) {
        if ($e -and ($cmd -match ('(?i)\bgit\b.*' + (Esc ([string]$e))))) { Deny ('the e-mail ' + $e + ' must never appear in a git command (git.deniedEmails).') }
    }

    # ---- processes --------------------------------------------------------------------------
    $killVerb = '(?i)(^|[\s;&|(])(taskkill|tskill|Stop-Process|spps|pkill|killall|kill)(\s|$)'
    $launchVerb = '(?i)(^|[\s;&|(])(start|Start-Process|saps|Invoke-Item|ii)(\s|$)'
    foreach ($n in @(Get-Prop $cfg @('processes', 'neverKill') @())) {
        if (-not $n) { continue }
        $re = '(?i)(?<![A-Za-z0-9_])' + (Esc (([string]$n) -replace '\.exe$', '')) + '(\.exe)?(?![A-Za-z0-9_])'
        if (($cmd -match $killVerb) -and ($cmd -match $re)) { Deny ('never kill ' + $n + ' (processes.neverKill); if it blocks a link or a test, stop and tell the human.') }
    }
    foreach ($n in @(Get-Prop $cfg @('processes', 'neverLaunch') @())) {
        if (-not $n) { continue }
        $base = (Esc (([string]$n) -replace '\.exe$', ''))
        $asCommand = '(?i)(^|[\s;&|(])(\S*[\\/])?' + $base + '(\.exe)?(\s|$)'
        $named = '(?i)(?<![A-Za-z0-9_])' + $base + '(\.exe)?(?![A-Za-z0-9_])'
        if (($cmd -match $asCommand) -or (($cmd -match $launchVerb) -and ($cmd -match $named))) { Deny ('never launch ' + $n + ' (processes.neverLaunch).') }
    }
    if (($cmd -match $killVerb) -and -not ($cmd -match '(?i)(\s(/PID|-Id)\s+\d+)|(\bkill\s+(-\d+\s+)?\d+)') -and $script:Denies.Count -eq 0) {
        Ask 'killing a process by name: kill only processes this session started, by PID.'
    }

    # ---- persistent environment variables (K19) ---------------------------------------------
    # $envName: $null = no persistent write seen; '' = a write whose name is not a literal.
    $envName = $null
    $envHow = ''
    if ($cmd -match '(?i)(^|[\s;&|(])setx(\.exe)?\s+(/m\s+)?(?<name>[^\s/]\S*)') {
        $envName = $Matches['name']; $envHow = 'setx'
    } elseif ($cmd -match '(?i)\[(System\.)?Environment\]::SetEnvironmentVariable\(\s*(?<name>[^,)]*),(?<rest>[^)]*)\)') {
        $parts = @(([string]$Matches['rest']).Split(','))
        if ($parts.Count -ge 2) {
            $target = ($parts[$parts.Count - 1]).Trim().Trim('"', "'") -replace '(?i)^\[(System\.)?EnvironmentVariableTarget\]::', ''
            if ($target -notmatch '(?i)^process$') { $envName = ([string]$Matches['name']).Trim().Trim('"', "'"); $envHow = '[Environment]::SetEnvironmentVariable' }
        }
    } elseif ($cmd -match '(?i)(^|[\s;&|(])(reg(\.exe)?\s+add|Set-ItemProperty|sp|New-ItemProperty|Remove-ItemProperty|rp|Set-Item|si|New-Item|ni)\b[^|;]*\bHK(CU|LM|EY_CURRENT_USER|EY_LOCAL_MACHINE)[:\\][^\s"'']*Environment(["''\s]|$)') {
        $envName = ''; $envHow = 'a registry write to the Environment key'
        if ($cmd -match '(?i)(\s/v\s+|\s-Name\s+)["'']?(?<name>[^\s"'']+)') { $envName = $Matches['name'] }
    }
    if ($null -ne $envName) {
        if ($envName -match '[$%`]') { $envName = '' }
        $protected = ''
        foreach ($pat in @(Get-Prop $cfg @('environment', 'protectedVars') @())) {
            if ($pat -and $envName -and ($envName -like ([string]$pat))) { $protected = [string]$pat; break }
        }
        $mode = [string](Get-Prop $cfg @('environment', 'persistentWrites') 'ask')
        if ($protected) {
            Deny ($envHow + ' writes the protected environment variable ' + $envName + ' (environment.protectedVars "' + $protected + '"): the human owns the build environment. Set it for this process only ($env:NAME) or tell the human.')
        } elseif (-not $envName) {
            Ask ($envHow + ' writes a user- or machine-scope environment variable whose name the guard cannot read; it outlives the session. Confirm with the human.')
        } elseif ($mode -eq 'deny') {
            Deny ($envHow + ' writes the environment variable ' + $envName + ' persistently (environment.persistentWrites "deny"). Set it for this process only ($env:NAME).')
        } elseif ($mode -ne 'allow') {
            Ask ($envHow + ' writes the environment variable ' + $envName + ' persistently: it outlives this session and changes the build environment of every tool on the machine. Set it for this process only ($env:NAME) or confirm with the human.')
        }
    }

    # ---- PowerShell writes into ASCII sources on a code-page machine -------------------------
    $codePage = [string](Get-Prop $cfg @('encoding', 'codePage') '')
    if ($codePage -and ($isPs -or ($cmd -match '(?i)\b(powershell|pwsh)(\.exe)?\b'))) {
        $exts = @(Get-Prop $cfg @('encoding', 'asciiExtensions') @('.cpp', '.cc', '.cxx', '.h', '.hpp', '.hh', '.inl', '.ipp', '.ui', '.qrc', '.qss', '.pro', '.pri', '.prf', '.cmake', '.bat', '.cmd', '.ps1', '.py', '.js', '.json'))
        $alts = @($exts | Where-Object { ([string]$_).StartsWith('.') } | ForEach-Object { Esc ([string]$_) })
        if ($alts.Count -gt 0) {
            $ext = '(' + ($alts -join '|') + ')'
            $viaCmdlet = $cmd -match ('(?i)(^|[\s;&|(])(Set-Content|sc|Add-Content|ac|Out-File|Tee-Object)\b[^|;]*?' + $ext + '(\b|["''\s]|$)')
            $viaRedirect = $cmd -match ('>>?\s*[''"]?[^\s|;''"]+' + $ext + '(["''\s]|$)')
            if ($viaCmdlet -or $viaRedirect) {
                Deny ('on a ' + $codePage + ' machine PowerShell text cmdlets and > redirection mangle UTF-8 source files; use the Edit/Write tools or [IO.File]::WriteAllText with UTF8Encoding($false).')
            }
        }
    }

    # ---- deletes that name a protected location ---------------------------------------------
    if ($cmd -match '(?i)(^|[\s;&|(])(rm|rmdir|rd|del|erase|unlink|Remove-Item|ri)(\s|$)') {
        $norm = $cmd -replace '\\', '/'
        function PathHit([string]$pattern) {
            $p = ([string]$pattern -replace '\\', '/').Trim().TrimEnd('/')
            if (-not $p) { return $false }
            $re = '(?i)(^|[\s"''=/])' + (Esc $p) + '(/|["''\s]|$)'
            return ($norm -match $re)
        }
        foreach ($p in @(Get-Prop $cfg @('paths', 'protectedDelete') @('.git/', '.claude', '.claude/memory/'))) {
            if (PathHit $p) { Deny ('delete touches a protected location (' + $p + ', paths.protectedDelete).') }
        }
        foreach ($p in @(Get-Prop $cfg @('paths', 'readOnly') @())) {
            if (PathHit $p) { Deny ('delete inside a read-only path (' + $p + ', paths.readOnly).') }
        }
        foreach ($p in @(Get-Prop $cfg @('paths', 'localOnly') @())) {
            if (PathHit $p) { Ask ('delete inside a local-only path (' + $p + ', paths.localOnly): confirm with the human.') }
        }
    }

    if ($script:Denies.Count -gt 0) { Emit-Decision 'guard-shell' 'deny' $script:Denies }
    elseif ($script:Asks.Count -gt 0) { Emit-Decision 'guard-shell' 'ask' $script:Asks }
} catch {
    [Console]::Error.WriteLine('[guard-shell.ps1] internal error, allowing: ' + $_.Exception.Message)
}
exit 0
