---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.cc"
  - "**/*.hh"
  - "**/*.cxx"
  - "**/*.h"
---
# C++ Security and Memory Safety

> From ECC (`affaan-m/ecc`, MIT), extends [common/security.md](../common/security.md).
> Project exception: `_mm_malloc`/`_mm_free` are allowed inside a single RAII owner type.

## Memory Safety

- No raw `new`/`delete`; use smart pointers or containers
- No C-style arrays; use `std::array` / `std::vector`
- `malloc`/`free`/`_mm_malloc`: only inside `AlignedBuffer` (or equivalent RAII owner)
- `reinterpret_cast` only in SIMD load/store helpers, with a comment on alignment
- Every member initialized at declaration (`MatchParams` in the reference violates this)

## Buffer Overflows

- Bounds: pyramid layer index, pattern point count vs. buffer size, ROI vs. image
- Use `.at()` or explicit checks on indices that come from configs or files
- Never `strcpy`/`sprintf`; `std::string`, `std::wstring`, streams

## Undefined Behavior

- No signed overflow on pixel index math (`int` x `int` for large images -> use `size_t`
  or `int64_t`)
- No reading uninitialized score maps (`matResult` must be set before `minMaxLoc`)
- No dangling `cv::Mat` ROI views, no dangling `MatchPattern*` after a group mutation
- Run tests with sanitizers where the toolchain supports it:
  - MSVC: `/fsanitize=address` (CMake: `-DMTC_ASAN=ON`)
  - GCC/Clang: `-fsanitize=address,undefined`

## Static Analysis

When available (not on PATH on this machine; report instead of failing):

```bash
clang-tidy -p build src/*.cpp
cppcheck --enable=all --suppress=missingIncludeSystem src/
```

MSVC alternative: `cmake --build build -- /p:RunCodeAnalysis=true` or `/analyze` in CXX flags.
