---
paths:
  - "**/*.cpp"
  - "**/*.h"
---
# C++ Safety (NichirinLaserMark)

This app drives physical hardware (PLC outputs, laser firing, a rotary axis). A
defect here can mark the wrong part or move hardware unexpectedly — treat
safety as correctness.

## Memory safety

- No owning raw pointers without a Qt parent; no `malloc`/`free`.
- Prefer `QString`/`std::string` and `QByteArray`/`std::vector` over C buffers.
  At the SDK boundary (wide-char buffers, fixed arrays) check sizes explicitly.
- `reinterpret_cast` only at the SDK/GDI boundary, with the layout assumption
  verified (e.g. `GetObject()` on a handle read from a vtable offset).
- No `strcpy`/`strcat`/unbounded `sprintf`.

## Undefined behaviour

- Initialize every member (in-class initializers preferred).
- Guard integer arithmetic on values from the PLC or a QR scan (word counts,
  indices, lengths) — they are external input.
- Never touch a dangling pointer: watch lambda captures on queued connections
  and timers, and destruction order of threads vs the data they use.

## External input

- PLC words, QR scanner text, `.ezd` files and settings JSON are untrusted:
  validate length and range before use; fail the whole operation on bad input
  rather than writing partial results.

## Hardware side effects

- A failure while marking must stop the mark and surface an error — never retry
  firing silently.
- Code that moves the axis or fires the laser must not run in automated tests
  unless the test is explicitly opt-in (see `tests/sdk_probe_test`).

## Secrets

- License secrets live only in
  `components/rockey4nd_license/release_constants/runtime_constants.h`; never
  copy them into logs, docs, or other files.
