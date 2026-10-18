---
paths:
  - "**/*.cpp"
  - "**/*.cc"
  - "**/*.cxx"
  - "**/*.h"
  - "**/*.hpp"
  - "**/CMakeLists.txt"
  - "tests/**"
---
# C++ testing with GoogleTest and CTest (pack cpp-cmake-gtest)

> Adapted from ECC `rules/common/testing.md` and `rules/cpp/testing.md` (MIT). Coverage is a
> goal, never a merge gate. The kit's core rule `06-evidence.md` (RED first, negative check,
> never edit a test to pass) applies on top.

## Framework and layout

- GoogleTest (and GoogleMock when needed) through CMake `FetchContent` with a pinned tag,
  discovered with `gtest_discover_tests()`, run through CTest. One test executable per
  logical area, registered in `tests/CMakeLists.txt`.
- Layout: `tests/unit/` (pure logic, no files), `tests/synthetic/` (inputs generated at test
  time: drawn images, built frames; runs everywhere), `tests/regression/` (fixtures plus
  goldens, skips when a fixture is absent), optional `tests/bench/` (timing, never asserted).
- Fixtures are located through a CMake cache variable compiled in as a definition
  (`packConfig.cpp-cmake-gtest.testDataVar`, default `TEST_DATA_DIR`); never an absolute path.
  `GTEST_SKIP()` with a clear message when the directory or file is missing.

## Writing tests

- Arrange / Act / Assert; one behaviour per test; name `TEST(Subject, DoesXWhenY)`.
- Through the public API only; expected values from the spec, the reference or a hand
  computation, never from the code under test.
- Tolerances for floating-point results (`EXPECT_NEAR`, project tolerances in
  `project/rules.md`); never `EXPECT_DOUBLE_EQ` on a computed geometry or score.
- Parameterised tests for rotations, sizes, modes (`TEST_P` + `INSTANTIATE_TEST_SUITE_P`).
- No sleeps, network, hardware or writes outside a temp directory in unit tests; crash
  tests in a child process (`EXPECT_DEATH` or a subprocess).
- SIMD or parallel kernels get a scalar twin and a parity test.

## Running

The commands live in `project/build-env.md` (`cmake-build` skill):

```bash
<configure>                              # once per tree, every option explicit
cmake --build <dir> --config <cfg>       # whole tree
ctest --test-dir <dir> -C <cfg> --output-on-failure            # all
ctest --test-dir <dir> -C <cfg> -R <Suite> --output-on-failure # one suite
ctest --test-dir <dir> -N | tail -1      # shape check: number of registered tests
```

Report passed / total / skipped with the shape check; name every skipped test and why.

## Goldens

Regression results are JSON (or the project's format) under `packConfig...goldenDir`
(default `tests/golden/`); regenerated only with the update flag and a reason, in their own
commit; a failing comparison prints the per-item diff. Details: `golden-tests` skill.

## Coverage and sanitizers

- GCC/Clang: `--coverage` + `gcovr`; MSVC: `OpenCppCoverage` when installed. Reported, not gated.
- ASan: the project's CMake option (`packConfig...asanOption`); run the regression suite
  under it before a release.

## Troubleshooting

1. Isolation first: shared static state, test order, leftover files.
2. Verify the golden encodes the intended behaviour before touching it.
3. Fix the implementation, not the test, unless the test is provably wrong (report it).
