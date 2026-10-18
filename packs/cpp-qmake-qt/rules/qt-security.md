---
paths:
  - "**/*.cpp"
  - "**/*.h"
  - "**/*.hpp"
---
# C++ / Qt safety and security (pack cpp-qmake-qt)

> Adapted from ECC rules/cpp/security.md (MIT) through the ncr_picking and NichirinLaserMark
> adaptations. Industrial applications drive hardware: a defect can move a device or mark
> the wrong part, so safety is correctness.

## Memory safety

- No owning raw pointer without a Qt parent; no `malloc`/`free`; no C buffers where
  `QString` / `QByteArray` / `std::vector` do.
- At an SDK or GDI boundary (wide-char buffers, fixed arrays, handles) check sizes
  explicitly; `reinterpret_cast` only there, with the layout assumption written down.
- No `strcpy`, `strcat`, unbounded `sprintf`.
- Initialise every member (in-class initialisers); watch lambda captures on queued
  connections and timers, and the destruction order of threads vs the data they use.

## Indices and regions

- Range-check every index, size and region before use; clip a region from configuration to
  the image or buffer bounds before taking a view.

## External input is untrusted

- Project files (JSON, databases), PLC words and replies (MC, Modbus), scanner text, camera
  SDK data, sockets and device files are external input: validate type, range and length,
  guard the arithmetic on them (word counts, offsets), and fail the whole operation loudly
  (log with context, fault, refuse to load) rather than write partial results or fall back
  silently.
- No `QProcess` / `system()` with strings built from external input.

## Hardware side effects

- A failure during a hardware action (marking, moving an axis, firing) stops the action and
  surfaces an error; never retry silently.
- Code that moves hardware never runs in automated tests unless the test is explicitly
  opt-in through a named environment variable the human sets.
- Never launch or kill the application or runtime executables (`processes.neverLaunch`,
  `neverKill`); a running instance holds the device and locks its binary.

## Secrets and paths

- Licence secrets live in the one file the project names; never copied into logs, docs or
  other sources. No credentials or machine paths in tracked files; machine paths live in the
  untracked local `.pri`.

## Sanitizers

- `/fsanitize=address` in a local Debug build to chase a memory bug; never committed to a
  project file without the human's approval.
