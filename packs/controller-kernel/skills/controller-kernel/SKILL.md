---
name: controller-kernel
description: Use when working on any controller built on ctrl_kernel (a pure core, step(Event) -> Effects over an explicit State) and you need the standard itself - terms, the five contracts, the block table, the three derived functions, laws L1..L12 with their checks, the 8-step recipe, the test kit or the smells list - or when another controller-* skill points here.
---

# controller-kernel: the standard for layer A (condensed reference)

Condensed from the kernel repository's `docs/controller_kernel.md`; when that repository is
available, its document wins over this skill.

A controller coordinates several asynchronous devices for one external master under three facts:
a device can drop at any moment, every operation can answer late or never, and the master must
always see one consistent picture. The kernel fixes the shape, the contracts and the laws. A
concrete controller fills in content only: events, effects, state blocks, policy numbers, the three
derived functions and handler rows. Do not generalise before there is a second controller.

## 1. Terms

| Term | Meaning | Not |
|---|---|---|
| Event | A normalised fact that happened; carries a correlation id when it completes a request. | A raw Qt signal; a command. |
| Effect | A request to act on the world, returned by the core (publish, send, timer, log, notify). | A call into a runner from inside the core. |
| State | An explicit struct of orthogonal blocks: everything the core knows. | An enum plus scattered flags. |
| Core | `step(Event) -> Effects` over State; pure C++, no Qt, timers, threads or clock. | A QObject with slots. |
| Policy | Every number and behaviour flag, as data given at construction. | Constants in function bodies. |
| Adapter | Translates a source's signals into Events; stamps ids, epochs, batch order. Never decides. | A slot with business logic. |
| Executor | Carries Effects out in order; owns timers and the last written output image. | Where "should we write" is decided. |
| Shell | Owns core, executor, adapters: mailbox, non-re-entrant dispatch, thread affinity. | A holder of business state. |
| Role | A named device position (plc, camera, output, robot): a capability, not a device family. | A concrete runner type. |
| Correlation id | Monotonic number on a request; only a completion with the current id is acted on. | A signal/slot connection. |
| Epoch | Bumped when a role is rebound; a status with an older epoch is dropped. | |
| Token | The correlation id of a timer slot. | |
| Readiness | Derived: Ready, or NotReady with the full list of reasons. | A stored state. |
| OutputImage | The desired value of every output, computed from State. | A sequence of writes. |

## 2. The shape

```text
 master (PLC/TCP/UI) -> adapter -> Event \
 device roles x N    -> adapter -> Event  --> mailbox --> Core::step --> Effects --> Executor
 compute workers     -> done(id)-> Event /   (one thread)      |                     -> outputs (diff)
 timers              -> Timer(token)-> Event                  State, Policy          -> runner commands (id)
 host lifecycle      -> Setup / Stop            readiness / outputs / display        -> timers, log, notify
 completions return to the adapters carrying the id or epoch the executor stamped
```

- The mailbox is the controller thread's event loop: one entry point plus a small internal queue
  that prevents re-entry. No hand-written threads.
- State is a product of blocks, not an enum. Names shown to the UI and the master are a
  projection, so wire names stay stable while the structure inside changes.

## 3. The five contracts

**Core.** A class `C` is a core when `ctrl::is_controller_core<C>::value` holds
(`core_traits.h`): nested `Event`, `Effect`, `State`, `Policy`; `std::vector<Effect>
step(const Event &)`; `const State &state() const`; `readiness()`, `outputs()`, `display()`. End the
core header with a `static_assert` on it. Behaviour the type cannot express: `step()` is total
(an unspecified pair leaves a Trace or Log explaining the no-op and no State change); pure (same
State and Event give the same State and Effects; no clock, no random; ids are counters in State and
time enters as event fields); non-re-entrant and non-blocking; and at the end of every `step()` the
core compares `display()` and `outputs()` with the previous step and appends `Trace`,
`PublishOutputs` and `Notify` itself (a `finish()` helper). Handlers never publish.

