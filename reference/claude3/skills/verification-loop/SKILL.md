---
name: verification-loop
description: Run the project's verification pass for C++/CMake work - configure, build with warnings as errors, ctest (unit + regression), golden-file comparison, static analysis if available, and diff review - then produce a PASS/FAIL report. Use after finishing a feature, a port from reference_source, or a refactor, and before committing.
metadata:
  origin: ECC (adapted for image_matching, C++/CMake/MSVC)
---

# Verification Loop (C++ / CMake)

Adapted from ECC's verification-loop (npm/tsc based) for this OpenCV library on Windows.
Every phase states clearly when a tool was **skipped because it is not installed**;
a skipped phase is not a PASS.

## When to Use

- After completing a feature or a port of a reference file
- Before creating a commit on `main` or a PR
- After refactoring the matcher or config model

## Phase 1: Configure

```bash
cmake -S . -B build -DOpenCV_DIR="$BINPICK_OPENCV_DIR" -DMTC_WARNINGS_AS_ERRORS=ON 2>&1 | tail -20
```

If configure fails, STOP and use `/cpp-build`.

## Phase 2: Build (Debug, warnings as errors)

```bash
cmake --build build --config Debug 2>&1 | grep -E "error|warning" | head -40
```

Zero errors and zero warnings required. Record the count.

## Phase 3: Format check

```bash
clang-format --dry-run --Werror src/*.cpp include/mtc/*.h tests/**/*.cpp 2>&1 | head -20
```

clang-format is under Visual Studio's `VC\Tools\Llvm\x64\bin` on this machine; if not
reachable, report "format: SKIPPED (tool missing)".

## Phase 4: Tests

```bash
ctest --test-dir build -C Debug --output-on-failure 2>&1 | tail -40
```

Report total / passed / failed / skipped. Skipped regression tests (missing fixtures) must
be listed by name.

## Phase 5: Golden comparison

If any regression test changed its output, show the (x, y, angle, score) diff against
`tests/golden/*.json` and confirm the golden was updated **intentionally** (commit message
explains why). Unexplained golden drift = FAIL.

## Phase 6: Static analysis (optional)

```bash
clang-tidy -p build src/*.cpp 2>&1 | grep -E "warning|error" | head -20
cppcheck --enable=all --suppress=missingIncludeSystem src/ 2>&1 | tail -20
```

Report findings or "SKIPPED (tool missing)".

## Phase 7: Diff review

```bash
git status --short
git diff --stat
```

Check each changed file for: Qt / `core/` includes, `std::cout` debugging, edits under
`reference_source/` (should be impossible; the hook blocks them), undocumented in-place
mutation, public symbols without Doxygen, golden files changed.

## Output Format

```
VERIFICATION REPORT
===================
Configure: [PASS/FAIL]
Build:     [PASS/FAIL] (X errors, Y warnings)
Format:    [PASS/FAIL/SKIPPED]
Tests:     [PASS/FAIL] (passed/total, S skipped)
Golden:    [PASS/FAIL/N/A]
Static:    [PASS/FAIL/SKIPPED]
Diff:      [N files changed]

Overall:   [READY / NOT READY] to commit

Issues to fix:
1. ...
```

## Continuous Mode

For long porting sessions, run Phases 1, 2 and 4 after every ported file; run the full loop
before each commit.
