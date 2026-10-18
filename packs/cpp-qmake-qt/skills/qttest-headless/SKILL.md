---
name: qttest-headless
description: Write and run QtTest suites headless on Windows - one test project per suite, test design rules, the minimal runtime PATH, results files, the shape check, flaky-test handling, the Release loop for UI suites and the run-alone rule. Use whenever a task adds, changes or runs a QtTest suite.
argument-hint: <suite name> [red | verify | loop N]
---

# QtTest suites, headless (pack cpp-qmake-qt)

`.claude/project/build-env.md` holds the exact commands; `packConfig.cpp-qmake-qt` names
the bin dir, the minimal PATH entries and the platform plugin per suite kind. This skill is
the procedure and the traps. Rules of record: `.claude/rules/cpp-qmake-qt/qt-testing.md`.

## 1. Writing

- A new test goes into a new project `tests/<name>/` unless the task names an existing
  suite. Copy an existing test `.pro`: `QT += core testlib` (+ `widgets` when needed),
  `CONFIG += console c++17 testcase`, the dependency `.pri` files the code under test needs.
- `QTEST_MAIN` (or `QTEST_GUILESS_MAIN`); slots `test_<behaviour_in_words>`; a `_data` suffix
  marks a data provider, not a test.
- **Red first, executed**: a test counts as red only if it compiled, ran and failed for the
  intended reason; prove a new test can fail (inject, run, restore) and say so.
- No real time, network, camera, PLC or device; `QSignalSpy::wait()` / `QTRY_COMPARE` instead
  of `qWait`; hardware cases go to the `*_hardware_test` suites that skip without hardware.
- Literal expected values for wire formats; fakes through the factory seams; crash tests in a
  child process.

## 2. Running

1. **Alone.** Immediately before each run check the process list (`tasklist`): nothing from
   `processes.busyBeforeTests` (`cl`, `link`, `nmake`, `jom`, `*_test.exe`) in any project.
   Timing tests fail under load; suites sharing a fixed port (`processes.testPorts`) never
   overlap. Never launch or kill the application executables.
2. **Platform.** `QT_QPA_PLATFORM=minimal`; `offscreen` for suites that show widgets or float
   docks.
3. **Minimal PATH**, in the documented order: Qt `bin`, each package runtime `bin`, the
   project's `bin\<config>`, `System32`. A PATH that carries a stray package `bin` hides a
   DLL the build failed to deploy; exit `0xC0000135` means a missing DLL, not a crash.
4. **Fresh artefacts.** Delete the previous `results.txt` and make sure the exe is the one
   just built (compare timestamps); a stale report or exe once read as a pass.
5. **Results to a file**: `<exe> -o results.txt,txt` (an installed app logger swallows stdout;
   Qt logs go to stderr, which `>` drops). Exit code = number of failed tests.
6. **Shape check before trusting a total**: `<exe> -functions` count = `void test_` slots in
   source; total = functions + 2 (`initTestCase`, `cleanupTestCase`). Never "fix" it.
7. **UI suites loop in Release**: run every widget/UI suite 25-40 times on the Release build
   (plus offscreen) and the single suspicious slot 40 times; report crash counts
   (exit `-1073741819`); any crash is a blocker. Debug runs hide use-after-free.

## 3. Interpreting and reporting

```text
Suite:        <name> (<config>, <platform>)
Result:       passed/failed/skipped from the Totals line; shape check <functions> = <listed> (+2)
Loop:         <n> runs, <crashes> crashes            (UI suites)
Not run:      <suite> - <why: board state, opt-in flag, hardware absent>
Baseline:     <totals at the base commit> -> <now>
```

- A known intermittent test failing alone: re-run once, record both runs, do not count it;
  anything else that moves from the baseline is a stop-rule event.
- Measure the baseline at the base commit first when the task gives none.
- Close-out of a shared module: every test project that includes it was rebuilt and run.
