---
description: Restate requirements, assess risks, and create a step-by-step implementation plan grounded in this repo and its specs. WAIT for user CONFIRM before touching any code.
argument-hint: "[feature description | path/to/request.md]"
---

# Plan Command

**Request**: $ARGUMENTS

Create an implementation plan before writing any code. Run inline by default;
delegate to the `planner` agent only when the change is large or the user asks.
Follow `.claude/rules/docs-structure.md` (spec-first workflow).

## Input modes

| Input | Behavior |
|---|---|
| A request file (usually in the untracked `docs/_retired/`) | Read it as the request; never copy its text into a tracked file |
| Free-form text | Plan from the text |
| Empty | Ask what should be planned |

## Steps

1. **Restate requirements in the project's own words** (never quote the request
   verbatim); list assumptions and open questions.
2. **Ground the plan in the repo** — read `ONBOARD.md`, the relevant
   `docs/spec/*.md`, and the `README.md` of each affected module; capture the
   existing pattern to mirror, with `file:line`:

   | Category | What to capture |
   |---|---|
   | Spec | Which requirement IDs exist today and which this change touches |
   | Naming | File, class, function naming in the affected area |
   | Error handling | How failures are returned (rc / bool / signal) and logged |
   | Threading | Which Runner/thread owns the code path |
   | Config | How settings are serialized and verified (`verify()`) |
   | Tests | Which `tests/<name>` project covers it and its assertion style |

   If no similar code exists, say so — do not invent a pattern.
3. **Spec delta** — list each requirement to add / change / remove (with its ID).
   The spec is updated FIRST, and the owner reviews it before any code.
4. **Break the work into tasks** with exact files, dependencies, and risk.
5. **Verification**: which projects must build 32-bit, which QtTest cases to
   add/extend (naming the spec IDs they prove), whether the `laser_host` oracles
   must stay byte-identical, and what only the owner can confirm on the bench.
6. **Close-out**: the `CHANGELOG.md` entry, and an ADR if a project-wide
   decision is made.
7. **Present the plan and WAIT** for explicit confirmation.

## Plan format

```markdown
# Implementation Plan: {Feature}

## Requirements (restated)
- ...
## Decisions needed from the owner
- D1: ...   (plan-local IDs; code never cites them)
## Spec delta
| Spec file | Requirement ID | Add / Change / Remove | Summary |
## Patterns to mirror
| Category | Source | Pattern |
## Tasks
### T1: {name}
- Files: ...
- Action: ...
- Verify: {build/test that proves it}
- Risk: Low/Medium/High
## Verification
- Builds: ...
- Tests: ...
- Bench (owner): ...
## Close-out
- CHANGELOG: ...
- ADR: none / ADR Dn
## Risks
| Risk | Likelihood | Mitigation |
```

End with: **WAITING FOR CONFIRMATION** — proceed / modify / different approach?

## Important

Do **NOT** write or edit code until the user confirms. If the user asks for the
plan to be saved, write it to `docs/history/plan/` following the existing plan
files. Phase names belong only in `docs/history/`.

## After planning

- `/feature-dev` — spec first, then explorer → architect → implement → reviewer
- `/cpp-build` — fix build errors
- `/cpp-review` — review the finished change
