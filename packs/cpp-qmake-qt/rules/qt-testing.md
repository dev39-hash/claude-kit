---
paths:
  - "tests/**"
  - "**/*_test.cpp"
  - "**/*.pro"
---
# QtTest testing (pack cpp-qmake-qt)

> From the test rules of two earlier Qt projects. The kit rule `06-evidence.md` (RED
> first, negative check, shape check, never edit a test to pass) applies on top. Procedures:
> the `qttest-headless` and `qt-ui-probe` skills.

## Layout

- One test project per suite under `tests/<name>/` with its own `.pro` (`QT += core testlib`,
  `widgets` only when needed, `CONFIG += console c++17 testcase`), including the dependency
  `.pri` files the code under test needs; follow an existing test `.pro`.
- `QTEST_MAIN` or `QTEST_GUILESS_MAIN` for pure logic; slots named `test_<behaviour_in_words>`.
  A slot whose name ends in `_data` is a data provider and is silently NOT run as a test.
- A shared contract suite (architecture, layering, instance keys) is changed only where the
  task's touch list says.

## Writing tests

- No real time, network, camera, PLC or device in a unit test; hardware suites skip cleanly
  without hardware and say so. No `QTest::qWait(n)` as synchronisation: `QSignalSpy::wait()`
  or `QTRY_COMPARE` with a bounded timeout.
- Pin wire formats and register layouts with LITERAL expected values, never a round-trip
  through the project's own codec (a reversed order agrees with itself).
- Fakes injected through the project's factory seams (`create*Device()`), each with distinct
  failure texts; assert that requests REACH the device (a no-op base class passes either way).
- Prefer recording what was emitted over reasoning about the mechanism.
- A crash under test runs in a child process (relaunch the exe with an argument) so it is
  recorded instead of killing the runner.

## Running (details: `qttest-headless`)

- Suites run one at a time; nothing from `processes.busyBeforeTests` running; fixed ports in
  `processes.testPorts` are shared by at most one suite at a time.
- `QT_QPA_PLATFORM=minimal` (or `offscreen` for widget suites); minimal PATH in the documented
  order; results always to a file with `-o results.txt,txt` (stdout is swallowed by an
  installed logger, Qt logs go to stderr); delete the old report and the old exe before a
  run (a stale one once read as a pass).
- Shape check: `<exe> -functions` count equals the `void test_` slots in source; total equals
  functions + 2 (`initTestCase`, `cleanupTestCase`). Never "fix" that arithmetic.
- Every widget or UI suite runs 25-40 times on a RELEASE build (plus offscreen) before it is
  called green; a use-after-free once passed 4/4 Debug runs and crashed 30-50 % in Release.
  Any crash (exit `-1073741819` / `0xC0000005`) is a blocker.
- Exit code = number of failed tests; `0xC0000135` = a runtime DLL missing from PATH, not a
  test failure.

## Oracles and baselines

- A project may keep oracles (golden captures, protocol baselines) for a sensitive module:
  run all of them after ANY change to that module; the diff is the evidence; re-baseline
  only with the human's agreement and in its own commit. Baselines must be placeholder-free
  (date-bearing content breaks at midnight).
- Close-out of a change to a shared module: build EVERY test project that includes that
  module; report each test not run and why; never as passing.
- A known intermittent test failing alone: re-run once, record both runs; anything else that
  moves from the baseline is a stop-rule event, not noise.
