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

> From ECC (`affaan-m/ecc`, MIT), extends [common/coding-style.md](../common/coding-style.md).
> Naming section replaced by the project convention in `../../project.md`.

## Modern C++ (C++17 baseline, C++20 where MSVC 2022 and GCC 12 both support it)

- Prefer modern C++ features over C-style constructs
- Use `auto` when the type is obvious from context (iterators, `make_unique`), not for
  `cv::Mat` vs `cv::UMat` or integer widths
- Use `constexpr` for compile-time constants; no `#define` constants
- Use structured bindings and `std::optional`/`std::string_view` where they clarify
- Do not use `<format>` yet: it needs `/std:c++20` on MSVC and GCC 13+; use `fmt` or streams

## Resource Management

- RAII everywhere; no manual `new`/`delete`
- `std::unique_ptr` for exclusive ownership; `std::shared_ptr` only where ownership is really
  shared (`MatchGroup` patterns are shared with the host today; keep that but document it)
- Aligned SIMD buffers live inside an RAII owner (`AlignedBuffer`), never loose pointers
- `cv::Mat` is already ref-counted: be explicit about `clone()` vs shallow copy in comments

## Naming

See `../../project.md`: PascalCase types, camelCase functions, `m_` members, `k` constants.

## Formatting

- `clang-format` with the repo `.clang-format` (LLVM base, 4-space indent, 100 columns,
  `cv::Mat& img` left-aligned references)
- The `format-cpp.js` hook formats edited files automatically when clang-format is found;
  otherwise format by hand to the same style

## Headers

- `#pragma once`
- Self-contained: include what you use, forward-declare where possible
- Never `using namespace` at global scope in a header
- Public headers under `include/mtc/` include only OpenCV and the standard library

## Reference

See skill `cpp-coding-standards` for the full C++ Core Guidelines digest.
