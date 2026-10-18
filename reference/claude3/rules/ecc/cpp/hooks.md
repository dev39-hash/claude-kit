---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.cc"
  - "**/*.hh"
  - "**/*.cxx"
  - "**/*.h"
  - "**/CMakeLists.txt"
---
# C++ Checks Before Committing

> From ECC (`affaan-m/ecc`, MIT), extends [common/hooks.md](../common/hooks.md).
> Commands adapted to this Windows/MSVC host; each step is skipped with a note when the tool
> is not installed.

```bash
# Format check (clang-format if available; the PostToolUse hook already formats edited files)
clang-format --dry-run --Werror src/*.cpp include/mtc/*.h

# Configure + build with warnings as errors
cmake -S . -B build -DOpenCV_DIR="%BINPICK_OPENCV_DIR%" -DMTC_WARNINGS_AS_ERRORS=ON
cmake --build build --config Debug

# Tests
ctest --test-dir build -C Debug --output-on-failure
```

## Recommended CI pipeline (when a CI is added)

1. clang-format check
2. CMake configure + build (MSVC and one of GCC/Clang)
3. ctest (unit + regression) on Debug, then Release
4. ASan job on the regression suite
5. clang-tidy / cppcheck as non-blocking reports
