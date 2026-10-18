---
name: controller-add-event
description: Use when adding a new event, input signal, device completion, timer kind or command source to a controller core built on ctrl_kernel. Walks the fixed path from the Event variant through adapter batch order, handler rows, id/epoch/token handling, derived outputs, table tests, completeness sweep and docs.
---

# controller-add-event: add an Event (or a new event source) to an existing core

A controller core is `step(Event) -> Effects` over an explicit State. Anything new that can
happen to it enters as one Event through the one entry point (law L1). This skill is the
repeatable path; skipping a step is how a core grows a silent cell. Laws, blocks and the test kit
are in the `controller-kernel` skill. In the controller-kernel repository the full text is
docs/controller_kernel.md.

Files by role (names are the kernel's convention; the worked example in the controller-kernel
repo is `examples/localization_core/` with `tests/main.cpp`):

| Role | File |
|---|---|
| events (variant, event names, timer keys) | `events.h` |
| effects the core may return | `effects.h` |
| State, enums for reasons / display / phases | `state.h` |
| every number and flag | `policy.h` |
| handlers and derived functions | `<name>_core.h/.cpp` |
| tests, `Harness`, `checkInvariants()`, sweep | the controller's test file (uses the kit's `KT_TEST`, `KT_CHECK`, `completenessSweep`) |
| design document (handler rows, I/O contract) | the controller's design doc |

## When to use / not to use

Use for: a new signal from the master; a new device completion; a new timer key; a new command
source with new meaning (a Cancel, a manual trigger); a new status kind.

Not for:
- a new SOURCE of an event the core already has (a second TCP adapter producing the existing
  `TriggerRise`): that is an adapter-only change and the core directory must not change. If the
  core has to change, the meaning is new and this skill applies.
- a changed threshold or a changed answer to an existing event: `controller-change-rule`.
- new state with its own value set: `controller-add-block` first, then come back here.

## Inputs to gather first

1. What happened, as a fact in the past tense, and who observes it (which adapter or runner).
2. Does it complete a request? If yes: which request, and where in State the current id lives.
3. Which phases / lifecycle states / roles can the event arrive in (the whole row set).
4. Does the master see any difference afterwards (ready, an output, a fault, the lamp)?
5. Is it a signal that can arrive in the same batch as others (then batch order, L11)?
6. The numbers involved (deadlines, caps): each becomes a Policy field.

## Procedure

1. **Define the Event** in `events.h`: a plain struct, normalised, no Qt, runner or device
   types (opaque handles and summaries only). If it completes a request it carries the id the
   request carried (`ctrl::JobId`, `AttemptId`, `WriteId`) or the binding `Epoch`; a timer
   carries `{key, role, token}`. Add it to the `Event` variant and to the `eventName()` visitor.
   Law: L1, L2, L3.
2. **Fix the adapter side and the batch order.** Name the adapter that produces it; write down
   where it falls among the events of one input batch and why (L11). Add or extend an adapter
   test with a batch where several signals change at once. For a level that also arrives in a
   snapshot, say so in the snapshot event. Law: L11.
3. **Write the rows first** in the design doc: for every (State, Event) cell that matters one
   row: guard, State change, Effects. Cells you do not act on are rows too: "ignored" with a
   Trace or Log explaining the no-op and no State change. Law: L8.
4. **Add the handler** `on(const NewEvent &, Effects &)` to the core header and cpp (the
   `std::visit` dispatch will not compile until it exists). Handlers only edit State and push
   Effects: no publish, no emit, no device call, no clock (L2, L5, L7). Reuse the block
   transitions (`accept`, `refuse`, `begin`, `end`, `learn`, `forget`, `arm`) rather than
   setting fields by hand.
5. **If it completes a request, apply the id rule.**
   - Compare the id with the one State currently owns (`cycle.accepts(id, phase)`,
     `role.isCurrentAttempt(id)`, an epoch comparison, `timers.isCurrent(slot, token)`). A
     mismatch produces exactly a `Trace` with note "stale" and no State change (L3, L4).
   - The request Effect carries the id; exactly one field in State owns "current".
   - Every path that abandons the request (abort, hold, stop, rebind) bumps the id or disarms
     the slot, so the late answer is stale. A new timer key: arm through the core's `arm()`
     helper, disarm on every exit path, add a case in the `Timer` handler.
   - A new request kind needs a new id family (`ctrl::StrongId<MyTag>` in the controller).
6. **Policy.** Any number or behaviour flag introduced goes to `policy.h` with a default
   (L9). The handler reads `m_p.<field>`.
7. **Derived impact.** Decide for each of `readiness()`, `outputs()`, `display()` whether the
   event changes the answer. Change them there, never in the handler (L7). A new not-ready
   reason is a new enumerator plus its name in the name function and one `if` in
   `readiness()`. A new output or fault code is a wire name: freeze it (L12).
