# Testing Requirements

> Adapted from ECC (`affaan-m/ecc`, MIT). E2E/browser requirements removed; regression
> tests on the image fixtures added. The 80% figure is a goal, not a merge gate
> (see `../../project.md`).

## Test Types

1. **Unit tests** (`tests/unit/`): geometry helpers, config validation, BlockMax, overlap
   filtering, angle wrap, JSON round-trip. Fast, no image files.
2. **Regression tests** (`tests/regression/`): learn a pattern from a `Src*.bmp`, match
   against the matching `Dst*.bmp`, compare to `tests/golden/*.json` within tolerance
   (position +/-1 px, angle +/-0.5 deg, score +/-0.01 unless the golden says otherwise).
3. **Benchmarks** (optional, `tests/bench/`): timing only, never asserted in CI.

## Test-Driven Development

Workflow for new behavior and for bug fixes:

1. Write the test first (RED)
2. Build and run it: it must FAIL for the intended reason
3. Write the minimal implementation (GREEN)
4. Run again: it must PASS
5. Refactor while green
6. Run the full `ctest` suite before committing

For ported code the order is: write the regression test from the reference behavior first,
then port, then make it green. The reference implementation defines the expected output.

## Test Structure (AAA)

```cpp
TEST(BlockMax, UpdateMaxRescansOnlyTouchedBlocks) {
    // Arrange
    cv::Mat score = makeScoreMap(64, 64);
    mtc::BlockMax bm(score, cv::Size(8, 8));
    // Act
    bm.UpdateMax(cv::Rect(0, 0, 16, 16));
    double v; cv::Point p;
    bm.GetMaxValueLoc(v, p);
    // Assert
    EXPECT_NEAR(v, 0.97, 1e-6);
    EXPECT_EQ(p, cv::Point(40, 12));
}
```

## Test Naming

`TEST(Subject, DoesXWhenY)`: `TEST(MatchedObject, WrapsAngleIntoHalfOpenRange)`,
`TEST(EdgeMatcher, FindsAllEightRotationsOfSrc5)`.

## Fixtures and Data

- Test images are read from `reference_source/Test Images/` via a `TEST_DATA_DIR` compile
  definition set by CMake; never a hard-coded absolute path.
- Tests that need an image skip (`GTEST_SKIP()`) with a clear message if the file is missing.
- No `sleep`, no network, no writes outside a temp directory.

## Troubleshooting Test Failures

1. Check test isolation (static state in `MatchGroup` index ranges is shared!)
2. Verify the golden file matches the intended behavior before changing it
3. Fix implementation, not tests, unless the test is provably wrong