**Adapter (ingress).** `bind(sink)` / `unbind()`. Keeps only what translation needs: the previous
level of an edge signal, the current epoch per role, the tag-to-name map. Obligations: every
completion carries the id the executor stamped on the request; one master batch is split into
Events in an order the design documents; at bind time it emits one synthetic `RoleStatus` with the
live status and a new epoch, so the core never reads a device.

**Executor (egress).** `run(effects, post)`: executes in vector order; owns the output diff
publisher, the timer service and the role-to-runner table. A synchronous completion (a runner
refusing at once) is handed to `post`, never fed to `step()` inline.

**Shell.** `ControllerShell<Core, Executor>`: `post(Event)` from any thread; `dispatch()` drains an
internal deque with a draining guard, so an event posted during effect execution runs after the
current step. No blocking queued connection, no nested event loop. The owning task only posts
`Setup`/`Stop` and listens for `Notify`.

**TimerService.** `StartTimer{key, role, ms, token}` re-arms the slot (the earlier arming is
superseded); `CancelTimer{key, role}` is idempotent; `Timer{key, role, token}` is dropped by the
core when the token is not the slot's current one. The core never needs to know whether a
cancellation reached the real timer in time.

## 4. Reusable state blocks (`ctrl_kernel/blocks.h`)

Each block has a closed value set, the events it consumes, the effects it emits, invariants and
policy knobs. Pick the blocks the I/O contract names; a block that cannot be named from the I/O
description is not used. A block holds facts; `step()` changes it; the derived functions read it.

| Block | Values | Consumes | Emits | Invariants | Policy | Use instead of |
|---|---|---|---|---|---|---|
| `Lifecycle` | `Idle, Starting, Live, Stopping` | `Setup`, `Stop`, start-step completions, start/stop deadlines | connect/disconnect requests, `StartTimer`, `Notify{SetupResult, Stopped}` | not Live implies NotReady[NotLive]; every waiting state has a deadline | start deadline, stop deadline, connect order | setup/teardown in the adapter with a nested event loop or blocking call |
| `Job<Phase>` | `phase`, `id`, `held in {None, Request, Job}` | start commands, `StageDone{jobId}`, stage deadlines, master ack | `RequestStage{jobId}`, `StartTimer`, `Notify{JobStarted, JobResult}` | a `StageDone` with another id is dropped; in flight or held implies busy; held work re-runs from stage 1 | stage deadlines, hold allowed and when | a job id kept in the adapter plus a busy flag |
| `RoleHealth` (x N) | `Unknown, Connected, Lost, Parked, Deliberate`; `failedAttempts`, `lastAttempt`, `attemptInFlight`, `faultRaised`, `selfRedialing`, `epoch` | `RoleStatus`, `ConnectAttemptDone`, reconnect and deadline timers | `RequestConnect{attemptId}`, `RequestDisconnect`, `StartTimer`, `Log` | older epoch dropped; other attempt id dropped; Parked neither counts nor faults; a role that parks others being lost implies its dependents are Parked | `RolePolicy`: attempts before fault, two intervals, attempt deadline, parks others, parked behind, self-redial allowed, fault code | a hand-counted retry integer next to a timer and a connected flag |
| `Latch<T>` | `Adopted(v, source)`, `Refused(v)`; last good value kept | `Select`, `TypeMismatch`, startup snapshot | none | only an accepted value for the same signal clears Refused; an acknowledge does not; Refused implies NotReady | range and registration checks | a pair of loose flags per selection (value, refused) |
| `FaultRegister<Code>` | `None`, `Latched{code, origin}` | internal `raise`, `ErrorResetRise` | none | first raise wins; only ack or Setup clears; Latched implies fault outputs | code precedence, whether ack opens a fresh retry window | a `bool m_fault` plus a code set from several places |
| `EdgeInput` | `level`, `known` | snapshot levels, `Rise`/`Fall` | none | master lost implies `known = false` until the next snapshot; gates read the level only when known | none | previous-level booleans kept in handlers or adapters |
| `HandshakeWrites` (planned) | `pending: writeId -> {signal, value, attempts}` | `WriteDone`, retry timer | write requests | only handshake tags tracked; not while the master is disconnected; an exhausted budget raises the write fault, never fakes a job completion | handshake tag set, budget, delay | fire-and-forget writes with ad hoc retry |
| `Timers` | `(key, role) -> {token, armed}` | none | none | a `Timer` with another token or a disarmed slot is dropped; tokens are monotonic | none | `singleShot` lambdas or one timer member per deadline |

