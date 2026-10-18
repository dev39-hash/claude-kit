---
description: Fix C++ build errors, CMake and linker problems incrementally with minimal changes. Invokes the cpp-build-resolver agent.
---

<!-- Adapted from ECC (affaan-m/ecc, MIT) commands/cpp-build.md -->

# /cpp-build

Invoke the **cpp-build-resolver** agent (`.claude/agents/cpp-build-resolver.md`).

## What it does

1. Configure and build: `cmake -S . -B build -DOpenCV_DIR="$BINPICK_OPENCV_DIR"` then
   `cmake --build build --config Debug`
2. Parse errors (MSVC `Cxxxx`, `LNKxxxx`, or GCC/Clang diagnostics), group by file
3. Fix one error at a time with the smallest change, rebuild after each
4. Run `ctest --test-dir build -C Debug --output-on-failure` once the build is clean
5. Report what was fixed, what remains, and which tools were unavailable

## When to use

- `cmake` configure fails (OpenCV not found, generator issues)
- Compile or link errors after porting a file from `reference_source/`
- AVX2 / OpenMP flags missing on a non-MSVC compiler

## Strategy

1. Configure errors first
2. Compilation errors second
3. Linker errors third
4. Warnings last (`MTC_WARNINGS_AS_ERRORS=ON`)

## Stop conditions

Same error after 3 attempts, fix causes more errors, architectural change needed, or a
required tool/library is not installed (report instead of installing).

## Arguments

`$ARGUMENTS`: optional CMake preset/config (e.g. `Release`) or a specific target.

## Related

- `/cpp-test`, `/cpp-review`
- Skill: `verification-loop`
