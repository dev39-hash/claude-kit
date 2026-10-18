# WP-xx review record

- **Branch:** `<branch>` (base `<sha>`) - **Reviewed:** <date>
- **Reviewer verdict:** APPROVE | WARN | BLOCK (`/review-wp`, model `<models.reviewer>`)
- **Artefact review:** APPROVE | WARN | BLOCK | not requested (`wp-reviewer`)

## Findings and the leader's check

| # | Severity | Location | Finding | Leader verified in code | Action |
|---|---|---|---|---|---|
| 1 | BLOCK/HIGH/MEDIUM/LOW | `file:symbol` | <...> | confirmed / not reproduced | fixed in <sha> / returned / accepted: <reason> |

## Report claims

- <claim> - checked | contradicted (<evidence>) | not checkable by reading

## Scope

- Files outside the touch list: none | <list with the report's justification or "unjustified">

## Leader verify

- Whole-tree build / full suites / gates: <results, commands>
- Touch list: clean | <...>
- Negative check tried by the leader: <...> | not needed because <...>

## Decision

- **merge `--no-ff`** at `<merge sha>` | **returned** with findings #<...> | **deviation recorded**: <...>
- Human gate: <delegated per project/rules.md | approved <date>>
- Distilled to `decisions.md` / `lessons.md`: <...> | nothing
