---
paths:
  - "qt/**"
---

# Qt shell rules

The shell is plumbing, never policy (`docs/controller_kernel.md` sections 3.2-3.5).

- One thread: the shell, executor, adapters and `TimerService` live on the controller thread;
  the core is called only from `Shell::post` (L1).
- No re-entrancy: an effect whose runner answers synchronously posts the completion back
  through the mailbox; never call `step()` from inside effect execution (L6).
- No blocking: no `QEventLoop`, `BlockingQueuedConnection`, `wait()`, `processEvents()`
  anywhere in setup, stop or a cycle (L10). Setup and Stop are events; results are `Notify`.
- Timers: every `QTimer` belongs to `TimerService`, keyed by `(key, role)` and stamped with
  the token from State; a fired timer becomes an event carrying that token (L4).
- Outputs: the executor diffs `outputs()` against the last written image and writes only
  changes; it never decides what to write (L7).
- Adapters translate only: tag map, edge detection, epoch and id stamping, batch order (L11).
  A slot with an `if` about business state is a smell.
- Qt 5 and Qt 6 Core must both compile; the Qt half is opt-in (`CTRL_KERNEL_BUILD_QT`).
