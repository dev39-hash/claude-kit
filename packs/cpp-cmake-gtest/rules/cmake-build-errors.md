---
paths:
  - "**/CMakeLists.txt"
  - "**/*.cmake"
---
# CMake, MSVC, GCC and Clang build errors (pack cpp-cmake-gtest)

> Error table for the `build-resolver` agent (read it explicitly when fixing a build); also
> loaded when a CMake file is edited. Adapted from the ECC `cpp-build-resolver` agent (MIT)
> and two earlier CMake project adaptations.

## Working rules

- First error first; later errors usually cascade. One fix, rebuild, confirm, next.
- Never weaken diagnostics: no `#pragma warning(disable)`, `/wd`, `-Wno-`, `NOLINT`, no
  lowering `/W4`, no removing `/WX` or `-Werror`. `_CRT_SECURE_NO_WARNINGS` and similar
  defines need the human's approval.
- Never change a public signature, a contract or the language standard unless the error
  forces it; say so in the report.
- A design-level fix (new dependency, new target layout, interface change) is out of scope
  for the resolver: stop and report.

## MSVC (all fatal under /WX)

| Code | Cause | Fix |
|---|---|---|
| C4100 unreferenced parameter | unused argument | omit the name (`const Stop &`) or `[[maybe_unused]]` |
| C4244 / C4267 conversion, possible loss | `size_t`/`int64` -> `int`, `double` -> `int` | `static_cast` at the boundary or use the wider type; round explicitly for coordinates |
| C4456 / C4457 / C4458 / C4459 shadowing | inner name hides a local / parameter / member / global | rename the inner one (a parameter named like an `m_` member is C4458) |
| C4127 conditional expression is constant | `while (true)`, constant `if` | `if constexpr` or restructure |
| C4702 unreachable code | code after `return` or an exhaustive `switch` | remove it; no pragma |
| C4189 local initialised but not used | dead variable | remove or use it |
| C4996 deprecated CRT | unsafe C API | use the C++ equivalent |
| C4819 file contains a character that cannot be represented | non-ASCII byte in a source | rewrite the line in ASCII (rule `03-language-ascii`); do not add `/utf-8` to hide it unless the project already uses it |
| C2039 / C2065 not a member / undeclared | missing include, typo, wrong namespace | add `#include` or qualify |
| C2672 / C2893 / C2784 no matching overload / template | wrong argument types, `std::visit` missing an overload | add the overload or fix the types |
| C2027 / C2079 undefined type | forward declaration where the full type is needed | include the header |
| C2338 / `std::get` on a variant | alternative not in the variant | add it to the variant |
| C1083 cannot open include | wrong include path, missing `target_include_directories` | fix the path; includes are project-root relative |
| LNK2019 unresolved external | `.cpp` not in the target, library not linked, missing `inline` | add to `add_library` / `target_link_libraries`; `inline` or move to a `.cpp` |
| LNK2005 already defined | non-inline function defined in a header | mark `inline` or move it |
| LNK1104 cannot open file | library path wrong, or the exe is running | fix the path; a running test exe: stop and tell the human (never kill `processes.neverKill`) |
| LNK2038 mismatch detected | Debug/Release or runtime library mix | link the matching variant (`d` suffix) |

## GCC / Clang

- `-Wshadow`: same as C4456-C4459; rename, never disable.
- `-Wpedantic`: no extra `;`, no VLAs, no GNU extensions (extensions are OFF), no C++20
  designated initialisers in a C++17 build.
- `-Wunused-parameter` = C4100; `-Wsign-compare` = C4018; `-Wconversion` = C4244.
- A missing `<cstdint>`, `<utility>`, `<variant>`, `<algorithm>` often breaks one compiler
  only: include what you use.

## CMake

| Symptom | Cause | Fix |
|---|---|---|
| `Could not find a package configuration file` | `find_package` without `<Pkg>_DIR` | pass `-D<Pkg>_DIR=...` from the environment / cache, never hard-code in `CMakeLists.txt` |
| `No CMAKE_CXX_COMPILER could be found` | wrong generator or no toolchain on PATH | pass `-G` (`packConfig.cpp-cmake-gtest.generator`) or run from the toolchain prompt |
| cache holds the wrong option | a previous task configured the slot differently | re-run configure with every option explicit |
| `gtest_discover_tests` finds nothing | the test exe did not link or run | build the test target first; run the exe by hand once |
| stale 0-byte `.obj` after an interrupted build (LNK1136) | interrupted compile | delete 0-byte objects in the build dir, rebuild |
| multi-config generator ignores `CMAKE_BUILD_TYPE` | MSVC generators are multi-config | pass `--config <cfg>` to build and `-C <cfg>` to ctest |

## Stop conditions

Same error after 3 attempts; a fix adds more errors than it removes; the fix needs an
architectural change, a new dependency or a tool that is not installed.
