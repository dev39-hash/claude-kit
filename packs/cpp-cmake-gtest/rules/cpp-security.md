---
paths:
  - "**/*.cpp"
  - "**/*.cc"
  - "**/*.cxx"
  - "**/*.h"
  - "**/*.hpp"
  - "**/*.hh"
---
# C++ security and memory safety (pack cpp-cmake-gtest)

> Adapted from ECC `rules/common/security.md` and `rules/cpp/security.md` (MIT), kept to what
> applies to a native library. `project/rules.md` may add exceptions (for example which single
> RAII type may call an aligned allocator).

## Before any commit

- No secrets, licence keys or absolute user paths in tracked files.
- Every external input validated once at the boundary (for example sizes and types, region
  bounds, config ranges, schema versions, string lengths, frame checksums, indices from a
  message).
- No allocation whose size comes unbounded from file or wire content.
- Paths read from configs never escape their intended directory.
- No `system()`, `popen()` or shell-outs in library code.
- Error messages do not leak internal paths to end users.

## Memory safety

- No raw `new`/`delete`; no C arrays (`std::array`, `std::vector`); no `strcpy`, `strcat`,
  unbounded `sprintf`.
- `malloc`/`free`/aligned allocators only inside the one RAII owner `project/rules.md` names.
- `reinterpret_cast` only in SIMD load/store helpers or at an SDK boundary, with a comment on
  alignment and layout; no C-style casts.
- Every member initialised at its declaration.
- Bounds: `.at()` or an explicit check on every index that comes from a config, a file, a
  message or another object (layer or role indices, counts against buffer sizes, regions
  against their parent).

## Undefined behaviour

- No signed overflow on index math (`size_t` or `int64_t` for large counts).
- No reading uninitialised memory (a buffer is written before it is read).
- No dangling views after the parent was resized, cleared or moved; no pointer or reference
  into a container or a state object kept across a call that may mutate it.
- Threads: no shared mutable state in a parallel region without a reduction or a critical
  section; results independent of the thread count.

## Untrusted data

Documents, images, frames and anything read from disk, a device or a socket are untrusted:
reject unknown versions, clamp sizes, fail with a result value, never with UB and never with
a silent default.

## Sanitizers and analysis

Run the regression suite under ASan (and UBSan where available) at least once per release
(`cmake-build` skill names the option). Static analysis (clang-tidy, cppcheck, `/analyze`)
when the tool exists; a missing tool is reported as `SKIPPED`, never as a pass.
