---
paths:
  - "**/*.cpp"
  - "**/*.cc"
  - "**/*.cxx"
  - "**/*.h"
  - "**/*.hpp"
  - "**/*.hh"
  - "**/*.inl"
  - "**/CMakeLists.txt"
  - "**/*.cmake"
---
# C++ coding style (pack cpp-cmake-gtest)

> Adapted from ECC `rules/common/coding-style.md` and `rules/cpp/coding-style.md`
> (affaan-m/ECC, MIT). Project naming, error strategy and mutation policy come from
> `.claude/project/rules.md`, which wins over this file.

## Principles

- **KISS**: the simplest solution that works; measure before optimising (`cpp-performance.md`).
- **DRY**: merge near-identical overloads and copy-pasted loops when you touch them; introduce
  an abstraction when the repetition is real, not speculative.
- **YAGNI**: no feature, flag or extension point before a user exists.

## Files

- 200-400 lines typical, 800 lines as the soft ceiling; split a reference file that is larger
  when porting (one stage per file).
- One class per header; header name is the class name in the project's file-name style.
- Organise by feature, not by type. Public headers under the project's include root include
  only the libraries the project allows (`project/rules.md`).

## Language level

- The project's standard (`project/rules.md`, usually C++17) and nothing newer, even when
  one compiler would accept it. `std::void_t` + `static_assert` instead of concepts;
  no `<format>` before every target compiler ships it.
- `constexpr` constants, never `#define` (include guards excepted); `enum class`;
  `auto` only when the type is obvious from the right-hand side.
- Structured bindings, `std::optional`, `std::string_view` where they clarify.

## Resources

- RAII everywhere; no manual `new`/`delete`/`malloc`. `std::unique_ptr` for exclusive
  ownership, `std::shared_ptr` only for real sharing (documented).
- Aligned or raw buffers live inside one RAII owner type with the Rule of Five in one place.
- Shallow-copy types (`cv::Mat`-like): say in the comment whether a copy shares or clones.

## Errors

- Library code never calls `exit()` and never prints to `std::cout`/`std::cerr`; it reports
  through the project's logging interface.
- Expected failures return a result type (`bool` + out-param, `std::optional`, a result
  struct with a message) and are documented; programming errors are preconditions checked
  with `assert` (or the project's assert) and documented.
- Exceptions only for truly exceptional conditions; never `catch (...)` without a log;
  `noexcept` on moves, destructors and swaps.
- Validate once at the library boundary: sizes, types, ranges, schema versions, NaN.

## Headers and formatting

- `#pragma once` unless `project/rules.md` says `#ifndef` guards.
- Self-contained headers: include what you use, forward-declare where possible; never
  `using namespace` at global scope in a header.
- Keep the style of the file you edit. Run the formatter only when the repo has a
  `.clang-format` (the kit's `format` hook does it); never reformat unrelated lines.
- Doxygen on every public symbol: `/** */` blocks or `///` one-liners in headers,
  plain `//` in sources; comments say why, not what; document in-place mutation
  (`@param[in,out]`).

## Smells

- Nesting deeper than 4: early returns. Functions over ~50 lines: split or justify.
- Magic numbers: named `constexpr` or a config field.
- Boolean names that do not read as claims (`isLearned()`, `hasRoi()`).
- Copy-pasted overloads that drift apart.
