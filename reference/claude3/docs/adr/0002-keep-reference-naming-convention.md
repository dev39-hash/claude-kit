# ADR-0002: Keep the reference code's naming convention

**Date**: 2026-10-13
**Status**: accepted (with plan rev 3, 2026-10-13)
**Deciders**: project owner

## Context

The ECC `cpp-coding-standards` skill and the C++ Core Guidelines (NL.10) recommend
`underscore_style` for functions and `trailing_underscore_` for members. The reference
module consistently uses PascalCase types, camelCase methods, `m_`-prefixed members and
`k`-prefixed constants, and its public API is already familiar to the team.

## Decision

We keep the reference convention for the new library: PascalCase types, camelCase
functions/methods, `m_camelCase` members, `kPascalCase` constants, snake_case file names.
This is recorded in `.claude/rules/project.md` and overrides the ECC rule and skill text.

## Alternatives Considered

### Alternative 1: Adopt Core Guidelines underscore_style
- **Pros**: matches the installed skill verbatim; common in open-source C++
- **Cons**: every ported identifier changes, turning a port into a rewrite; diff against the
  reference becomes useless for review
- **Why not**: review safety during the port matters more than style purity

### Alternative 2: Mixed (new code underscore, ported code camelCase)
- **Pros**: no renames in ported code
- **Cons**: two styles in one public API
- **Why not**: inconsistency in a library API is worse than either style

## Consequences

### Positive
- Ported files diff cleanly against `reference_source/`
- No API churn for the existing host application

### Negative
- Deviates from the Core Guidelines digest in the skill; reviewers must know the override

### Risks
- Tooling defaults (clang-tidy readability-identifier-naming) must be configured to this
  convention or disabled; otherwise noise
