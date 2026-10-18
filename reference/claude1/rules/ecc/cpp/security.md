---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.cc"
  - "**/*.hh"
  - "**/*.cxx"
  - "**/*.h"
---
# C++ Security and Memory Safety

> Adapted from ECC (affaan-m/ecc, MIT). The kernel is value-typed and header-only, so most
> rules reduce to "keep it that way".

## Memory

- No raw `new` / `delete` / `malloc`; no owning raw pointers. Use values, `std::vector`,
  `std::array`, `std::unique_ptr` (rare).
- No C arrays, `strcpy`, `sprintf`; use `std::string` and `std::array`.
- Initialise every member at its declaration. An uninitialised field in State or an event
  is a purity bug (the same inputs would not give the same outputs).
- `reinterpret_cast` and C-style casts are not used; `static_cast` only, and only for
  enum <-> int on the wire (law L12 keeps those values stable).

## Indices and lifetime

- Role and camera numbers arrive from the master and from devices: range-check before
  indexing (`roleIndex`, `.at()`), and treat out-of-range as a refused Latch, not a crash.
- Never return or store a reference into State across a `step()`; `state()` is valid only
  until the next call. Copy what must outlive it.
- Do not keep iterators into `std::vector<Effect>` while pushing to it.
- Signed arithmetic on counters (attempts, ms, ids): check for overflow where a value comes
  from outside; ids are `std::uint32_t` and wrap is not expected.

## Concurrency

- The core has no thread, no lock, no static mutable state (function-local statics in the test
  kit's registry excepted). Cross-thread traffic is `Shell::post(Event)` only.
- No blocking call anywhere in the lifecycle (L10): no `QEventLoop`, no
  `BlockingQueuedConnection`, no `wait(`, no `sleep`.

## Input trust

- Everything from a master or device (tags, levels, ids, strings) is untrusted: an unknown
  value is an Event the core classifies (`Unspecified`, `TypeMismatch`), not an assertion.
- Do not log secrets or raw payloads; `Log` messages carry names and ids.

## Static analysis

When reachable (clang-tidy lives under VS `VC\Tools\Llvm\x64\bin`), run it on the touched
files and report; a missing tool is "SKIPPED", not a pass. MSVC `/analyze` is optional.
Sanitizers: `/fsanitize=address` on MSVC, `-fsanitize=address,undefined` on GCC/Clang, for
an occasional manual run, not a gate.
