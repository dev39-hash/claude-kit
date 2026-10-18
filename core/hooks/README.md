# Kit hooks

Node scripts, parameterised by `<project>/.claude/kit.config.json` (defaults in `lib/config.js`,
documented in `kit.config.schema.json`). Installed into `<project>/.claude/hooks/` and wired by
`settings.template.json` -> `.claude/settings.json`. Every path in `settings.json` goes through
`$CLAUDE_PROJECT_DIR`. All sources are ASCII.

| Hook | Event / matcher | Decides | Fails |
|---|---|---|---|
| `guard-shell.js` | PreToolUse `Bash\|PowerShell` | deletes, writes into protected paths, git (identity, attribution, staging, push, destructive), process kill/launch, PowerShell writes on code-page machines | open |
| `guard-edit.js` | PreToolUse `Edit\|Write\|MultiEdit\|NotebookEdit` | read-only paths, kit files, memory mirror, forbidden tree files, ASCII content | open |
| `subagent-model-guard.js` | PreToolUse `Agent` | model per role, explicit model, no fork | closed |
| `format.js` | PostToolUse `Edit\|Write\|MultiEdit` | runs the formatter only when the repo has a formatter config | never blocks |
| `sync-memory.js` | Stop (also CLI: `--restore`, `--dry-run`, `--status`) | mirrors Claude's global memory into `paths.memoryMirror` | never blocks |
| `test-hooks.js` | manual: `node .claude/hooks/test-hooks.js [filter]` | ~200 table-driven cases plus unit checks; exit 1 on any failure | - |

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
| `encoding.asciiExtensions`, `asciiExempt`, `asciiRepoMarkdown`, `codePage` | guard-edit, guard-shell (PowerShell writes), format |
| `models.worker`, `reviewer`, `forceAll`, `allowFork` | subagent-model-guard |
| `build.formatOnEdit`, `buildDirPatterns`, `toolchain.clangFormatExe`, `toolchain.vsRoot` | format |

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
