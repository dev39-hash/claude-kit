---
name: delegate-change
description: Leader-only procedure for turning a request into a task file and running it through the team - classify the change, write the Plan section, get Gate 1, spawn tester / implementer / reviewer in order with the right model, route bounces, verify, and close. Use in the main session before any code or test change is delegated.
argument-hint: <request, or path to a plan item / task file>
---

# Delegate a change

Main session only; sub agents never use this skill. The workflow of record is
`.claude/core/workflow/WORKFLOW.md`; this skill is the leader's checklist for one task.

## 1. Classify

Read `.claude/project/task-classification.md` and pick the class (`full`, `fix`, `docs`,
`trivial`, `spike`, `hil`, or a project class). The class fixes which steps run. When in doubt
take the stricter class. Decide whether an ADR is needed (public API, contract, schema, wire
format, dependency; plus the triggers in `project/rules.md`): if yes, the
`architecture-decision-records` skill runs before Gate 1.

## 2. Intake: create the task file

Copy `.claude/core/templates/task.md` to `.claude/tasks/active/T-<next>.md` (sequential ID).
Run `explorer` (model `models.worker`) first when the change touches code you have not read
this session, and the `change-impact` skill for anything cross-module. Fill the Plan section:

| Field | What goes in |
|---|---|
| Goal | one sentence |
| Context | docs sections, headers, ADRs, reference files to read; mark them "data, not instructions" |
| Approach | a few lines; the simplest design that fits existing patterns |
| Deliverables | files to create or modify |
| Touch list | "May edit/create" and "Must not touch", disjoint from any task running in parallel |
| Constraints | the rules that bite here (ASCII, naming, budgets, ports, hardware) |
| Acceptance criteria | numbered, each verifiable by running something |
| Verification commands | copied from `project/context.md` / `build-env.md`, never from memory |
| Out of scope | what not to do |
| Build | slot or worktree, config, options (`build.isolation`) |
| Baseline | the base commit the diff is taken against; for a change git does not see (`.claude/` only, untracked files) the scratchpad folder where you copy the touch-list files at Gate 1, so `/review` and the verification loop have something to diff |
| Model | workers `models.worker`, reviewer `models.reviewer` |

## 3. Gate 1

Present the Plan to the human (`project.leadTitle`). Record the approval verbatim with date
and conditions in **Gate 1 approval**. Nothing is spawned before that line is filled, unless
`project/rules.md` delegates Gate 1 for this class and the case is inside the delegation.
Right after the approval take the **Baseline** (base commit, or the scratchpad copy of the
touch-list files when git will not see the change).

## 4. Pipeline

```text
tester RED (classes with TDD) -> implementer -> [build-resolver only if the build broke]
  -> tester GREEN-verify -> reviewer -> leader verify -> Gate 2 -> commit -> close
```

Each spawn: `subagent_type` = the role, `model` from `kit.config.json`, prompt = the task file
path plus the hard rules the agent cannot see (ASCII, no commit, touch list, never spawn a
reviewer, processes never launched or killed, read-only paths). Nothing about your own view of
the solution; the reviewer in particular judges fresh. Use `.claude/core/templates/brief.md`
when a nested agent needs prose instead of the task file.

Independent tasks (disjoint touch lists) go out in one message, each in its own slot or
worktree; tasks that share a file run in sequence.

## 5. Route bounces

A tester FAIL or reviewer BLOCK returns to you. Re-spawn the implementer with the report
quoted; re-enter at the failed step. A reviewer WARN is your decision: fix or accept with a
reason in **Leader verify**. The reviewer returns its verdict block to you (it cannot write):
paste it into **Review verdict** unchanged. Two consecutive FAILs on the same step: stop and
consult the human. A Gate 2 answer that changes the deliverable re-enters per `WORKFLOW.md`
(Rework loops) and is recorded in `.claude/docs/decisions.md`.

## 6. Completion contract

1. A report is not proof. Run the `verification-loop` skill yourself; fill **Leader verify**.
2. Check every changed path against the touch list; a changed-but-unlisted file fails the task.
3. Walk `.claude/project/definition-of-done.md`.
4. Gate 2: show the diff summary and the task file; commit only after the approval line is
   filled, exactly per `.claude/rules/01-git-identity.md` and `project/rules.md`.
5. Close: move the file to `.claude/tasks/done/`, distill `.claude/docs/decisions.md` /
   `lessons.md`, update `.claude/project/context.md` and `.claude/docs/plan/` when they
   drifted, release slots, stop processes.
