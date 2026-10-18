---
paths:
  - "qt/**"
  - "**/*shell*/**"
  - "**/adapters/**"
  - "**/adapter/**"
---
# Qt shell rules (pack controller-kernel)

> Loads for the shell, executor and adapter code of a controller. The shell is plumbing, never
> policy (the `controller-kernel` skill, contracts: Adapter, Executor, Shell, TimerService).

- One thread: the shell, executor, adapters and the timer service live on the controller
  thread; the core is called only from `Shell::post` (L1).
- No re-entrancy: an effect whose runner answers synchronously posts the completion back
  through the mailbox; never call `step()` from inside effect execution (L6).
- No blocking: no `QEventLoop`, `BlockingQueuedConnection`, `wait()`, `processEvents()`
  anywhere in setup, stop or a cycle (L10; gate `L10-blocking`). Setup and Stop are events;
  results are `Notify`.
- Timers: every `QTimer` belongs to the timer service, keyed by `(key, role)` and stamped with
  the token from State; a fired timer becomes an event carrying that token (L4).
- Outputs: the executor diffs `outputs()` against the last written image and writes only
  changes; it never decides what to write (L7).
- Adapters translate only: tag map, edge detection, epoch and id stamping, batch order (L11).
  A slot with an `if` about business state is a smell.
- Every Qt version the project supports must compile the shell; when the Qt half is a build
  option, `.claude/project/build-env.md` names the option and the command that builds it.
