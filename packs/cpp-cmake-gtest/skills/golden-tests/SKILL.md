---
name: golden-tests
description: Regression tests that compare a computation's output with stored golden files (JSON or the project's format) within tolerances - how to record, compare, regenerate with an explicit flag and a reason, and review golden drift. Use when adding a regression case, when a golden comparison fails, or when an intentional behaviour change moves the expected output.
argument-hint: <suite or case name> [--update-golden]
---

# Golden tests (pack cpp-cmake-gtest)

A golden file pins the output of one case (positions, angles, scores, counts, frames) so a
behaviour-preserving change can be proven neutral and a behaviour change can be seen. The
golden is evidence; it is never edited by hand to make a run pass.

## Layout and config

- Directory: `packConfig.cpp-cmake-gtest.goldenDir` (default `tests/golden/`), one file per
  suite and case: `tests/golden/<suite>/<case>.json`.
- Fixtures: `packConfig...testDataVar` (default `TEST_DATA_DIR`) compiled in from a CMake cache
  variable; a missing fixture skips the test with a clear message.
- Update flag: `packConfig...updateGoldenFlag` (default `--update-golden`), passed to the test
  executable, never on by default.
- Tolerances: `project/rules.md` names them (for example position 1 px, angle 0.5 deg,
  score 0.01, with a tighter set for exact cases). Compare angles by wrapped difference.

## Writing a golden test

1. The regression executable runs the case, builds a result record (one object per matched
   item: `x, y, angle, score, state`), and compares it with the golden within tolerance.
2. On mismatch it prints the per-item diff (expected vs actual, which tolerance failed) and
   the command to regenerate.
3. With the update flag it writes the golden and prints what changed; the test still reports
   the comparison against the previous golden so the diff is visible.
4. Record the golden's provenance in the file (reference version, fixture name, date).

## When a comparison fails

| Situation | Action |
|---|---|
| Unintended change | FAIL; fix the implementation; the golden stays |
| Intended behaviour change (the task's Plan says so) | regenerate with the flag; the task file quotes the diff; the golden goes in **its own commit** whose message gives the reason |
| Golden was wrong (reference bug, bad fixture) | an ADR or decision entry records why; regenerate; own commit |
| Tolerance too tight for a legitimate numeric difference (compiler, SIMD vs scalar) | widen the tolerance in `project/rules.md` with a reason, not the golden |

Never let a worker regenerate goldens on its own initiative; the leader does it at the task's
request or confirms it at Gate 2.

## Review of golden drift (reviewer and verification-loop)

- Every changed golden is listed with the diff of the values that moved.
- The Plan or ADR explains each one; unexplained drift is `BLOCK`.
- A behaviour-neutral task shows identical goldens and identical test totals before and after.

## Preview or report artefacts (optional)

A project may keep per-version visual or tabular previews of golden runs (annotated images,
`summary.tsv`) under an ignored directory with an index README; old versions are never
deleted by agents. Record the generator command in `project/build-env.md`.
