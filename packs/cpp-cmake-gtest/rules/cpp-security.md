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
- Every external input validated once at the boundary: image size and type, region bounds,
  config ranges, schema version, string lengths, frame checksums.
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
- Bounds: layer and pyramid indices, point counts vs buffer sizes, regions vs images; `.at()`
  or an explicit check on any index that comes from a config or a file.

## Undefined behaviour

- No signed overflow on index math (`size_t` or `int64_t` for pixel counts).
- No reading uninitialised buffers (a result map must be written before it is scanned).
- No dangling views after the parent was resized, cleared or moved; no pointers into a
  container across a mutation of that container.
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
