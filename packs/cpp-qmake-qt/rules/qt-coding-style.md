---
paths:
  - "**/*.cpp"
  - "**/*.h"
  - "**/*.hpp"
  - "**/*.pro"
  - "**/*.pri"
---
# C++ / Qt coding style (pack cpp-qmake-qt)

> Adapted from the ncr_picking and NichirinLaserMark rules (ECC rules/cpp, MIT, adapted).
> Match the surrounding code first; `.claude/project/rules.md` names the language level, the
> Qt version, the namespace and the naming convention, and wins over this file.

## Language level

- The project's standard (usually C++17) and nothing newer, whatever one compiler accepts.
- Qt types at Qt boundaries (`QString`, `QByteArray`, `QVector`/`QList`, `QHash`), the standard
  library inside pure logic, as the surrounding module does.
- `auto` when the type is obvious; `constexpr` constants; `enum class`.

## Ownership

- `QObject` parent/child ownership is the default (`new Foo(parent)` is legitimate); a
  `QObject` is owned by its parent or by exactly one smart pointer, never both.
- Non-`QObject` heap objects: `std::unique_ptr` / `std::make_unique`; `std::shared_ptr` only
  for real shared ownership.
- A raw pointer or `QPointer` is an observer, never an owner. `deleteLater()` for objects that
  may still receive events; never `delete` a `QObject` from another thread.

## Naming and files

- Follow the codebase: typically PascalCase types, camelCase functions and slots, `m_` members,
  `kPascalCase` constants, snake_case file names. Do not rename to match a guideline.
- Every new source, header, `.ui`, `.qrc` or test is registered in the owning module `.pri`
  (never a shell `.pro`) or its test `.pro`; a missing `Q_OBJECT` header in `HEADERS` is a
  link error, not a compile error.
- Includes are module-qualified from the source root; no `..` escapes; lower modules never
  include higher ones (an architecture-contract test may enforce it).

## Text, encoding, comments

- Code, comments and log strings in English; UI strings go through `tr()` and the
  translation files (exempt from the ASCII rule).
- Sources are ASCII (kit rule `03-language-ascii`); every `.pro` passes `/utf-8` on MSVC so a
  non-ASCII byte fails loudly (C4819) instead of mis-decoding on a code-page machine.
- Never rewrite a source through PowerShell `Get-Content | Set-Content` on a code-page machine
  (`encoding.codePage`); the `guard-shell` hook blocks it.
- Doxygen `///` on public symbols per the project's comment style; comments cite tracked
  repo content only.
- Formatting: no `.clang-format` in most Qt projects; keep the formatting of the file you edit.

## Build files

- No new absolute paths in `.pro`/`.pri`; machine paths come from the untracked local `.pri`
  (`packConfig.cpp-qmake-qt.localPri`) that the project includes.
- Dependency glue lives in dedicated `qmake/*_dependency.pri` files; Debug links need the `d`
  variants of third-party libraries.

## UI

- Structure in `.ui`, styling in `.qss`, colours and fonts through the theme tokens
  (`qss-theming.md`); no emoji or box drawing in UI text sources.
