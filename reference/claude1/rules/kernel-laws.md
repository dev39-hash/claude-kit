---
paths:
  - "include/ctrl_kernel/**"
  - "**/*_core/**"
  - "**/core/**"
---

# Kernel laws checklist (core code)

Full text and checks: `docs/controller_kernel.md` section 6. Before finishing an edit to a
core or to the kernel, every line below must still hold.

| Law | Must hold | Quick check |
|---|---|---|
| L1 | Only `step()` changes State; everything else public is const | no non-const public member besides `step` |
| L2 | No Qt, device, clock, random, thread, file I/O in a core | `kernel-gates.js` / `gate-check.js` |
| L3 | Each async request has an id owned by one State field; another id -> only a `Trace` | a stale-completion row per request kind |
| L4 | Timers are `(key, token)` in State; no QTimer in a core | stale-timer row |
| L5 | Handlers return Effects; nothing is called from inside `step()` | no executor/runner reference in the core |
| L6 | No re-entrancy; synchronous completions come back as events | shell, not core |
| L7 | Outputs, readiness and display are functions of State; handlers never publish | invariants after every step |
| L8 | Unspecified pair -> `Trace`/`Log`, State unchanged | completeness sweep green; new event has a sweep sample |
| L9 | No behaviour number in a handler; it is a `Policy` field | gate warning `L9-literal` |
| L10 | No blocking wait in the lifecycle | gate `L10-blocking` |
| L11 | Order of events within one input batch is set by the adapter and documented | adapter test |
| L12 | Wire names (tags, fault codes, display names) are stable | string tests |

Smells (section 12): a loose `bool` in State outside any block; `switch(role)` with different
bodies; a helper that publishes; a literal like `2000`, `10`, `3` in a handler. Each means a
block, a policy field or a derived function is missing; fix the shape, not the symptom.

Changing a contract, a law or a block's value set needs an ADR first.
