---
name: architecture-decision-records
description: Capture architectural decisions as numbered ADR files in .claude/docs/adr/ (context, decision, alternatives, consequences, amendments) with an index README. Use when the human says "record this decision" or "ADR this", when a task changes a public API, contract, schema, wire format or dependency, when alternatives are weighed, or when someone asks why the codebase is shaped this way.
metadata:
  origin: ECC architecture-decision-records (MIT), adapted to the kit layout
---

# Architecture decision records

ADRs live in `.claude/docs/adr/` (never in the repo tree) unless a pack redirects them
(`docs-spec-driven` keeps them as `Dn` items in a tracked file; its rule wins). The template is
`.claude/core/templates/adr.md`.

## When an ADR is required

Before Gate 1 of any task that changes a public API, a contract, a schema or file format, a
wire name, a config key's meaning, a dependency or language level, a build target or option,
or anything `project/rules.md` lists under "ADR triggers". Not required for a new handler
row, a default value, a private rename, formatting.

## When to activate

- "record this decision", "ADR this", "we decided to ...", "the reason we do X instead of Y".
- Comparing two libraries, patterns or layouts and reaching a conclusion.
- "why did we choose X?" -> read mode.
- A reviewer finding `contract change without an ADR`.

## Workflow: write

1. **First time only**: if `.claude/docs/adr/` does not exist, ask before creating it with
   `README.md` (index header below) and a copy of the template.
2. Identify the decision in one sentence; gather the context (problem, constraints, forces).
3. List the alternatives that were really considered, each with pros, cons and why not.
4. State consequences honestly: positive, negative, risks with mitigation.
5. Number it: highest existing `NNNN` + 1. File name `NNNN-short-title.md`.
6. Show the draft to the human. Write the file only after explicit approval; if declined,
   discard it.
7. Add the index row and link the task (`Task: T-xxx`). Record `decisions.md` one-liner at
   task close.

## Workflow: amend or supersede

- Small correction: append `### Amendment N (date, reason): <title>`; never rewrite the
  original text.
- Replacement: write a new ADR, set the old one to `superseded by ADR-NNNN`, link both ways.
- Status lifecycle: `proposed -> accepted -> deprecated | superseded`.

## Workflow: read

"Why did we choose X?": scan `.claude/docs/adr/README.md`, read the matching file, present
Context and Decision. No match: "No ADR records that; record one now?"

## Index format (`.claude/docs/adr/README.md`)

```markdown
# Architecture decision records

Not tracked in git. Format and workflow: the `architecture-decision-records` skill.
Copy `template.md` to `NNNN-short-title.md`, then add a row here.

| ADR | Title | Status | Date |
|---|---|---|---|
| [0001](0001-short-title.md) | <title> | accepted | YYYY-MM-DD |
```

## What makes a good ADR

- Specific ("use `cv::FileStorage` JSON", not "use a serializer"); the why over the what.
- Rejected alternatives recorded; "we just picked it" is not a rationale.
- Readable in two minutes; context under ten lines; present tense.
- Trivial choices (naming, formatting) do not get an ADR.
- A backfilled decision carries its original date.
- Tracked repo docs never cite ADR numbers (rule 02-repo-hygiene); they state the resulting
  behaviour in their own words.
