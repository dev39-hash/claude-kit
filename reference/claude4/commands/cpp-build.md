---
description: Build a NichirinLaserMark target (app, laser_host, or a test) 32-bit and fix compile/link errors incrementally. Invokes the cpp-build-resolver agent for minimal, surgical fixes.
argument-hint: "[app | laser_host | tests/<name> | blank = whatever the current change touches]"
---

# C++ Build and Fix

**Target**: $ARGUMENTS

Invoke the **cpp-build-resolver** agent to build the target and fix errors with
minimal changes. If no target is given, decide from the current change which
projects compile the touched files (app, `laser_host`, and every test project
that includes the touched module's `.pri`) and build each of them.

## What happens

1. Build the target 32-bit (vcvarsall `x86` → qmake → jom, via a `.bat` file —
   see the agent for the exact recipe and build directories).
2. Fix the FIRST error, rebuild, repeat — one fix at a time.
3. Stop after 3 failed attempts on the same error, or if the fix needs an
   architectural change, and report.
4. Report: errors fixed, files modified, final exit code, and that the exe is
   x86 (`0x014C`).

## Rules

- Build order: `laser_host` first, then the app. After rebuilding the host,
  confirm the timestamp of the DEPLOYED `laser_host.exe` (the copy is a post-link
  step that only runs when the app relinks).
- A green build is not a passing test. If the change is behavioural, run the
  relevant `tests/<name>` afterwards or say that it was not run.
- Never edit source files with PowerShell `Get-Content`/`Set-Content`.

## Related

- `/cpp-review` — review the change after it builds
- Agent: `.claude/agents/cpp-build-resolver.md`
- Reference: `docs/rules/build_and_verification.md`
