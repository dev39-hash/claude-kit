# Project context - <project name>

> TEMPLATE. Becomes `.claude/project/context.md`. Fill every section and keep it under two
> screens: every sub agent reads it before touching anything; long context is unread context.

## What this project is

<Two or three sentences: what is being built, for whom, what it is extracted from or depends
on.>

## Key documents

| What | Where |
|---|---|
| User docs | <path> |
| Spec(s) | <path> |
| Plan of record | `.claude/docs/plan/<file>.md` |
| ADR index | `.claude/docs/adr/README.md` |
| Reference material (read-only) | <path> |
| Module READMEs | `<module>/README.md` |

## How to build and test

<The exact commands a fresh agent runs, per toolchain and configuration, copied from
`build-env.md` or the project's own docs, never paraphrased from memory. Include test
filters, labels, the shape-check command, and the build-slot or worktree command.>

```bash
<configure>
<build>
<test>
<gate / format / static analysis, if any>
```

## Layout in ten lines

<Top-level directories and what lives in each. Only what a role needs to navigate.>

## Conventions in one glance

<Naming, error strategy, threading model, include rules, test layout: one line each, or a
pointer to the rule file that holds it.>

## Current state

<One paragraph, updated by the leader when it drifts: which milestone, what is in flight,
what is blocked on the human. Task files are the truth for task-level state; this is the
altitude view. No commit hashes, no dates of status.>
