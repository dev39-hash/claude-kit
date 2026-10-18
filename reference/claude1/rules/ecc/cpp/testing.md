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

> Adapted from ECC (affaan-m/ecc, MIT). No GoogleTest, no coverage gate.

## Framework

A plain console program: `tests/main.cpp` with `tests/kernel_test_support.h`
(`KT_TEST(name)`, `KT_CHECK(cond)`, `kt::completenessSweep`). Registered with CTest as
`ctrl_kernel_test`. New tests go in `tests/main.cpp` (or a new `tests/*.cpp` added to the
executable in `CMakeLists.txt`); the test names are unique C identifiers.

```sh
cmake -S . -B build
cmake --build build --config Debug
ctest --test-dir build -C Debug --output-on-failure
```

(use Visual Studio's `cmake.exe` / `ctest.exe`; they are not on PATH). Run the executable
directly to see every PASS/FAIL line.

## What a test is

- A table row: given a State (built by driving events, or a `make` function), when one
  Event, expect State' and Effects. No threads, no timers, no Qt, no sleeps, no clock.
- Assert through the public API: `step()`, `state()`, `readiness()`, `outputs()`, `display()`.
- Check the effect list by kind and order (`std::holds_alternative<T>`, `std::get_if<T>`),
  and the output image by stable signal name (`holds("bTaskReady", true)`).

## The standard kit

1. **Scenario rows** per rule: normal run, role lost mid-job, master lost, acknowledge while
   a role is down, stop during start-up.
2. **Invariants after every step** (the harness `checkInvariants()`): `readiness().ok()` <=>
   `bTaskReady`, fault latched <=> `bTaskFault` and its code, plus block invariants (L7).
3. **Completeness sweep**: every (prepared State, sample Event) pair neither throws nor acts
   silently (L8). A new Event alternative needs a sample here.
4. **Stale-completion probe** per request kind: issue the request, advance the id/epoch/token,
   feed the old completion, assert only a `Trace` and unchanged State (L3, L4).

## TDD cycle

Failing `KT_TEST` first, confirm RED for the intended reason, minimal change, GREEN, refactor
(see skill `tdd-workflow`). A regression gets a reproducer row before the fix.

## Rules

- One `KT_TEST` per rule or scenario; the name is a sentence describing the behaviour.
- Plain C++: no Qt, threads, timers or sleeps in a core test; time enters as event fields.
- The kit (`kernel_test_support.h`) gives `KT_TEST`, `KT_CHECK` and `completenessSweep`; the
  `Harness` and `checkInvariants()` live in the controller's test file (`tests/main.cpp`).
- A failing test is never edited to pass; fix the core or report the disagreement.

- Policy numbers in tests come from `Policy::defaults()` or a named local override, never
  magic literals that duplicate the default.
- Do not weaken or delete a check to get green; do not test private helpers directly.
- Coverage is not measured or gated; completeness of the (State x Event) grid replaces it.
