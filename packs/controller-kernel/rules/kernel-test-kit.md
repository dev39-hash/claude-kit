---
paths:
  - "tests/**"
  - "**/*_test.cpp"
  - "**/*_core/**"
---
# Kernel test kit (pack controller-kernel)

> Loads for test files and core directories. Tests of a controller core use the kernel's
> header-only kit, not a test framework; the core rule `06-evidence.md` (RED first, negative
> check, never edit a test to pass) applies on top. When another pack brings a framework
> (GoogleTest, QtTest), `.claude/project/rules.md` says which tests use which.

## The kit

The kit header (`kernel_test_support.h`) provides exactly three things: the `KT_TEST(name)`
registry and runner, the `KT_CHECK(cond)` macro and
`kt::completenessSweep<Core, Event>(makeStates, samples, isExplained, changed, describe)`.
Everything else is written once per controller in its own test file, copying the pattern of
the kernel's worked example: a `Harness` that wraps one core, records effects and calls
`checkInvariants()` after every step, with helpers to reach states and read effects.

## What a test is

- A table row: given a State (built by driving events, or a `make` function), when one
  Event, expect State' and Effects. No threads, no timers, no Qt, no sleeps, no clock; time
  enters as event fields.
- Assert through the public API: `step()`, `state()`, `readiness()`, `outputs()`, `display()`.
- Check the effect list by kind and order (`std::holds_alternative<T>`, `std::get_if<T>`) and
  the output image by stable signal name.
- One `KT_TEST` per rule or scenario; the name is a unique C identifier that reads as a
  sentence stating the behaviour.

## The standard set every controller carries

1. **Scenario rows** per rule; minimum: normal run, role lost mid-job, master lost,
   acknowledge while a role is down, stop during start-up.
2. **Invariants after every step** (`checkInvariants()`): `readiness().ok()` iff the ready
   output; fault latched iff the fault output and code; each chosen block's invariants (L7).
3. **Completeness sweep**: every (prepared State, sample Event) pair neither throws nor acts
   silently (L8). One sample per Event alternative, with a check that
   `samples.size() == std::variant_size_v<Event>`; the `changed` predicate compares every
   State field a handler can touch.
4. **Stale-completion probe** per request kind and per timer key: issue the request, advance
   the id, epoch or token, feed the old completion, assert only a `Trace` and unchanged State
   (L3, L4).
5. **Wire-name tests** (L12): output names, fault codes and display names against the contract.

## Rules

- Policy numbers in tests come from `Policy::defaults()` or a named local override, never a
  literal that duplicates the default.
- Never weaken or delete a check to get green; do not test private helpers; a failing test is
  never edited to pass. Report the disagreement instead.
- Coverage is not measured or gated; completeness of the (State x Event) grid replaces it.
- RED and GREEN runs build in a slot (`build.js all --slot <tag> --release-slot`, the tag
  from the brief), never in the leader's tree; the count comes from the test program itself
  (`packConfig.cpp-cmake-gtest.testCountRegex` makes `build.js` print it), not from CTest.
- The tester's Test report adds two lines for a core task: `Sweep: <samples>/<alternatives>,
  <states> prepared states, green | failing pairs` and `Stale probes: <request kinds and timer
  keys covered>`.
