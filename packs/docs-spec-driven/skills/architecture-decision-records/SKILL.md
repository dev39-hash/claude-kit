---
name: architecture-decision-records
description: Record project-wide decisions as numbered items (### Dn - title) in the tracked decision file (docs/architecture/architecture_decisions.md) with context, decision, alternatives and consequences; cite them from code and docs as "ADR Dn". Use when the human says "record this decision" or "ADR this", when a task changes a public API, contract, schema, wire format, dependency or build target, when alternatives are weighed, or when someone asks why the codebase is shaped this way.
metadata:
  origin: ECC architecture-decision-records (MIT) workflow, re-targeted to a single tracked decision file (pack docs-spec-driven); replaces the core skill of the same name
---

# Architecture decision records (pack docs-spec-driven)

Decisions are tracked in ONE file, `<adrFile>` (default
`docs/architecture/architecture_decisions.md`), as numbered sections. Nothing is written to
`.claude/docs/adr/`, and no `docs/adr/` directory is created. Config:
`packConfig.docs-spec-driven.adrFile`, `adrPrefix` (default `D`). Item template:
`templates/adr-item.md`.

## When an item is required

Before Gate 1 of any task that changes a public API, a contract, a schema or file format, a
wire name, a config key's meaning, a dependency or language level, a build target or option,
the docs layout itself, or anything `project/rules.md` lists under "ADR triggers". Not for
a new handler row, a default value, a private rename, formatting. Plan-local decisions
(`D1, D2` inside a plan file) stay in that plan; only project-wide decisions go into the
decision file.

## When to activate

- "record this decision", "ADR this", "we decided to ...", "the reason we do X instead of Y".
- Comparing two libraries, patterns or layouts and reaching a conclusion.
- "why did we choose X?" -> read mode.
- A reviewer finding `contract change without an ADR`.

## Workflow: write

1. First time only: if the file does not exist, ask before creating it from the template's
   header (title, how to cite, the item format). Create its directory if needed.
2. Find the highest existing `### D<n>`; the new item is `D<n+1>`. Numbers are never reused,
   even if an item was later removed; a gap is a record.
3. Draft `### D<n+1> - <title> (<YYYY-MM-DD>)` in the style of its neighbours: Context,
   Decision, Alternatives considered (each with why not), Consequences (positive, negative,
   risks), Status. Present tense, specific, readable in two minutes.
4. Show the draft to the human. Append it to the file only after explicit approval; if
   declined, discard it. Append at the end of the section the file's header prescribes (by
   default, chronological at the end).
5. Record the ID in the task file (`ADR: ADR D14`) and, at close, in `CHANGELOG.md` when the
   decision is visible to users.

## Workflow: amend or supersede

- Never renumber, reorder or rewrite an existing item. A small correction is an
  `Amendment (<date>): ...` paragraph at the end of the item.
- To replace a decision, write a new item that names the one it replaces, and add
  `Status: superseded by D<new>` to the old one.
- Status values: `proposed`, `accepted`, `deprecated`, `superseded by Dn`.

## Workflow: read

"Why did we choose X?": search `<adrFile>` first, then the plan files under `<plansDir>`
(they record plan-local decisions). Present the Context and Decision of the matching
items. No match: "No decision records that; record one now?"

## Citing

- Code comments and tracked docs cite `ADR D11` with the prefix, never a bare `D11`
  (`code-comments.md`); the docs gate checks that every cited `ADR Dn` exists.
- A spec requirement that exists because of a decision names it in its text.
- `.claude/` files (task files, lessons) may cite the same IDs.

## What makes a good item

- Specific ("use `QSettings` INI format", not "use a settings library"); the why over the what.
- The alternatives that were really considered, each with why not; "we just picked it" is
  not a rationale.
- Consequences stated honestly, including what becomes harder.
- A backfilled decision carries its original date in the heading.
- Trivial choices (naming, formatting) do not get an item.
