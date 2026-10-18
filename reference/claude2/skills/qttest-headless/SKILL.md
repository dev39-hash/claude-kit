---
name: qttest-headless
description: Write and run ncr_picking's QtTest suites headless on Windows - new test projects, test design rules, the minimal runtime PATH, results files, shape checks, flaky-test handling and the parallel-run rules. Use whenever a work package adds, changes or runs a test suite (architecture_contract_test, the device suites, robot_pose_decomposition_test, property_browser_test, runtime_docking_test or a new one).
---

# QtTest suites, headless

`docs/rules/build_and_verification.md` ("Architecture Contract Test", "Confirm A Suite's Shape") is the
source of truth. This skill is the procedure and the traps.

## 1. Writing tests

- **A new test goes into a new test project** under `tests/<name>/`, unless the handoff names an
  existing suite. `tests/architecture_contract_test/main.cpp` is shared with another phase; change it
  only where the handoff says.
- Project file: `QT += core testlib` (+ `widgets` only if needed), `CONFIG += console c++17 testcase`,
  include the dependency `.pri` files the code under test needs; follow an existing test `.pro`.
- `QTEST_MAIN` (or `QTEST_GUILESS_MAIN` for pure logic). Slots named `test_<behaviour_in_words>`.
- **Red first, executed.** A test only counts as red if it was compiled and run and failed for the
  intended reason. Prove a new test can fail (inject, run, restore) and say so in the report.
- **No real time, network, camera or PLC in a unit test.** No `QTest::qWait(n)` as synchronisation —
  use `QSignalSpy::wait()` / `QTRY_COMPARE` with a bounded timeout. Hardware cases belong in the
  `*_hardware_test` suites, which skip without hardware.
- A crash under test belongs in a child process (relaunch the test exe with an argument, as
  `runtime_docking_test` does) so it is recorded instead of killing the runner.
- Fix the implementation, not the test, unless the test is wrong — and then say why.

## 2. Running

- **Never run a suite while anything else builds or tests.** Immediately before each run, check
  `tasklist` for `cl.exe`, `link.exe`, `nmake.exe`, `jom.exe`, `*_test.exe` and other projects' test
  runners; wait while any runs. Timing tests fail under load; `vision_output_device_test` binds fixed
  ports 25101/25102.
- **Never launch or kill `ncr_picking.exe` / `ncr_runtime.exe`.** A running shell breaks
  `test_both_shells_take_the_same_instance_key` and the JAI hardware suite.
- Platform: `QT_QPA_PLATFORM=minimal`; `offscreen` for suites that show widgets or float docks
  (`property_browser_test`, `runtime_docking_test`).
- **Minimal `PATH`**, in this order: Qt `bin`, the ADS package `bin`, the OpenCV `bin`, the Pylon
  runtime, the eBUS runtime, `<root>\build\bin\<config>`, System32. A `PATH` that carries a package
  `bin` of its own hides a DLL the build failed to deploy. Exit `0xC0000135` means a missing DLL.
- Always write results to a file: `<exe> -o results.txt,txt`. The test exes install the app logger,
  which swallows stdout. The exit code is the number of failed tests.
- **Shape check before trusting a total:** `<exe> -functions` count must equal the `void test_` slots in
  source, and the total equals functions + 2 (`initTestCase`, `cleanupTestCase`). 257 = 255 + 2 is
  correct; never "fix" it.

## 3. Interpreting

- Report `passed / failed / skipped` from the `Totals:` line, with the shape check, per suite.
- A known intermittent test that fails alone: re-run it once, record both runs, do not count it against
  the package. Anything else that moves from its baseline is a stop-rule event, not noise.
- Compare against the baseline the handoff gives; measure the baseline at the base commit first if the
  handoff has none.
