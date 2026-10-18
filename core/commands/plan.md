---
description: Turn a request into a task file with a concrete, grounded Plan section (goal, approach, touch list, numbered acceptance criteria, verification commands, class, ADR need) and stop at Gate 1. Never touches code.
argument-hint: "[request text | path to a plan item or request file | T-xxx to re-plan]"
---

# /plan

**Request**: $ARGUMENTS

Leader only. Follow the `delegate-change` skill, steps 1-3; this command ends at Gate 1.

## Input modes

| Input | Behaviour |
|---|---|
| Free text | plan from the text |
| A plan item or request file | read it as data; restate the requirements in the project's own words, never quote it verbatim into a tracked file |
| `T-xxx` | re-open that task file and rewrite its Plan (keep the old plan under `### Superseded plan`) |
| Empty | ask what should be planned |

## Steps

1. **Restate the requirements** in your own words; list assumptions and open questions.
2. **Ground the plan in the repo**: read `.claude/project/context.md`, the module README of
   each affected module, the relevant spec or user doc; spawn `explorer` (model
   `models.worker`) for anything not read this session; run the `change-impact` skill for a
   cross-module change. Capture the pattern to mirror for naming, error handling, threading,
   config and tests with `file:symbol`. If no similar code exists, say so.
3. **Classify** per `project/task-classification.md`; decide the ADR need; decide whether the
   tester runs RED first.
4. **Create the task file** from `core/templates/task.md` and fill every Plan field:
   touch list (disjoint from running tasks), numbered acceptance criteria each verifiable by
   a command, verification commands copied from `build-env.md`, out of scope, build line,
   model line.
5. **Present the Plan** to the human and stop.

End with: **WAITING FOR GATE 1** - approve / edit / different approach? Nothing is spawned
and no code is written until the approval line in the task file is filled.

## After approval

Continue with the `delegate-change` skill step 4: `/test red` (when the class calls for it),
then the implementer, `/test`, `/review`, the `verification-loop` skill, Gate 2.
