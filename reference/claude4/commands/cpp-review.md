---
description: C++/Qt code review of the current change (memory and lifetime, Qt threading/signals, error propagation, module layering). Invokes the cpp-reviewer agent.
argument-hint: "[file paths | --cached | blank = uncommitted changes]"
---

# C++ Code Review

**Scope**: $ARGUMENTS

Invoke the **cpp-reviewer** agent on the scope above. With no argument, review
the uncommitted changes (`git diff` via the portable git at
`C:\DGB\build_packages\portable-git\cmd\git.exe`; git is not on PATH).

For a change on a device/PLC/laser path, also run the **silent-failure-hunter**
agent on the same files and merge its findings.

## Output

- Findings grouped CRITICAL / HIGH / MEDIUM, each with `file:line`, a concrete
  failure scenario, and the minimal fix.
- Verdict: **Approve** (no CRITICAL/HIGH), **Warning** (MEDIUM only), **Block**.
- The review only reports — do not edit files unless the user asks for the fixes.

## Related

- `/cpp-build` — fix build errors first
- Agents: `.claude/agents/cpp-reviewer.md`, `.claude/agents/silent-failure-hunter.md`
- Skill: `cpp-coding-standards`
