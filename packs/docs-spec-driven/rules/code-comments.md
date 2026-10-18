---
paths:
  - "**/*.c"
  - "**/*.cc"
  - "**/*.cpp"
  - "**/*.cxx"
  - "**/*.h"
  - "**/*.hpp"
  - "**/*.hxx"
  - "**/*.inl"
  - "**/*.py"
  - "**/*.js"
  - "**/*.ts"
  - "**/*.cs"
  - "**/*.java"
  - "**/*.go"
  - "**/*.rs"
  - "**/*.cmake"
  - "**/CMakeLists.txt"
  - "**/*.pro"
  - "**/*.pri"
  - "**/*.ps1"
  - "**/*.bat"
  - "**/*.sh"
  - "**/*.ui"
  - "**/*.qss"
  - "**/*.qrc"
---
# Code comments cite only tracked repo content (pack docs-spec-driven)

Applies to every comment in code, scripts and build files, including Doxygen blocks and
`#` comments in build files. The `docs-gate` tool checks the mechanical part.

## Allowed references

- Other source files, classes, functions, tests (by path or symbol, never line numbers).
- Decision items in the ADR file, always with the prefix: `ADR D11`, never a bare `D11`.
- Spec requirements: the spec file and the ID (`docs/spec/qr_reader.md QR-012`, or the ID
  alone when the prefix is unique).
- `docs/rules/*`, module `README.md` files, `tests/README.md`.
- Vendor material tracked in the repo (a copied reference under the vendor directory):
  cite that copy, not an external URL.

## Forbidden references

- Plan phases and plan-local IDs: `phase N`, `Phase 12B`, `CP1`, `phase 10 D7`, plan or
  request file names. Plan history lives only under `docs/history/`, which code never cites.
- Requests and anything under the untracked requests directory.
- `.claude/`, memory folders, agents, models, sessions, tooling.
- Untracked or ignored paths (build output, release folders, scratch) and machine-local
  absolute paths, except where a build file genuinely needs a tool path supplied by the
  environment.
- External URLs. If a source matters, put a copy under the vendor directory or `docs/` and
  cite that.

## How to write the comment instead

Make it self-contained: state the behaviour, the constraint and why, in present tense. If
the why is a project-wide decision, cite `ADR Dn`; if it is a required behaviour, cite the
spec requirement. When removing a phase prefix from an old comment, rewrite the comment;
never just delete the prefix, because a leftover bare `Dn` silently points at the wrong
decision.
