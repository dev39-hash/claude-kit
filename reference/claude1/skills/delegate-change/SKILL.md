---
name: delegate-change
description: Lead-only procedure for turning a requested change in controller-kernel (or a controller built on it) into briefs for sub-agents - pick the pipeline, write each brief from the template, run independent briefs in parallel, integrate and verify. Use in the main session before any code or test change is delegated.
---

# Delegate a change

Main session only. Sub-agents do not use this skill.

## 1. Classify the change

| Change | Layer-A skill the worker follows | Review |
|---|---|---|
| new controller | `controller-design` (design doc first, then scaffold) | design review (opus) before code |
| new event, signal, completion, command source | `controller-add-event` | `controller-reviewer` |
| new or extended state block | `controller-add-block` | `controller-reviewer`; ADR if the kernel block set changes |
| changed rule, threshold, output | `controller-change-rule` | `controller-reviewer` |
| kernel contract, law, `core_traits.h`, CMake target | ADR first (`architecture-decision-records`) | opus review of the ADR |
| build break | `cpp-build-resolver` | none |

## 2. Pipeline

```text
brief -> kernel-tester (RED rows)        [parallel with ADR / doc reading]
      -> kernel-implementer (GREEN)
      -> cpp-build-resolver              (only when the build is broken)
      -> controller-reviewer, opus       (APPROVE or WARN; BLOCK goes back to the implementer)
      -> lead: kernel-verify, commit when the user asks
```

Workers that edit the same file (often `tests/main.cpp`) run in sequence, or each in its own
worktree (`isolation: "worktree"`); build slots isolate build trees only.

## 3. Brief template

```text
GOAL:          one sentence
SKILL:         controller-add-event | controller-add-block | controller-change-rule | tdd-workflow
CONTEXT:       docs sections, headers, ADRs to read
DELIVERABLES:  files to create or modify
CONSTRAINTS:   laws that bite (L-numbers), ASCII, naming, no Qt in a core
ACCEPTANCE:    table rows that must pass, sweep and invariants green, review verdict
OUT OF SCOPE:  files not to touch
BUILD:         node .claude/tools/build.js all --slot <tag>; release the slot at the end
MODEL:         you run on sonnet
```

Keep briefs worth reusing in `.claude/docs/briefs/<topic>.md`.

## 4. Completion contract

1. Independent briefs go out in one message; dependent ones in sequence.
2. The lead collects every report and checks it against the build, the tests and
   `node .claude/tools/gate-check.js --all`; a report alone is not proof.
3. Do not re-delegate a sized task; split only what cannot fit one context.
4. Update `.claude/docs/plan/` and the status line in `.claude/CLAUDE.md` when a step lands.
