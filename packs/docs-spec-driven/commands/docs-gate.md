---
description: Run the mechanical docs gate of the spec-driven regime (tracked files free of .claude / phase / agent vocabulary, ADR and spec and backlog IDs consistent) over the whole tree, the uncommitted changes or named paths; report findings by severity and what to fix. Read-only.
argument-hint: "[--changed | --staged | --all | <paths...>] [--strict]"
---

# /docs-gate

**Scope**: $ARGUMENTS

Runs the pack tool and reads its result; never edits anything itself.

```bash
node .claude/tools/docs-spec-driven/docs-gate.js --changed
```

| Argument | Scope |
|---|---|
| blank or `--changed` | modified, added and untracked files (git status) |
| `--staged` | the index |
| `--all` | every tracked file (`git ls-files`) |
| paths | the named files or directories |
| `--strict` | MEDIUM findings also fail |

Cross-file facts (decision items in the ADR file, requirement IDs in the spec directory,
backlog rows) are always read from the whole project; only in-scope files produce findings.
`--json` gives the same result as data.

## Reading the result

- `HIGH` fails the gate and the verification loop: `.claude` or agent workspace references,
  the untracked requests directory, numbered plan phases outside the history directory, a
  cited `ADR Dn` that does not exist, duplicate requirement, decision or backlog IDs.
  Fix the file, never the check; a phase prefix is rewritten into a self-contained
  comment, not deleted (`code-comments.md`).
- `MEDIUM` is a decision for the leader: agent vocabulary, external URLs or machine paths
  in code, an unknown requirement ID, a requirement without an acceptance row, a stale
  backlog reference, a second backlog-like file. Fix it or record why it stays (a URL in a
  build file that reads a tool path from the environment goes into
  `packConfig.docs-spec-driven.machinePathAllow` / `urlAllow`).
- `LOW` is informational: plan markers still present in a spec, backlog `Last used ID`
  behind, a numbering gap in the decision file, a missing changelog.

## Where it runs

- `verification-loop` Phase 6 (gates), with `--changed` before Gate 2; the result line goes
  into the task file's Leader verify section (`Gates: PASS | FAIL`).
- `spec-first` close-out, after CHANGELOG, backlog and spec markers are updated.
- `--all` after a docs restructure or before a release.
