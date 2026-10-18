---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.cc"
  - "**/*.hh"
  - "**/*.cxx"
  - "**/*.h"
---
# C++ Patterns

> Adapted from ECC (affaan-m/ecc, MIT), reduced to the idioms this kernel actually uses.

## Core shape

- A core exposes `step(const Event &) -> std::vector<Effect>` and const getters only (L1).
  It ends with `static_assert(ctrl::is_controller_core<MyCore>::value, "...")`.
- `Event` and `Effect` are `std::variant` of plain structs; handlers are `on(const X &, Effects &)`
  overloads dispatched with `std::visit`. Adding an alternative must break the build or the
  completeness sweep until every handler decides.
- Derived queries (`readiness()`, `outputs()`, `display()`) are `const` and recompute from
  State; nothing is cached or "kept".

## Value types

- Events, effects, State, Policy and ids are copyable value types with defaults at the
  declaration (`int count{0};`). No inheritance, no virtuals, no raw owning pointers.
- Pass small ids/enums by value, everything else by `const &`. Return by value.
- Rule of Zero. A kernel type that needs a destructor or custom copy is a smell: reconsider.
- `[[nodiscard]]` on queries whose result must not be dropped.
- Correlation ids are `ctrl::StrongId<Tag>` counters inside State; a core never reads a clock
  or a random source (L2). Time enters only as an event field.

## Errors

- No exception may cross `step()`. Total functions: an unspecified (State, Event) pair leaves
  a `Trace` or `Log` explaining the no-op and no State change (L8).
- Expected failures are values: an Event carrying a status, a `FaultRegister` raise, an
  `std::optional`. Never throw for "device lost" or "bad input".
- A stale completion (wrong id, token or epoch) produces only a `Trace{note="stale"}` (L3, L4).

## Effects and ordering

- Handlers change State and push effects; they never call out. `PublishOutputs`, the display
  `Trace` and the readiness `Notify` are appended once, at the end of `step()` (`finish`), by
  comparing before and after (L7); event-specific `Notify` effects (fault, job result) come
  from the handler that decides them.
- Effects are returned in execution order; the executor runs them after `step()` returns (L5).

## Templates and blocks

- Blocks (`Lifecycle`, `Job<Phase>`, `RoleHealth`, `Latch<T>`, `FaultRegister<Code>`,
  `EdgeInput`, `Timers`) are small structs with closed value sets and documented invariants.
  Compose them in State; do not add a parallel bool that duplicates a block value.
- Header-only templates: keep helpers in `namespace detail`, mark non-template functions
  `inline`.
