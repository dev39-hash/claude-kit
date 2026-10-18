---
paths:
  - "**/*.cpp"
  - "**/*.h"
  - "**/*.hpp"
  - "**/*.ui"
  - "**/*.qrc"
  - "**/*.pro"
  - "**/*.pri"
  - "**/*.prf"
  - "**/*.bat"
  - "**/*.cmd"
  - "**/*.ps1"
  - "**/*.py"
---
# Code files are ASCII only (owner, 2026-10-14; docs/rules/design_rules.md 16.2)

- Every character you write into these files, comments included, is plain ASCII. Use the forms
  below instead of symbols:
  - dash: `--` or `-`;
  - arrow: `->`, `<-` or `=>`;
  - multiplication: `x`;
  - degrees: `deg`;
  - plus-minus: `+/-`;
  - quotes: `"` and `'`;
  - ellipsis: `...`;
  - no box-drawing lines, no emoji.
- A character the program must show goes into a string as an escape (`QChar(0x00B0)`, `u"\u00B0"`)
  or through the translation files, never as a literal.
- When you edit a line that already holds a non-ASCII character, make that line ASCII too. Do not sweep
  the rest of a file unless the handoff says so; backlog item 201 owns the sweep.
- Not covered: Markdown, `.ts`, `.qss`, and the vendored `components/qpb/`,
  `components/RobotKinematics/`, `3rdparty/`.
- `guard-edit.js` denies an edit or write that puts a non-ASCII character into these files.
