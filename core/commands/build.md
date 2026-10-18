---
description: Build the project (or one target) with the commands from build-env.md and, when the build is broken, spawn the build-resolver for minimal surgical fixes - one error at a time, never weakening warnings.
argument-hint: "[target | config | slot/worktree tag | blank = the leader's tree, every shipped config]"
---

# /build

**Target**: $ARGUMENTS

1. Run the configure and build commands from `.claude/project/build-env.md` verbatim, in the
   tree named by the argument (default: `build.leadBuildDir`, every configuration listed in
   `definition-of-done.md`). Pass every option explicitly; a slot may hold another value in
   its cache.
2. Green: report `Build: PASS (<warnings> warnings) - <command>` and stop. A green build is
   not a passing test; run `/test` or say the tests were not run.
3. Broken: spawn `build-resolver` with `model: <models.worker>`, the build command, the tree,
   the task's touch list ("Must not touch" applies to fixes too) and the toolchain pack's
   error table. It fixes the first error, rebuilds, repeats, and stops after 3 attempts on the
   same error, when a fix adds errors, or when the fix needs a design change, a new
   dependency or a missing tool.
4. Record the resolver's report (`[FIXED] file:line ...`, `Build Status: ...`) in the task
   file's Dev notes or Leader verify, and re-run `/test` if any source changed.

## Rules

- Never silence a warning (`#pragma warning(disable)`, `/wd`, `-Wno-`, `NOLINT`, lowering the
  level, removing `/WX` or `-Werror`); approval from the human is needed even for
  `_CRT_SECURE_NO_WARNINGS`-style defines.
- Never hard-code a machine path into a tracked build file; machine paths live in the
  untracked local file the build reads.
- Every test project that includes a touched module is rebuilt before a close-out.
- Stale artifacts are deleted only inside the build directory and only for a known failure
  mode of the toolchain (`build-env.md` gotchas).
