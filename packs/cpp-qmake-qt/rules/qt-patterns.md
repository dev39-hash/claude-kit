---
paths:
  - "**/*.cpp"
  - "**/*.h"
  - "**/*.hpp"
---
# C++ / Qt patterns (pack cpp-qmake-qt)

> Adapted from ECC rules/cpp/patterns.md (MIT) through the ncr_picking and NichirinLaserMark
> adaptations. `project/rules.md` names the error strategy (exceptions at the boundary, or
> none at all) and the threading model.

## RAII and special members

- Tie every resource (file, socket, SDK handle, camera buffer, process, thread, lock) to an
  object lifetime; release on every exit path.
- Rule of Zero by default; defining one of destructor / copy / move means defining or
  deleting all five. `QObject` subclasses are non-copyable already.

## Value semantics

- Small trivially-copyable types by value; large types by `const&`; return by value.
- Qt containers and `QString` are implicitly shared: pass by `const&`, avoid accidental
  detach; `cv::Mat`-like types copy cheaply but share data; clone at ownership boundaries,
  not by habit.

## Errors

- `std::optional` for "may be absent"; Qt APIs report by `bool`, status or signal: check every
  one (`QFile::open`, `write`, `QJsonDocument::fromJson`, replies, `exec`).
- Exceptions, when the project allows them, are caught before a thread boundary; nothing
  (`cv::Exception`, SDK exceptions) escapes a worker thread. Projects without exceptions return
  `bool` / rc / enum / `std::optional` or report by signal, then log with context.
- Never collapse a failure into a default value without logging it; SDK return codes keep
  their meaning end to end.

## Threading

- Respect thread affinity; cross threads only through queued signals or `invokeMethod`.
- Types crossing a queued connection need `Q_DECLARE_METATYPE` + `qRegisterMetaType`; an
  unregistered `enum class` is silently dropped.
- Timers that must follow `moveToThread` are parented; lambda connections need a context
  object; no `QThread::terminate()`; a thread is waited unbounded before its data dies (a
  bounded `wait()` that times out deletes a running thread).
- Never emit a signal while holding a mutex; no nested `QEventLoop` re-entrancy;
  no `BlockingQueuedConnection` from the GUI thread.
- In polled loops react to a change by comparing STATE, not by catching an EDGE: an edge that
  arrives while busy is lost; a latched result is not cleared by an unrelated event.

## Configuration compatibility

- New JSON/config keys are optional on load; `verify()` must not start rejecting configs
  saved on installed machines; a persisted schema does not pick up a changed resource
  default on machines that already saved one.

## Qt / widgets

- `setStyleSheet` and theme tokens per `qss-theming.md`; promoted widgets at global scope;
  `findChild` / `qobject_cast` results null-checked.
- Model/view: `beginInsertRows` / `endInsertRows` balanced; never read a stale
  `QModelIndex` after a removal; proxies and delayed layouts are the classic use-after-free.
