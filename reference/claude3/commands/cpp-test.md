---
description: TDD for C++ in this project - write GoogleTest tests first (unit or image regression), confirm RED, implement, confirm GREEN, refactor. Uses the cpp-testing and tdd-workflow skills.
---

<!-- Adapted from ECC (affaan-m/ecc, MIT) commands/cpp-test.md -->

# /cpp-test

Enforce test-driven development with GoogleTest + CMake/CTest.

## What it does

1. **Define the interface** in `include/mtc/...` (signatures, Doxygen, no body)
2. **Write tests** in `tests/unit/` or `tests/regression/` (RED)
3. **Build and run** - the tests must fail for the intended reason
4. **Implement** the minimal code in `src/` (GREEN)
5. **Refactor** while green
6. **Report** which tests were added and the before/after ctest output

## When to use

- Porting a file from `reference_source/`: write the regression test from the reference
  behavior first, then port
- Fixing a bug: add the failing reproducer first
- Adding a config field or algorithm knob

## Commands

```bash
cmake -S . -B build -DOpenCV_DIR="$BINPICK_OPENCV_DIR"
cmake --build build --config Debug
ctest --test-dir build -C Debug --output-on-failure            # all
ctest --test-dir build -C Debug -R <Suite> --output-on-failure # one suite
```

## Test patterns

```cpp
// Unit
TEST(MatchedObject, WrapsAngleIntoHalfOpenRange) {
    mtc::MatchedObject o;
    o.computeMatchAngle(190.0);
    EXPECT_DOUBLE_EQ(o.matched_Angle, -170.0);
}

// Regression on fixtures (TEST_DATA_DIR comes from CMake)
TEST(EdgeMatcherRegression, FindsSrc1InDst1) {
    const auto src = cv::imread(std::string(TEST_DATA_DIR) + "/Src1.bmp", cv::IMREAD_GRAYSCALE);
    const auto dst = cv::imread(std::string(TEST_DATA_DIR) + "/Dst1.bmp", cv::IMREAD_GRAYSCALE);
    if (src.empty() || dst.empty()) GTEST_SKIP() << "fixture missing";
    // learn, match, compare with tests/golden/src1_dst1.json within tolerance
}

// Parameterized over the 8 rotations of Src5
class Src5Rotations : public ::testing::TestWithParam<int> {};
TEST_P(Src5Rotations, RecoversAngle) { /* ... */ }
INSTANTIATE_TEST_SUITE_P(All, Src5Rotations, ::testing::Values(0, 45, 90, 135, 180, 225, 270, 315));
```

## Coverage (reported, not gated)

- MSVC: `OpenCppCoverage --sources src -- build\tests\Debug\mtc_tests.exe` if installed
- GCC/Clang: configure with `--coverage`, then `gcovr -r . build`

## DO / DON'T

- DO write the test first and watch it fail; DO test through the public API
- DON'T assert exact floating-point equality on match results (use tolerances)
- DON'T read fixtures by absolute path; DON'T modify golden files without a reason

## Arguments

`$ARGUMENTS`: description of the behavior to test, or a `*.plan.md` path.

## Related

- Skills: `cpp-testing`, `tdd-workflow`
- `/cpp-build`, `/cpp-review`
