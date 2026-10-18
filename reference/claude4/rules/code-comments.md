---
paths:
  - "**/*.cpp"
  - "**/*.h"
  - "**/*.pro"
  - "**/*.pri"
  - "**/*.ps1"
  - "**/*.bat"
  - "**/*.ui"
  - "**/*.qss"
  - "**/*.qrc"
---
# Code comments may only point at tracked repo content

Owner rule (2026-10-07). Applies to every comment in code, scripts, and build
files — including Doxygen `/** */` blocks and `.pro`/`.pri` `#` comments.

## Allowed references

A comment may mention or point to **only files tracked in this repo, or their
content**:

- Other source files, classes, functions, tests (`tests/<name>`).
- ADR entries in `docs/architecture/architecture_decisions.md`, always written
  with the prefix: **`ADR D11`** — never a bare `D11`.
- Spec requirements in `docs/spec/` (by spec file + requirement ID).
- `docs/rules/*`, module `README.md` scope cards, `tests/README.md`.
- Vendor material tracked under `components/` (e.g. the MarkEzd DLL reference) —
  cite that copy rather than an external URL.

## Forbidden references

- **Plan/request phases**: no `phase N`, `Phase 12B`, `CP1`/`CP2`, plan-local
  decision IDs (`phase 10 D7`), plan or request file names. Plan history lives
  only in `docs/history/`, which code never cites.
- Requests and anything under `docs/_retired/` (untracked).
- `.claude/`, the Claude memory folders, or any agent/tooling.
- Untracked or ignored paths (`build/`, `product_release/`, scratch folders) and
  machine-local absolute paths, except where a build file genuinely needs a
  tool path supplied by the environment.
- External URLs — if a source matters, put a copy under `components/` or `docs/`
  and cite that.

## How to write the comment instead

Make it self-contained: state the behaviour, the constraint, and **why**, in
present tense. If the "why" is a project-wide decision, cite `ADR Dn`; if it is
a required behaviour, cite the spec requirement. Never just delete a phase
prefix — a leftover bare `Dn` silently points at the wrong ADR.
