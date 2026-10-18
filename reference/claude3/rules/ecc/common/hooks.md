# Hooks

> Adapted from ECC (`affaan-m/ecc`, MIT). ECC's Node hook runtime is not installed; this
> project ships its own minimal hooks in `.claude/hooks/` wired via `.claude/settings.json`.

## Installed hooks

| Event | Matcher | Script | Behavior |
|-------|---------|--------|----------|
| PreToolUse | `Edit\|Write\|MultiEdit` | `protect-reference.js` | **Blocks** (exit 2) any edit under `reference_source/` |
| PreToolUse | `Bash\|PowerShell` | `guard-delete.js` | **Blocks** (exit 2) delete commands that target `reference_source/` or any path outside the project folder (temp/scratchpad excepted); deletes inside the project are allowed |
| Stop | (all) | `sync-memory.js` | Mirrors the global memory dir for this project into `.claude/memory/` (backup); `--restore` goes the other way |
| PostToolUse | `Edit\|Write\|MultiEdit` | `format-cpp.js` | Runs `clang-format -i` on edited `.cpp/.h/...` files if clang-format is found (PATH or Visual Studio LLVM dir); silently skips otherwise |

All scripts are plain Node (v18+), read the hook JSON from stdin, and never require network.

## Rules for hooks in this project

- Hooks must be fast (<2 s) and must not fail when a tool is missing.
- Never add a hook that runs the full build or test suite on every edit; use the
  `verification-loop` skill for that.
- Do not weaken a hook to make an edit pass. If `reference_source/` needs a fix, port the file
  to `src/` instead.

## Permissions

Configure `permissions.allow` in `.claude/settings.json` rather than bypassing prompts.
Never run with `--dangerously-skip-permissions`.
