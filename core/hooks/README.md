# Kit hooks

Node scripts, parameterised by `<project>/.claude/kit.config.json` (defaults in `lib/config.js`,
documented in `kit.config.schema.json`). Installed into `<project>/.claude/hooks/` and wired by
`settings.template.json` -> `.claude/settings.json`. Every path in `settings.json` goes through
`$CLAUDE_PROJECT_DIR`. All sources are ASCII.

| Hook | Event / matcher | Decides | Fails |
|---|---|---|---|
| `guard-shell.js` | PreToolUse `Bash\|PowerShell` | deletes, writes into protected paths, git (identity, attribution, staging, push, destructive), process kill/launch, PowerShell writes on code-page machines | open |
| `guard-edit.js` | PreToolUse `Edit\|Write\|MultiEdit\|NotebookEdit` | read-only paths, kit files (`core/`, `packs/`, `hooks/` and every activated copy listed in `kit.manifest.json`), memory mirror, forbidden tree files, ASCII content | open |
| `subagent-model-guard.js` | PreToolUse `Agent` | model per role, explicit model, no fork | closed |
| `format.js` | PostToolUse `Edit\|Write\|MultiEdit` | runs the formatter only when the repo has a formatter config | never blocks |
| `sync-memory.js` | Stop (also CLI: `--restore`, `--dry-run`, `--status`) | mirrors Claude's global memory into `paths.memoryMirror` | never blocks |
| `test-hooks.js` | manual: `node .claude/hooks/test-hooks.js [filter]` | ~300 table-driven cases plus unit checks; exit 1 on any failure | - |
| `probe.js` | manual: `node .claude/hooks/probe.js shell "<cmd>" \| edit <file> \| agent <type> [model] \| --batch <file>` (`--mode auto`, `--ps`) | prints what the installed hooks decide with the real config; runs nothing | - |

## Unattended permission modes

A hook's `ask` is a permission dialog outside the chat. In the 2026-10-18 dry-runs it did not
work as a gate in `auto` mode: in image_matching a `git push` the guard asked about ran and
nobody noticed a dialog; in mc_protocol the dialog showed and was approved by one click, with
nothing in the chat. Every `ask` therefore carries a category, and when the hook input's
`permission_mode` is in `hooks.autoMode.modes` (default `auto`, `bypassPermissions`) an ask
whose category is in `hooks.autoMode.askToDeny` becomes a deny that tells the agent to ask the
human in chat. A project that wants the dialog to stay the gate sets `askToDeny` to `[]`
(mc_protocol's owner ruled "keep ask"):

| Category | Asked for | Denied in auto mode by default |
|---|---|---|
| `push` | `git push`, `--force-with-lease` | yes |
| `envWrite` | `setx`, `SetEnvironmentVariable(.., User\|Machine)`, Environment registry keys | yes |
| `askBeforeEdit` | Edit/Write or a shell write into `paths.askBeforeEdit` | yes |
| `localOnlyDelete` | a delete inside `paths.localOnly` | yes |
| `destructiveGit` | `reset --hard`, `clean`, `checkout --`, `restore`, `branch -D`, `rebase`, `--amend`, `stash drop`, ... | yes |
| `outsideDelete`, `unresolvedDelete` | a delete outside the project, or of a target the guard cannot resolve | yes |
| `killByName` | a kill by process name | yes |
| `outsideEdit` | an Edit/Write outside the project (temp folders, scratchpad, Claude's memory folders free) | yes |
| `remote`, `inPlaceEdit`, `kitConfig`, `projectCommand` | remote changes, `sed -i`, `kit.config.json` / `settings.json` edits, `commands.ask` matches | no (add them to the list to deny) |

In the attended modes (`default`, `acceptEdits`, `plan`) nothing changes. The PowerShell twin
(`hooks-powershell`) applies the same rule to its own asks.

## Decision protocol

A guard writes one JSON line to stdout only when it decides `ask` or `deny`
(`hookSpecificOutput.permissionDecision` + `permissionDecisionReason`); it writes nothing to
allow, so the normal permission flow continues. Every reason is collected; `deny` beats `ask`.
Exit code is always 0. Internal errors allow (guards) or deny (model guard) and leave a note on
stderr.

## What is configurable

| Config key | Used by |
|---|---|
| `git.identity`, `deniedEmails`, `forbiddenPhrases`, `push`, `forcePush`, `gitExe` | guard-shell |
| `paths.readOnly`, `askBeforeEdit`, `localOnly`, `protectedDelete`, `memoryMirror`, `forbiddenTreeFiles`, `tempRoots` | guard-shell, guard-edit |
| `processes.neverKill`, `neverLaunch` | guard-shell |
| `paths.foreignTrees` | guard-shell, guard-edit (other checkouts, standby copies: never written or deleted) |
| `commands.deny`, `commands.ask` | guard-shell (the project's own command rules, `{ match, reason }`) |
| `hooks.autoMode.modes`, `askToDeny` | guard-shell, guard-edit (asks that become denies in unattended modes) |
| `environment.persistentWrites`, `protectedVars` | guard-shell (setx, `[Environment]::SetEnvironmentVariable(.., User\|Machine)`, HKCU/HKLM Environment registry writes; `$env:X` is free) |
| `encoding.asciiExtensions`, `asciiExempt`, `asciiRepoMarkdown`, `codePage` | guard-edit, guard-shell (PowerShell writes), format |
| `models.worker`, `reviewer`, `forceAll`, `allowFork` | subagent-model-guard |
| `build.formatOnEdit`, `buildDirPatterns`, `toolchain.clangFormatExe`, `toolchain.vsRoot` | format |
| `build.buildDirPatterns`, `leadBuildDir`, `slots.dir` | guard-shell (in-place edits with sed -i / perl -i are free there) |

Pattern forms for path lists: `dir/` (the directory and below), `a/b.txt` (exactly that path),
`*.ts` (basename or first segment glob), `docs/*.md` (relative-path glob).

## Known limits

- Regex and tokeniser, not a shell parser: a path hidden in a variable or built at run time is
  reported as "cannot be checked" and asks.
- Script files (`node script.js`, `python script.py`, `.bat`) are not inspected; only inline
  code (`-e`, `-c`, heredocs) is.
- `guard-edit` sees the editing tools only; shell writes are `guard-shell`'s job, and the two
  share the same path lists.
- The repo-local identity check needs `git` (or `git.gitExe`) and a repository; outside one it
  is skipped.

## Adding a rule

1. Put the value in `kit.config.json` (and its default in `lib/config.js` + the schema).
2. Implement it in the guard; reuse `lib/paths.js` matchers and `lib/shell.js` walking.
3. Add allow / ask / deny cases to `test-hooks.js`; run it to 0 failures.