Reusable blocks are added to the kernel only when a second controller names the need; until then
a block is controller-local, written exactly like a kernel block.

## 5. The three derived functions

| Function | Returns | How to write it | Used by |
|---|---|---|---|
| `readiness()` | `Ready` or `NotReady{reasons}` | one `if` per reason, no "unless" branches; an exception (held work ignores the trigger gate) is a parameter of the same function; the reason list is a closed enum with names | start handlers, `display()`, the "why not ready" log |
| `outputs()` | a complete `OutputImage` | each output is one expression over State; nothing "keeps the old value" (what persists, like the last result, lives in State); the name-to-expression table is the output contract | the core at the end of every step; the executor's diff |
| `display()` | the controller's display enum | fixed precedence (busy, faulted, recovering, ready, not ready); stable names: the UI, the trace and the manuals use them | the lamp, the trace line, the state the host exposes |

## 6. Twelve laws

| Law | Statement | Check |
|---|---|---|
| L1 | One entry point: every event goes `Shell::post -> Core::step`; no other public member changes State | public API is `step` and const getters |
| L2 | The core never peeks at the world: no device/runtime includes, no clock, no random | include rule in the consuming project; review |
| L3 | Every async request has an id held as current by exactly one field of State; another id produces only a `Trace` | a stale-completion test per request kind |
| L4 | Every timer has a key and a token; the core owns no real timer | grep for the timer class in the core = 0; a stale-timer test |
| L5 | Effects run after `step()` returns, in order; handlers call nothing outside | the core holds no executor reference; executor harness records order |
| L6 | No re-entrancy: a synchronous completion is posted back, not handled inline | a test with a runner that refuses synchronously; a debug assertion in the shell |
| L7 | Outputs are a function of State; no publish path but `outputs()`; the executor only diffs | invariants `readiness().ok() <=> ready output`, `fault latched <=> fault output` after every step |
| L8 | An unspecified (State, Event) pair is ignored and says so: no crash, no silent action, no State change | the completeness sweep |
| L9 | Numbers are policy and policy is data; no behaviour constant in a handler | grep for numeric literals beyond 0/1 in the core; review |
| L10 | No blocking wait in the lifecycle; Setup/Stop are events, results are Notify | grep for event-loop waits, blocking connections, `wait(` in shell and task = 0 |
| L11 | The order of events within one input batch is set by the adapter and written in the design | an adapter test with a batch where several signals change at once |
| L12 | Names on the wire are stable: tags, fault codes, display names do not change when State changes shape | string tests on the display enum and the output table against the contract |

A controller that breaks a law is outside the kernel and loses the guarantees of the test kit.

## 7. The recipe (eight steps, one deliverable each)

1. **I/O contract.** Inputs from master and devices (name, kind, who drives, edge or level);
   outputs to the master (name, kind, meaning). This spec exists on day one.
2. **Sources and sinks, closed lists.** One adapter per source, one effect group per sink. Write the
   batch order (L11).
3. **Pick blocks** that the I/O names. Record why a block is not used. List the roles and each
   role's `RolePolicy`.
4. **Write `Policy`.** Every number, including unknown ones, with a guessed default and a status
   ("ruled" or "needs a ruling"). A later ruling changes one field.
5. **Write the three derived functions first.** They describe what the master sees and can be
   reviewed against the I/O contract before any handler exists.
6. **Write handlers as rows.** One function per Event; each is a few rows (guard, State change,
   Effects). A pair not covered leaves a Trace or Log explaining the no-op and no State change.
7. **Run the completeness sweep and the invariants.** Ship when every cell has a decision or a
   deliberate no-op, and every invariant is green.
8. **Scenarios.** Five to eight event sequences with State deltas and Effects, including: the
   normal run, a role lost mid-job, the master lost, an acknowledge while a role is still down, a
   stop during start-up.

