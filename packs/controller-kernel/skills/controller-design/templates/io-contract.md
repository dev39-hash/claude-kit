# <Controller name>: I/O contract (recipe step 1)

Fill this before anything else. Names written here are the names on the wire (law L12): once the
master's program, the trace format or the manuals use a name, it never changes when
State changes shape.

## 1.1 Inputs from the master (master -> controller)

| Signal / command | Kind | Written by | Edge or level | Becomes (Event) | Also in snapshot? |
|---|---|---|---|---|---|
| `<name>` | bit / word / command | master | edge / level | `<EventName>` or `<A>/<B>` for rise/fall | yes / no |

Kind: bit, word, text command, call. Written by: who may write it (the master only, for inputs).
Edge signals: say what the level means when the master reconnects (unknown until the next
snapshot, unless stated otherwise).

## 1.2 Outputs to the master (controller -> master)

| Signal / reply | Kind | Meaning | Expression over State (filled in step 5) |
|---|---|---|---|
| `<name>` | bit / word | one sentence | `<e.g. readiness().ok()>` |

Every output is a complete value computed from State. Anything that must persist between jobs
(a last result, a latched code) is a State field, not "the old value stays".

## 1.3 Other inputs (devices, timers, lifecycle)

| Input | Source | Becomes (Event) | Carries which id |
|---|---|---|---|
| connection status of role `<r>` | runner `<x>` | `RoleStatus{role, status, epoch}` | epoch |
| completion of `<request>` | `<worker/runner>` | `<RequestDone>` | job / attempt / write id |
| timer | timer service | `Timer{key, role, token}` | token |
| setup / stop | owning task | `Setup{ctx}`, `Stop` | none |

## 1.4 Closed lists (recipe step 2)

Sources and their adapters:

| Source | Adapter | Events produced |
|---|---|---|
| `<signal source>` | `<name>Adapter` | list; batch order: 1) ... 2) ... (law L11) |

Sinks and their effects:

| Sink | Effects |
|---|---|
| master outputs | `PublishOutputs{image}`, `ResetOutputImage` |
| device `<r>` | `Request<...>{id}` |
| timers | `StartTimer{key, role, ms, token}`, `CancelTimer{key, role}` |
| logs, task, UI | `Log`, `Trace`, `Notify{...}` |

Batch order rationale (one line per adjacent pair that matters, e.g. "selection before trigger,
so the trigger is judged against the new selection").

## 1.5 Wire names that are frozen

List fault codes (number, name, meaning), display names, trace formats, and any signal name
imported from an existing contract. Source of each: `<document or code>`.
