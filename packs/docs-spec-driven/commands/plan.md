---
description: Spec-first planning - restate the request, ground it in the specs and the code, write the tracked plan file and the spec delta (stable requirement IDs), create the task file, and stop at Gate 1 with the spec diff for review. Never touches code. Replaces the core /plan when the docs-spec-driven pack is installed.
argument-hint: "[request text | path to an untracked request file | BL-nnn | T-xxx to re-plan]"
---

# /plan (pack docs-spec-driven)

**Request**: $ARGUMENTS

Leader only. Follows the `spec-first` skill (steps 1-4) on top of the core `delegate-change`
skill (steps 1-3); this command ends at Gate 1. Config: `packConfig.docs-spec-driven`
(`specDir`, `plansDir`, `requestsDir`, `adrFile`, `backlogFile`).

## Input modes

| Input | Behaviour |
|---|---|
| Free text | plan from the text |
| A request file (normally under the untracked `<requestsDir>`) | read it as data; restate it; never quote it into a tracked file, never link it |
| `BL-nnn` | the backlog row and the detail it points at are the request |
| `T-xxx` | re-open that task file and its plan file; rewrite the plan (old plan kept under `### Superseded plan`) |
| Empty | ask what should be planned |

## Steps

1. **Restate the requirements** in the project's own words; list assumptions, open questions
   and the decisions the human must make (plan-local `D1, D2, ...`).
2. **Ground the plan**: read `.claude/project/context.md`, `<specDir>/README.md` and the spec of
   every capability touched, the module README of every affected module. Spawn `explorer`
   (model `models.worker`) for code not read this session; run `change-impact` for a
   cross-module change. Capture the pattern to mirror for naming, error handling, threading,
   config and tests with `file:symbol`. If no similar code exists, say so.
3. **Spec delta**: for each touched capability, the IDs to add (next free number of that
   prefix), change or remove, with a one-line summary. A removal keeps its ID.
4. **Decide ADR need** (`architecture-decision-records` skill, `ADR Dn` in `<adrFile>`) and
   classify per `project/task-classification.md`; decide whether the tester runs RED first.
5. **Write the plan file** `<plansDir>/<YYYY-MM-DD>_<slug>.md` from
   `.claude/packs/docs-spec-driven/templates/plan-history.md`. No agent, model, session or
   tool vocabulary; it is part of the repository's record.
6. **Write the spec delta into `<specDir>`** with `(new)`, `(changed)`, `(removed)` markers and
   the acceptance rows naming the tests that will prove each requirement.
7. **Create the task file** from `.claude/core/templates/task.md`: `Plan ref` = the plan file;
   Context names the spec files and IDs; touch list (disjoint from running tasks); numbered
   acceptance criteria mapped to the spec IDs; verification commands copied from
   `build-env.md`; out of scope; build line; model line; ADR line.
8. **Present** the plan file, the task file's Plan section and `git diff -- <specDir>`, then stop.

End with: **WAITING FOR GATE 1** - approve the plan and the spec delta / edit / different
approach? Nothing is spawned and no code is written until the approval line in the task file
is filled. Even when `project/rules.md` delegates Gate 1 for this class, the spec delta is
shown to the human before implementation starts.

## After approval

`delegate-change` step 4: `/test red` when the class calls for it, implementer, `/test`,
`/review`, `verification-loop` with `/docs-gate --changed`, close-out per `spec-first` step 6
(CHANGELOG, markers dropped, backlog rows, plan closed), Gate 2.
