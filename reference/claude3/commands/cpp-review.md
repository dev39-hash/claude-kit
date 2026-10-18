---
description: C++ code review for memory safety, modern C++ idioms, SIMD/OpenMP and OpenCV Mat-lifetime correctness. Invokes the cpp-reviewer agent on the current diff or on the files given as arguments.
---

<!-- Adapted from ECC (affaan-m/ecc, MIT) commands/cpp-review.md -->

# /cpp-review

Invoke the **cpp-reviewer** agent (`.claude/agents/cpp-reviewer.md`).

## What it does

1. Identify changed C++ files via `git diff` (or use `$ARGUMENTS` as the file list)
2. Run clang-tidy / cppcheck only if available; otherwise state that they were skipped
3. Memory-safety scan: raw buffers, Mat ROI lifetime, uninitialized members, SIMD alignment
4. Correctness scan: angle wrap, ROI offsets, score semantics, scalar vs SIMD parity
5. Modern C++ and project-convention check (`.claude/rules/project.md`)
6. Report findings by severity with concrete fixes

## When to use

- After writing or porting any C++ file
- Before committing
- Always for changes in `MatchEdge*`, `PatternLayer`, `BlockMax`, or anything with `_mm256`

## Severity

| Level | Examples | Verdict |
|-------|----------|---------|
| CRITICAL | UB, leak, dangling Mat view, wrong result silently | Block |
| HIGH | Rule of Five gap, C-style cast, Qt include, missing test | Warn |
| MEDIUM | Copies in loops, missing `reserve`, missing `[[nodiscard]]` | Info |

## Arguments

`$ARGUMENTS`: optional list of files or a directory to review instead of the git diff.

## Related

- `/cpp-build` when the build is broken
- `/cpp-test` to add tests first
- Skills: `cpp-coding-standards`, `cpp-testing`
