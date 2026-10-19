# Pack hooks-powershell

The minimal hook set for a machine where Node must not be installed: three Windows PowerShell
5.1 scripts (also fine under pwsh 7) that read the same `kit.config.json` as the core Node
hooks and speak the same decision protocol. Install from a machine that has Node (the
installer itself is Node) or copy the generated `.claude/` folder over:
`node install.js --target <project> --packs cpp-qmake-qt,hooks-powershell`. Listing the pack
sets `hooks.runtime` to `powershell` and leaves the core Node hook entries out of
`settings.json`.

## Contents

| Path | Installed as | What |
|---|---|---|
| `hooks/lib.ps1` | `.claude/hooks/hooks-powershell/` | shared preamble: BOM-tolerant stdin JSON, config loader, project root, decision JSON |
| `hooks/guard-shell.ps1` | same (PreToolUse `Bash\|PowerShell`) | push policy, force push, remote and global-config changes, destructive git (ask), staging and commit rules, AI attribution and forbidden phrases, identity overrides, repo-local identity check, denied e-mails, never-kill / never-launch processes, persistent environment variable writes (setx, `SetEnvironmentVariable` with a User/Machine target, Environment registry keys; `environment.*`), PowerShell writes into ASCII sources on a code-page machine, deletes that name protected, read-only or local-only paths |
| `hooks/subagent-model-guard.ps1` | same (PreToolUse `Agent`) | model per role from `models.*`, explicit `model`, no fork; fails closed |
| `hooks/sync-memory.ps1` | same (Stop; also `-Restore`, `-DryRun`, `-Status`) | mirrors Claude's global memory into `paths.memoryMirror`, same folder naming as the Node hook |
| `hooks/test-hooks.ps1` | same | `powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/hooks-powershell/test-hooks.ps1 [filter]`; 86 table-driven cases plus 10 unit checks |
| `hooks/settings.fragment.json` | merged into `.claude/settings.json` | wires the three hooks with `$CLAUDE_PROJECT_DIR` |

## Config keys (`kit.config.json`)

```json
"hooks": { "runtime": "powershell" },
"packConfig": { "hooks-powershell": { "exe": "powershell" } }
```

`exe` is the executable in the hook commands (`powershell` or `pwsh`). Every other value the
scripts read (`git.*`, `paths.*`, `processes.*`, `encoding.codePage`, `encoding.asciiExtensions`,
`models.*`) is the core's; nothing is configured twice.

## What is different from the Node hooks

- **Regex, not a tokeniser.** The command text is matched as a whole: nested shells
  (`cmd /c`, `powershell -Command`), paths held in variables, `cd` tracking and the
  resolution of relative targets are not done. A delete is judged by the protected names it
  mentions, so a delete outside the project that names nothing protected is allowed, and a
  process name next to a kill verb inside quoted text is denied. Where the Node guard asks
  for an unresolvable target, this one allows.
- **No `guard-edit`.** Read-only paths, forbidden tree files and ASCII content of edits are
  not checked by a hook on these machines; the leader's verification loop and the reviewer
  carry that (the ASCII grep in `verification-loop` phase 6).
- **No `format` hook** and no pack hooks: `kernel-gates` (controller-kernel) and `wt-guard`
  (work-package) are Node. Run their tools by hand where the pack says so, or do not combine
  those packs with this one.
- **Cost.** Starting `powershell.exe` on every shell call takes a few hundred milliseconds;
  the timeouts in the fragment allow for it.
- **Encoding.** The scripts are pure ASCII (PowerShell 5.1 reads a BOM-less script in the
  machine's ANSI code page) and tolerate a BOM on stdin; reasons they print are ASCII too.

## Testing

`test-hooks.ps1` builds a throwaway project under the temp folder and runs every hook as a
child process (96 checks: 86 table cases, 10 unit checks). Run it after installing and after
every change to `kit.config.json` that the hooks read; `install.js --test` runs it when the
pack is enabled and the executable is found. It needs PowerShell; the kit repository's own
test run (`node core/hooks/test-hooks.js`) does not cover these scripts. The scripts avoid
pwsh-only syntax; the harness ran green under pwsh 7 on Linux before the 5.1 fix below and
under Windows PowerShell 5.1 (5.1.26100) after it.

**stderr under PowerShell 5.1.** Every hook reports on stderr (the fail-open note of
`guard-shell.ps1`, the copy summary of `sync-memory.ps1`). Windows PowerShell 5.1 turns each
stderr line of a native child into a `NativeCommandError` record as soon as the stream is
redirected (`2>$null`, `2>&1`), and under `$ErrorActionPreference = 'Stop'` the first line
terminates the caller. That bit the test harness, which now lowers the preference to
`Continue` around each child call and compares stdout only. The hooks themselves are not
affected: Claude Code starts `powershell -File` directly from `settings.json` and reads
stderr as plain text, and the one native call inside a hook (`git config` in
`guard-shell.ps1`) runs under the default `Continue` preference, so a stderr line there is a
non-terminating record that the hook ignores. Keep it that way: never set
`$ErrorActionPreference = 'Stop'` in a hook, and never wrap a hook in another PowerShell
that redirects its stderr.

## Origin

Project-written (2026), modelled on the two PowerShell hooks of a Qt project whose machine
forbids Node and on the Node hooks of this kit. No third-party licence.