**Definition of done for a controller design:** I/O tables complete; adapter and effect lists
closed; State is a product of chosen blocks with no loose flag; Policy holds every number; the
three derived functions have tables; the (State x Event) grid generated by the sweep has no empty
cell; invariants are green; the minimum scenarios exist; names on the wire match the contract.

## 8. The test kit

The kit file (`kernel_test_support.h`, header-only, no Qt) provides exactly three things: the
`KT_TEST(name)` registry and runner, the `KT_CHECK(cond)` macro, and
`kt::completenessSweep<Core, Event>(makeStates, samples, isExplained, changed, describe)`. Everything
else is written once per controller in its own test file; copy the pattern of the worked example
(in the kernel repository: `tests/main.cpp`, struct `Harness`).

| Part | Where it comes from | What it does | Catches |
|---|---|---|---|
| test registry, `KT_CHECK` | kit | plain console program, no threads, timers or Qt | - |
| `completenessSweep` | kit | every (prepared State, sample Event) pair must not throw and must change State or leave a `Trace`/`Log` | the unthought-of cell (L8) |
| `Harness` (table fixture) | controller's test file | wraps one core; `step(ev)` records effects and calls `checkInvariants()` after every step; helpers to reach states and read effects (`countLast<T>`, `findLast<T>`, `fire(timer)`) | wrong rules, regressions when a policy changes |
| `checkInvariants()` | controller's test file | the block invariants of section 4 plus the controller's own, as `KT_CHECK`s over State and outputs | State and outputs drifting apart (L7) |
| stale-completion probe | controller's test file | issue a request, advance the id (abort, restart), feed the old completion, assert only a `Trace` with note "stale" and State unchanged | L3, L4 |
| executor harness (planned) | not provided | the real executor with a fake runner that records commands and may refuse synchronously | write order, re-entrancy (L5, L6) |
| replay (planned) | not provided | feed trace lines from a recorded log back into the core, compare Effects | bench versus deployed differences |
| real-path tests | controller's project | a few tests through shell, adapters and a simulated master | wiring and thread-affinity defects |

Sweep rules: one sample per Event alternative; add a check that the samples cover every
alternative (`samples.size() == std::variant_size_v<Event>`), because the compiler forces handlers
but not samples; the `changed` predicate must compare every State field a handler can touch, or a
real change reads as a silent no-op. Test numbers come from `Policy::defaults()` or a named local
override, never literals that duplicate a default.

## 9. Where the code lives

| Part | Typical path | Depends on | Content |
|---|---|---|---|
| kernel | `ctrl::kernel` target or `include/` | standard C++ only | `ids.h`, `readiness.h`, `output_image.h`, `common_effects.h`, `blocks.h`, `core_traits.h` |
| a controller's core | `<name>_core/` | the kernel; domain value types by reference | `events.h`, `effects.h`, `state.h`, `policy.h`, `<name>_core.h/.cpp` |
| a controller's shell | beside the core | Qt, the shell library, the core | concrete executor, adapters, the class the application uses |
| tests | `tests/` | kernel and core | the kit plus one test file per controller |

Include rules to enforce in the consuming build: a core directory never includes device, runtime or
UI layers, `<QObject>` or `<QTimer>`; kernel headers include only the standard library.

## 10. Smells that mean the kernel is being left

- A new `bool m_xxx` in State that belongs to no block, with a comment on when it is set and
  cleared: usually a missing readiness reason or block value (L7, section 4).
- A device call or a clock read (`runner->device()->...`, current date-time) inside a core (L2).
- A completion tied to a job by connection (single-shot connection) instead of by id (L3).
- A one-shot timer with a lambda capturing `this` (L4).
- A handler calling `publish...()` or `emit` (L5, L7).
- An "escalate" or "discard" helper called from more than three places: a rule being copied
  instead of living in a derived function (L7).
- A `switch (role)` with different bodies per role in a handler: the difference is a `RolePolicy`
  field (L9).
- `2000`, `10`, `3` in a handler body (L9).
- A nested event loop or blocking queued connection in a task or shell (L10).
- A new display value added to describe a combination: combinations belong to State, display only
  projects (L12).
