# Docs structure: spec-driven, history kept apart (pack docs-spec-driven)

Always loaded when the pack is installed. The repository carries the project's own record:
specs with stable requirement IDs, a decision file, a backlog, a changelog and the plan
history. Read with `repo-boundaries.md` and `code-comments.md`. Paths below are the defaults
of `packConfig.docs-spec-driven` in `kit.config.json`; the project may move them.

## What this pack changes in the core

Core rule `02-repo-hygiene.md` keeps every plan and decision record under `.claude/`. With
this pack:

- Decisions are tracked: `<adrFile>` holds numbered items `### Dn - <title>`; code and docs
  cite them as `ADR Dn`. `.claude/docs/adr/` is not used.
- Plans are tracked under `<plansDir>`, written in the project's own words with no agent,
  model, session or tool vocabulary; phase names live there and nowhere else.
- The docs gate is `node .claude/tools/docs-spec-driven/docs-gate.js` (the `/docs-gate`
  command), run in the leader's verification loop in place of the core grep.

Everything else in the core rules still applies: no `.claude` references, no AI or agent
vocabulary in tracked text, English, ASCII in code and repo markdown.

## Who owns what

| Doc | Answers | Location (default) |
|---|---|---|
| Spec | What the system MUST do now: requirements with stable IDs, invariants, config keys, acceptance (which test proves it) | `docs/spec/<capability>.md`, one file per capability, never per phase |
| Charter | Why the project exists, scope, stakeholders | `docs/spec/project_charter.md` |
| Module `README.md` | How the module is organized; invariants for whoever edits it | `<module>/README.md` |
| ADR | Why a project-wide choice was made | `docs/architecture/architecture_decisions.md` (`ADR Dn`) |
| Rules and runbooks | How to build, test, diagnose | `docs/rules/` |
| Manual | How an operator uses the product | `docs/manual/` |
| Changelog | What changed, by version or date, a few lines each | `CHANGELOG.md` |
| Backlog | Open defects, gaps, pending decisions and doc drift not yet planned, one line each (`BL-nnn`) pointing at the detail | `docs/backlog.md` |
| Plans and history | How and when each change was made | `docs/history/plan/`, `docs/history/` |

State each fact once, in its owner; other docs point to it.

## Phase boundary

- Plan phase names (`phase N`, `Phase 12B`, `CP1`/`CP2`, plan-local `Dn`) appear only inside
  `<historyDir>`.
- Everything that describes the current system (code, scripts, build files, specs, module
  READMEs, `docs/rules/`, root and `docs/` READMEs, `tests/README.md`) never mentions a
  phase. Say "when" with a date or a changelog version.
- `CHANGELOG.md` and ADR items may link a plan file as provenance; their text still reads
  without knowing any phase number.
- A domain word "phase" (machine states, signal phases) is not a plan phase; the docs gate
  flags only numbered plan phases.

## Requests

- The human's requests are not tracked: they live in `<requestsDir>` (ignored through
  `.git/info/exclude`, never through `.gitignore`). Tracked docs never link to them.
- A plan restates the requirements in the project's own words and never quotes a request
  verbatim. Specs describe behaviour as built and verified, not as originally requested.

## Workflow for a new requirement (skill `spec-first`)

1. Request: the human writes it (untracked) or picks a `BL-nnn` row.
2. Plan: a file in `<plansDir>` from `templates/plan-history.md`: restated requirements,
   decisions needed, tasks, and the list of spec requirement IDs to add, change or remove.
3. Spec first: update `<specDir>`; the human reviews the spec delta before any code.
4. Code and tests: tests may name spec IDs; comments follow `code-comments.md`.
5. Close: `CHANGELOG.md` entry; plan marked closed; ADR item if a project-wide decision was
   made; backlog row deleted (IDs never reused); the spec's open-questions section updated.

A defect or gap found on the way and not fixed in the current change goes into the backlog
and the owning spec's open-questions section, never into a new standalone bug file.

## Writing specs (template `spec.md`)

- One file per capability; sections: purpose, requirements, invariants, config keys,
  acceptance (requirement -> test), open questions and known drift (section 6).
- Requirement IDs `<PREFIX>-nnn` are stable and never reused; a removed requirement keeps
  its ID and is marked `(removed <date>)`, never renumbered.
- During a plan a delta is marked `(new)`, `(changed)`, `(removed)` next to the ID; the
  markers are dropped at close-out.
- English, like every tracked doc.