8. **Table tests.** Through the controller's `Harness` (it calls `checkInvariants()` after every
   step; both live in the controller's test file, not in the kit): one test per row group: given a State (a helper that reaches it from events), step the
   event, assert State, Effects, outputs and display. At least one test per guard branch.
9. **Completeness sweep (L8).** Add one sample of the new event to the sample list. If it
   matters in a State the prepared-state list lacks, add that state. If the event changes a
   State field the sweep's `changed` predicate does not compare, add the field to it (or the
   cell will report a silent no-op). Keep a check that the samples cover every alternative
   (`samples.size() == std::variant_size_v<Event>`); the compiler forces handlers but does not
   force samples.
10. **Invariants.** If the event creates a relationship that must always hold (a new
    "implies"), add it to `checkInvariants()` in the test file. Existing checks (`readiness().ok()` iff the
    ready output; fault latched iff fault output) must stay green.
11. **Stale-completion probe** (only when step 5 applies): issue the request, advance the id
    (abort or restart), feed the old completion, assert the Effects are only a `Trace` with
    note "stale" and State is unchanged.
12. **Scenario and docs.** Update any scenario whose sequence now includes the event; add the
    handler rows to the design doc; add the signal to the I/O contract if it comes from the
    master; update the adapter list. Run the project's full test target (all KT_TEST rows, the
    completeness sweep and invariants); in controller-kernel: `node .claude/tools/build.js all`.
    If the project has a gate tool (controller-kernel: `.claude/tools/gate-check.js`), run it.

## Checklist / Definition of done

- [ ] Event struct, variant entry and `eventName()` entry exist.
- [ ] Adapter and batch position written; a batch test exists (L11).
- [ ] Rows in the design doc; handler added; every other cell is "ignored" with a Trace or Log (L8).
- [ ] Completion events: id/epoch/token compared, stale = Trace only (L3, L4).
- [ ] No number in the handler body (L9); no publish or emit in a handler (L5, L7).
- [ ] readiness / outputs / display reviewed; wire names unchanged or newly frozen (L7, L12).
- [ ] Table tests per branch; sweep sample (and state, and `changed` field) added; the sample
      count still equals `std::variant_size_v<Event>`.
- [ ] Stale probe present if a request completes; scenario and docs updated; all tests green.

## Smells

The full list is in the `controller-kernel` skill (smells list). Specific to adding an event:

- A `bool m_xxx` added "to remember the event happened": a missing block value or readiness
  reason (L7).
- The completion matched by connection or by "latest wins" instead of an id (L3).
- A one-shot timer for the new deadline: a `StartTimer` effect with a token (L4).
- A new display value for "event happened and X": the display only projects State (L12).
- A handler that publishes, emits or calls an executor, or a number or blocking wait in the
  handler: see the reference (L5, L7, L9, L10).

## Worked example (from the controller-kernel repo: `examples/localization_core/`, event `GrabDone`)

`events.h` -- the completion carries the job id; variant and name entry follow:

```cpp
struct GrabDone { ctrl::JobId id; bool ok{false}; int frameRef{0}; };
using Event = std::variant<..., GrabDone, MatchDone, SendDone, Timer, RoleError>;
```

`localization_core.cpp` -- the stale guard first, then the rows (guard, State change, Effects):

```cpp
void LocalizationCore::on(const GrabDone &e, Effects &fx)
{
    if (!m_s.cycle.accepts(e.id, Phase::Grabbing)) {
        trace("GrabDone", "stale", display(), fx);      // L3: Trace only
        return;
    }
    fx.push_back(ctrl::CancelTimer{static_cast<int>(TimerKey::GrabDeadline), -1});
    m_s.timers.disarm({static_cast<int>(TimerKey::GrabDeadline), -1});
    if (!e.ok) { abortCycle(FaultCode::CameraGrabTimeout, "...", fx); return; }
    m_s.cycle.phase = Phase::Matching;
    fx.push_back(RequestMatch{m_s.cycle.id, m_s.group.adopted.value_or(0), e.frameRef});
}
```

`abortCycle()` calls `m_s.cycle.id.next()`, which is what makes the runner's late retry stale.
The stale probe in the test file (`late_completions_from_an_earlier_cycle_are_dropped_by_id`):

```cpp
h.step(GrabDone{old, false, 0});                 // aborts, fault latched
h.step(GrabDone{old, true, 5});                  // late answer
KT_CHECK(h.countLast<RequestMatch>() == 0);
KT_CHECK(h.findLast<ctrl::Trace>()->note == "stale");
```

Sweep: the sample list contains `GrabDone{JobId{1}, true, 1}`, run against nine prepared
states. Timers follow the same shape: `Timer{key, role, token}` is dropped unless
`m_s.timers.isCurrent(slot, token)`.
