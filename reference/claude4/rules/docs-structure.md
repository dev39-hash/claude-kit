# Docs structure: spec-driven, history kept apart

Owner decisions (2026-10-07). Read with `repo-boundaries.md` and `code-comments.md`.

## Who owns what

| Doc | Answers | Location |
|---|---|---|
| Spec | What the system MUST do now — requirements with stable IDs, invariants, config keys, acceptance (which test proves it) | `docs/spec/<capability>.md`, one file per capability (not per phase) |
| Charter | Why the project exists, scope, stakeholders (English) | `docs/spec/` (charter file) |
| Module `README.md` | How the code is organized; invariants for whoever edits that module | `src/<module>/`, `laser_host/` |
| ADR | Why a project-wide choice was made | `docs/architecture/architecture_decisions.md` (`ADR Dn`) |
| Rules / runbooks | How to build, test, diagnose | `docs/rules/` |
| Manual | How an operator uses the machine | `docs/manual/` |
| Changelog | What changed, by version/date, in a few lines each | `CHANGELOG.md` |
| Backlog | Open defects, gaps, owner decisions and doc drift not yet planned — one line each (`BL-nnn`), pointing at the detail (usually a spec's §6) | `docs/backlog.md` |
| Plans + history | How and when each change was made | `docs/history/` |

State each fact once, in its owner; other docs point to it.

## Phase boundary

- Plan/request **phase** names (`phase N`, `CP1/CP2`, plan-local `Dn`) appear
  ONLY inside `docs/history/`.
- Everything describing the current system — code, scripts, specs, module
  READMEs, `docs/rules/`, `docs/README.md`, `README.md`, `ONBOARD.md`,
  `tests/README.md`, `uml/README.md` — never mentions phases. Use dates or
  changelog versions for "when".
- `CHANGELOG.md` and ADR entries MAY link to a plan file as provenance; their
  text must still read without knowing any phase number.
- The domain word "phase" for machine states (Idle/Commission/Runtime/Recovery)
  is unaffected.

## Requests

- Owner requests are NOT tracked: they live in `docs/_retired/` (ignored via
  `.git/info/exclude`). Tracked docs never link to them.
- A plan restates the requirements **in the project's own words** — never quotes
  a request verbatim.

## Workflow for a new requirement

1. Request — owner writes it (untracked), or the owner picks a `docs/backlog.md` item.
2. Plan — `docs/history/plan/`: restated requirements, decisions, tasks, and the
   list of spec requirement IDs to add or change.
3. Spec first — update `docs/spec/`; the owner reviews the spec delta before code.
4. Code + tests — tests may name spec IDs; comments follow `code-comments.md`.
5. Close — `CHANGELOG.md` entry, plan marked closed, ADR if a project-wide
   decision was made, backlog row deleted (IDs never reused) and the spec's §6
   updated.

A defect or gap found along the way that is not fixed in the current change goes
into `docs/backlog.md` (and the owning spec's §6), never into a new standalone
bug file.

## Writing specs

- Describe behaviour as built and verified (code + tests + bench results), not
  as originally requested — several requests were corrected on the bench.
- Requirement IDs are stable and never reused (e.g. `QR-012`); a removed
  requirement is marked removed, not renumbered.
- English, like all tracked docs.
