---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.cc"
  - "**/*.hh"
  - "**/*.cxx"
  - "**/*.h"
  - "**/CMakeLists.txt"
  - "**/*.cmake"
---
# C++ Coding Style

> Adapted from ECC (affaan-m/ecc, MIT), with the naming and layout taken from this codebase.

## Language level

- C++17 only (`CMAKE_CXX_STANDARD 17`, extensions off). No concepts, no `<format>`, no ranges;
  detection traits (`std::void_t`) and `static_assert` replace concepts.
- `constexpr` / `static constexpr` for constants, never `#define` (include guards excepted).
- Prefer `enum class`; a value set that is "closed" is an enum, never an int or a string.
- `auto` only when the type is obvious from the right-hand side.

## Naming (derived from `include/ctrl_kernel/` and `examples/localization_core/`)

- Types, enums and enum values: `PascalCase` (`RoleHealth`, `Phase::AwaitTriggerFall`).
- Functions and methods: `camelCase` (`readinessImpl`, `isLatched`); event handlers are
  overloads named `on(const SomeEvent &, Effects &)`.
- Struct fields and locals: `camelCase`, no prefix. Private members of a class: `m_` prefix.
- Constants: `kName` (`kRoleCount`). Namespaces: lower case (`ctrl`, `ctrl::loc`, `ctrl::qt`).
- Pointer and reference sigils bind to the name: `const State &s`, `Role *r`.

## Headers

- Include guard `#ifndef DIR_FILE_H`, not `#pragma once`. Include with quotes and the
  namespace path: `"ctrl_kernel/ids.h"`, `"localization_core/state.h"`.
- Self-contained: include what you use. No `using namespace` in a header.
- The kernel (`include/ctrl_kernel/`) includes only the standard library; the example core adds
  only the kernel; only `qt/` may include Qt.
- Every public symbol has Doxygen (`/** */` for blocks, `///` for one-liners, `///<` for
  fields). `.cpp` files use plain `//`. Comments say why, not what.

## Text and format

- ASCII only in every file, comments included: write `->` and `--`, never arrow or dash glyphs.
- 4-space indent, about 100 columns. A function body's `{` goes on its own line (Qt style);
  `if`/`for`/`switch` and type bodies keep it on the same line.
- One handler or helper does one thing; a function over ~50 lines is split.
- If a `.clang-format` exists, run it; do not reformat unrelated lines in a diff.

## Do not

- Add a behaviour constant in a handler body (law L9: numbers live in `Policy`).
- Add a `bool m_flag` to State outside a block (see `docs/controller_kernel.md` section 12).
