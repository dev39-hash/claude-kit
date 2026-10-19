---
paths:
  - "include/**"
  - "**/*_core/**"
  - "**/core/**"
---
# Kernel laws checklist (pack controller-kernel; core code)

> Loads for kernel headers and every core directory. The standard with the full text of each
> law, the contracts, the blocks and the test kit is the `controller-kernel` skill; the kernel
> repository's own documentation wins when it is available. If the project names its core
> directories differently, list them in `packConfig.controller-kernel.coreDirs` and add the
> paths to `.claude/project/rules.md`.

Before finishing an edit to a core or to the kernel, every line below must still hold.

| Law | Must hold | Quick check |
|---|---|---|
| L1 | Only `step()` changes State; everything else public is const | no non-const public member besides `step` |
| L2 | No Qt, device, clock, random, thread, file I/O in a core | gate `L2-purity`, `L2-include` (`gate-check.js`, `kernel-gates` hook) |
| L3 | Each async request has an id owned by one State field; another id -> only a `Trace` | a stale-completion row per request kind |
| L4 | Timers are `(key, token)` in State; no real timer in a core | gate `L4-timer`; a stale-timer row |
| L5 | Handlers return Effects; nothing is called from inside `step()` | gate `L5-callout`; no executor or runner reference in the core |
| L6 | No re-entrancy; synchronous completions come back as events | shell, not core; a test with a runner that refuses synchronously |
| L7 | Outputs, readiness and display are functions of State; handlers never publish | invariants after every step |
| L8 | Unspecified pair -> `Trace`/`Log`, State unchanged | completeness sweep green; a new event has a sweep sample |
| L9 | No behaviour number in a handler; it is a `Policy` field | gate warning `L9-literal` |
| L10 | No blocking wait in the lifecycle | gate `L10-blocking` (shell directories) |
| L11 | Order of events within one input batch is set by the adapter and documented | adapter test with a batch where several signals change |
| L12 | Wire names (tags, fault codes, display names) are stable | string tests |

Smells: a loose `bool` in State outside any block; `switch(role)` with different bodies; a
helper that publishes; a literal like `2000`, `10`, `3` in a handler. Each means a block, a
policy field or a derived function is missing; fix the shape, not the symptom.

Changing a contract, a law or a block's value set needs an ADR first (core rule; the
`architecture-decision-records` skill). The gates are early feedback; the build and the tests
are the source of truth.

The implementer's Dev notes add two lines for a task that touches a core, the kernel or the
shell:

```text
GATES:  gate-check --all: <errors>/<warnings> (L9 warnings listed or explained)
LAWS:   <each law the change touches, and why it still holds>
```
