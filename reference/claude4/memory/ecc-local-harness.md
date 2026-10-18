---
name: ecc-local-harness
description: "Project .claude/ holds a cherry-picked, Qt-adapted subset of ECC 2.2.3 (agents/commands/rules/skills) plus a PowerShell guard hook; no Node.js allowed"
metadata:
  node_type: memory
  type: project
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-07T02:57:56.646Z
---

On 2026-10-07 a subset of ECC 2.2.3 was installed into the project's `.claude/`
(ignored via `.git/info/exclude` → local-only). ECC source kept OUTSIDE the repo at
`C:\DGB\build_packages\harness-tools\ECC-2.2.3` (a repo nested under `.claude/`
is not discovered and its CLAUDE.md/rules leak into context).

Installed and rewritten for Qt 5.15/qmake/MSVC 32-bit: agents `cpp-reviewer`,
`cpp-build-resolver`, `silent-failure-hunter`, `code-explorer`, `code-architect`,
`planner`, `type-design-analyzer`; commands `/plan`, `/cpp-build`, `/cpp-review`,
`/feature-dev`; rules `.claude/rules/cpp/{coding-style,patterns,security,testing}.md`;
skills `cpp-coding-standards`, `inherit-legacy-style` (writes
`.claude/rules/legacy-style.md`, no CLAUDE.md hook), `architecture-decision-records`
(appends D-items to `docs/architecture/architecture_decisions.md`, no `docs/adr/`).

**Owner constraint: no Node.js** — every ECC hook is `node -e`, so none were taken.
Instead `.claude/hooks/guard-shell.ps1` (PreToolUse on PowerShell|Bash, registered
in `.claude/settings.json`) blocks `git push`/remote add and Set-Content/Out-File/`>`
onto source files — see [[git-local-repo]], [[powershell-utf8-source-files]].
If a shell call is unexpectedly blocked, that hook is why. A second hook,
`.claude/hooks/sync-memory.ps1` (PostToolUse on Write|Edit), mirrors memory files
— see [[memory-backup-sync]].

**Boundary rule** (`.claude/rules/repo-boundaries.md`, owner 2026-10-07): tracked
files (docs, module `README.md` scope cards, code, `.pro`/`.pri`) must never point into `.claude/` or
the memory folders; `.claude/` may point at tracked docs, never the reverse.

The "Prompt Defense Baseline" block in ECC files was left in place: stripping it
was denied by the permission classifier.
