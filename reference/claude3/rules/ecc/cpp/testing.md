---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.cc"
  - "**/*.hh"
  - "**/*.cxx"
  - "**/*.h"
  - "**/CMakeLists.txt"
  - "tests/**"
---
# C++ Testing

> From ECC (`affaan-m/ecc`, MIT), extends [common/testing.md](../common/testing.md).
> Coverage commands adapted for MSVC (no gcov/lcov on Windows).

## Framework

GoogleTest + GoogleMock via CMake `FetchContent` (pinned tag), discovered with
`gtest_discover_tests()`, run with CTest.

## Running Tests

```bash
cmake -S . -B build -DOpenCV_DIR="%BINPICK_OPENCV_DIR%"
cmake --build build --config Debug
ctest --test-dir build -C Debug --output-on-failure
```

Single test: `ctest --test-dir build -C Debug -R BlockMax --output-on-failure`

## Coverage

- GCC/Clang: `-DCMAKE_CXX_FLAGS=--coverage` + `lcov`/`gcovr`
- MSVC: `OpenCppCoverage --sources src -- build\tests\Debug\mtc_tests.exe` (if installed)
- Coverage is reported, not gated (see `../../project.md`)

## Sanitizers

- MSVC: configure with `-DMTC_ASAN=ON` (adds `/fsanitize=address`)
- GCC/Clang: `-DMTC_ASAN=ON` adds `-fsanitize=address,undefined`
- Run the regression suite under ASan at least once before tagging a release

## Regression tests on images

- Fixtures from `reference_source/Test Images/` via `TEST_DATA_DIR`
- Golden JSON in `tests/golden/`; a failing golden comparison prints the diff of
  (x, y, angle, score) per matched object
- `GTEST_SKIP()` when a fixture file is absent

## Reference

See skill `cpp-testing` for fixtures, mocks, parameterized tests, and CMake snippets.
