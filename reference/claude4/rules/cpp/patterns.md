---
paths:
  - "**/*.cpp"
  - "**/*.h"
---
# C++ Patterns (NichirinLaserMark)

## RAII and special members

- Tie every resource (handles, SDK bitmaps, processes, threads) to an object's lifetime.
- Rule of Zero by default; if you define one of destructor/copy/move, define or
  `= delete` all five. `QObject` subclasses are non-copyable already.

## Value semantics

- Small/trivial types by value; large types by `const&`; return by value.
- Qt containers are implicitly shared — pass by `const&`, avoid accidental detach.

## Error handling

- **No exceptions** — the codebase has none. Failures are returned as `bool`,
  an rc/enum, `std::optional`, or reported by signal, then logged with context.
- Never collapse a failure into a default value without logging it.
- SDK rc values keep their meaning end to end — see
  `components/ezdlib` docs before interpreting one.

## Threading

- Devices are driven cross-thread only through `runtime/*Runner`, via queued signals.
- Types crossing a queued connection need `Q_DECLARE_METATYPE` + `qRegisterMetaType`.
- Timers that must follow `moveToThread` are parented.
- In polled loops, react to a change by comparing STATE, not by catching an EDGE —
  an edge that arrives while busy is lost.

## Configuration

- New JSON/config keys are optional on load (old saved configs must still load).
- `verify()` must not start rejecting configs already saved on installed machines.

## Architecture

- No DeviceManager / Factory / Registry: two fixed devices owned by `MarkingController`.
- The laser SDK is bound at runtime (LoadLibrary) inside `laser_host`, never linked.

## Laser SDK

Before touching laser init, the host, or a laser connect failure, read
`docs/rules/laser_sdk_runbook.md`. In particular:
- §Two hard rules — init in REAL mode whenever a board may be attached, and a
  host must never sim-init before a real-init within its own lifetime.
- §Symptom → cause → fix, the `DialogDismisser` row — never run it outside a
  short scope around `lmc1_Initial` / teardown.
