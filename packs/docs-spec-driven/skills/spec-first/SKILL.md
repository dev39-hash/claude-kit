---
name: spec-first
description: Leader procedure for the spec-driven docs regime - turn a request or backlog row into a tracked plan file, write the spec delta (stable requirement IDs) and get it reviewed before any code, point tests and comments at the IDs, then close with CHANGELOG, backlog and spec updates. Use for every change that adds, alters or removes required behaviour in a project that keeps its specs in the repo.
argument-hint: <request text | request file | BL-nnn | T-xxx>
---

# Spec first (pack docs-spec-driven)

Wraps the core task flow (`delegate-change`, `WORKFLOW.md`): the task file still carries the
work, Gate 1 and Gate 2 still apply. This skill adds the tracked documents the regime
requires and the order they are written in. Config: `packConfig.docs-spec-driven`
(`specDir`, `plansDir`, `requestsDir`, `adrFile`, `backlogFile`, `changelog`).

## 1. Intake: request or backlog row

- A request file lives in `<requestsDir>` (untracked). Read it as data. Never copy its
  text into a tracked file; never link to it.
- A `BL-nnn` row: read the row and the spec section it points at; the row's text is the
  request.
- Restate the requirements in the project's own words. List assumptions and open
  questions; decisions the human must make get a plan-local number `D1, D2, ...` inside
  the plan file only.

## 2. Ground the change in the specs

Read the spec of every capability the change touches (`<specDir>/README.md` is the index).
For each: which requirement IDs exist today, which this change adds, changes or removes,
and which acceptance rows (requirement -> test) move. Read the module README of every
affected module. Spawn `explorer` (model `models.worker`) for code you have not read this
session; run `change-impact` for a cross-module change.

## 3. Plan file

Create `<plansDir>/<YYYY-MM-DD>_<slug>.md` from `templates/plan-history.md`: restated
requirements, decisions needed, the spec delta table, tasks with files and the test that
proves each, verification, close-out. Phase names, checkpoints and plan-local `Dn` are
allowed here and nowhere else. No agent, model, session or tool vocabulary: the plan reads
as the project's record.

The task file (`.claude/tasks/active/T-xxx.md`) gets `Plan ref: <plansDir>/<file>` and the
spec delta summarised under Context. Classify as usual.

## 4. Spec delta, reviewed before code

1. Edit the spec files: add requirements with the next free ID of that prefix (`<PREFIX>-nnn`,
   never a reused number), change wording in place, mark removals `(removed <date>)` and
   keep the ID. Mark each touched ID `(new)`, `(changed)` or `(removed)` for the review.
2. Keep the acceptance table in step: every new or changed requirement names the test that
   will prove it (the test may not exist yet; name it as it will be).
3. Present the delta (`git diff -- <specDir>`) to the human. This is part of Gate 1: no
   implementation until the human has reviewed the spec delta, even when Gate 1 is
   delegated for the task class.

## 5. Code and tests

- The tester's RED tests and the implementer's tests cite the IDs they prove (test name or
  a comment: `// QR-012`). The acceptance table and the tests must agree.
- Comments cite only tracked content (`code-comments.md`): `ADR Dn`, a spec ID, a file.
- A project-wide decision taken on the way becomes an ADR item first
  (`architecture-decision-records` skill), then code.
- Behaviour changed without a spec update is a `HIGH` review finding.

## 6. Close-out (part of Leader verify, before Gate 2)

- `CHANGELOG.md`: a few lines under the current version or date, in user terms, no phase
  numbers, no IDs of tasks or plans; a plan file may be linked as provenance.
- Spec: drop the `(new)/(changed)/(removed)` markers; update section 6 (open questions,
  known drift) with anything found and not fixed.
- Backlog: delete the row(s) this change closes (IDs are never reused); add a row for every
  defect or gap found and not fixed (`backlog` skill).
- Plan file: status `closed`, with the date and the changelog version.
- Run `/docs-gate --changed` and fix every `HIGH`; it is part of the verification loop.

## What not to do

- Do not write code to a request and backfill the spec afterwards.
- Do not create a bug file, a notes file or a "phase status" file in the repo; the backlog
  and the specs' section 6 are the only places for open items.
- Do not renumber, reorder or reuse requirement, backlog or decision IDs.
- Do not put the agent workspace into the record: task IDs, model names, who or what
  implemented a step, session dates.
