---
name: architecture-decision-records
description: Capture architectural decisions for controller-kernel as numbered ADR files in .claude/docs/adr/ (never in the repo tree) with context, alternatives, consequences and an index. Use when a change touches one of the five contracts, a law, a block's value set, core_traits, public namespaces or CMake targets, or adds a dependency; when someone says "record this decision" or "ADR this"; or when asking why the kernel is shaped this way.
metadata:
  origin: Adapted from ECC (affaan-m/ecc, MIT)
---

# Architecture Decision Records

Decisions live in `.claude/docs/adr/`, outside the repository sources, so the design process
stays out of the library. Index: `.claude/docs/adr/README.md`; blank form:
`.claude/docs/adr/template.md`.

## What needs an ADR in this project

| Change | Why |
|---|---|
| One of the five contracts (Core, Adapter, Executor, Shell, TimerService) | every controller depends on it |
| A law (L1..L12) added, dropped, reworded or given an exception | the laws are the guarantees |
| A state block's value set or invariants (`Lifecycle`, `Job`, `RoleHealth`, `Latch`, `FaultRegister`, `EdgeInput`, `Timers`) | cores compose them |
| `core_traits.h` / the required core shape | all cores must still satisfy it |
| Public namespaces (`ctrl`, `ctrl::loc`, `ctrl::qt`) or CMake targets / options | consumers link against them |
| Adding a dependency (any library, Qt version floor, C++ standard raise) | the kernel is standard-library only |
| A wire name policy (L12) such as fault code ranges or display names | stable by contract |

Not worth an ADR: a new event or handler row inside one core, a policy default, renames
inside a private scope, formatting.

## Format

```markdown
# ADR-NNNN: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: proposed | accepted | deprecated | superseded by ADR-NNNN
**Deciders**: [decision makers]

## Context
[2-5 sentences: situation, constraints, forces]

## Decision
[1-3 sentences, present tense]

## Alternatives Considered
### Alternative 1: [Name]
- **Pros**: ... **Cons**: ... **Why not**: ...

## Consequences
### Positive / ### Negative / ### Risks
```

## Workflow

1. If `.claude/docs/adr/` is missing, create it with `README.md` (index table) and
   `template.md` only after the request is confirmed.
2. Extract the decision, the constraints, and at least one rejected alternative.
3. Number it: scan the directory, take the highest `NNNN` plus one.
4. Show the draft; write `.claude/docs/adr/NNNN-short-title.md` only after approval.
5. Add a row to the index in `README.md`.
6. When superseding, set the old ADR's status to `superseded by ADR-NNNN` and link both ways.

To answer "why is it like this?": read the index, open matching ADRs, quote Context and
Decision. If none match, say so and offer to record one.

## Good ADRs

- Specific and short (readable in two minutes; Context under ten lines)
- Record the why and the rejected alternatives; state costs honestly
- Present tense ("The core owns no timer"); backfilled decisions keep their original date
- Link the law or contract section affected (`docs/controller_kernel.md` section number)

## Lifecycle

`proposed -> accepted -> [deprecated | superseded by ADR-NNNN]`

## Integration

- `controller-reviewer`: flag a diff that changes a contract, law, block or dependency
  without an accepted ADR.
- `kernel-implementer`: stop and ask for an ADR before such a change.
