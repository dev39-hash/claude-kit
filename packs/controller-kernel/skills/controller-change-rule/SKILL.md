---
name: controller-change-rule
description: Use when changing a controller's behaviour, threshold, retry count, timeout, readiness condition, output, fault precedence or display on a core built on ctrl_kernel, or when a ruling changes an existing rule. Classifies the change (Policy field, handler row, or derived function), requires the failing table row first, and says when the decision must be recorded.
---

# controller-change-rule: change a rule or a threshold

In a kernel controller a rule lives in exactly one layer. Changing it in the wrong layer is how
a constant ends up in a handler and the same decision gets copied into three places. Classify
first, write the failing row second, change one layer third. Laws and derived-function rules are
in the `controller-kernel` skill. In the kernel repository the full text is
`docs/controller_kernel.md`.

Files by role (worked example in the kernel repository: `examples/localization_core/` and
`tests/main.cpp`):

| Role | File |
|---|---|
| every number and behaviour flag | `policy.h` (`Policy`, `Policy::defaults()`) |
| decisions per event | `<name>_core.cpp`, one `on(const X &, Effects &)` per Event |
| what the master sees | `readiness()`, `outputs()`, `display()` in the same core |
| stable names (fault codes, reasons, display, signals) | `state.h`, the name functions, the wire contract |
| rule tables | the controller's design doc, section "Handlers as rows" |

## When to use / not to use

Use for: "change the retry count", "the trigger should be ignored while X", "ready must also
require Y", "this output should show Z", "fault A now outranks fault B", a ruling that
overturns an earlier one.

Not for: a new event or source (`controller-add-event`); new remembered state
(`controller-add-block`); a brand-new controller (`controller-design`).

## Inputs to gather first

1. The rule as one sentence, plus its reason (which ruling or incident). If the design doc or
   a decision record already holds the old rule, read it first: the old rule may have a reason
   this change would undo.
2. Today's behaviour as a table row: Event | Guard | State change | Effects.
3. The new behaviour as the same row, and which cells of the (State x Event) grid it touches.
4. Who observes it: only the core's internals, or the master (an output, a fault code, the
   lamp, the ready bit)?
5. The tests, docs and wire contract that mention the old rule (grep the number, the reason
   name, the output name, the display name).

## Procedure

1. **Classify.**

   | The change is... | It lives in | Law |
   |---|---|---|
   | a number or an on/off flag (attempts, deadline, cap, hold allowed) | one `Policy` field and its default; no handler edit | L9 |
   | a new decision for an existing event (a new guard or branch) | a handler row, with the new branch's number in Policy | L1, L8, L9 |
   | what ready means, what an output shows, how the lamp reads | `readiness()` / `outputs()` / `display()` only | L7, L12 |
   | a rule several handlers copy ("escalate", "discard") | one derived function or one shared transition, called from the handlers | L7 |
   | a new remembered fact | stop: `controller-add-block` | L7 |
   | a new input or completion | stop: `controller-add-event` | L1, L3 |

2. **Write the failing table row first.** In the test file, through the controller's `Harness`
   (its `checkInvariants()` runs after every step; both live in the test file, not in the kit):
   given a State, step the event, assert the new State,
   Effects, outputs and display. Build and run; confirm it fails for the intended reason (the
   old behaviour), not for a typo.
3. **Make the change in its layer.**
   - Policy: add or edit the field and `Policy::defaults()`. If the old number was a literal
     in a handler, replace it with `m_p.<field>` (the literal was already a L9 defect). Tests
     that need a smaller number set the field on a copy of `Policy::defaults()`; tests read
     the default instead of repeating it.
   - Handler row: add the branch; keep one guard per row; every cell still unspecified leaves a
     Trace or Log explaining the no-op and no State change (L8).
   - Derived function: `readiness()` gets one `if` per reason, in the documented order, no
     "unless" branch; an exception is a parameter of the same function (the example's
     `ignoreTrigger`). `outputs()` stays one expression per signal; anything that must persist
     is State. `display()` keeps its fixed precedence. A readiness change flows to the ready
     output automatically because that output is `readiness().ok()` (L7); do not set it in a
     handler.
   - Wire names (L12): never rename a tag, fault code or display name to fit the change. A new
     reason or display-visible value is added, named once, and frozen. A new display value for
     a combination is a smell: the combination is State, display only projects.
4. **Run everything.** The project's full test target (all KT_TEST rows, the completeness sweep
   and invariants) with the command in `.claude/project/build-env.md`, then the gate tool:
   `node .claude/tools/controller-kernel/gate-check.js --all`. Expected failures in older tests
   are tests that encoded the old rule: change each deliberately and say why in the commit or
   the recorded decision; any other failure is a regression. The invariants and the
   completeness sweep must stay green; a new State field the change introduces is added to the
   sweep's `changed` predicate.
5. **Update the documents.** Handler rows, readiness reason table, output table, Policy table
   (set the status of the field from "needs a ruling" to "ruled" and say by which ruling),
   scenario files that include the changed sequence, and the wire contract if any master-visible
   value changed. Then re-read the rows once against the code.
6. **Decide whether a recorded decision is needed** (below). If yes, record it before merging,
   the way the project records decisions (e.g. an architecture-decision-records skill, if
   present).

## When the change needs a recorded decision

Record one when the change:
- touches a contract (core, adapter, executor, shell, timer service) or a law L1..L12, or the
  value set of a kernel block, or `core_traits.h`;
- changes something the master sees: a signal's meaning, a fault code, a display name, the
  order of events in a batch (L11, L12), the precedence of faults;
- reverses an earlier recorded decision, or adds a behaviour flag that creates a second mode
  of an existing rule;
- chooses between alternatives with real trade-offs (hold vs abort during a loss).

No recorded decision for: tuning a number inside an already-ruled intent; making the code match its design
doc; a pure internal refactor with unchanged tests. Record these in the commit message and
the Policy table status.

## Checklist / Definition of done

- [ ] Change classified; lives in exactly one layer.
- [ ] A failing table row existed first and failed for the right reason.
- [ ] No literal introduced in a handler; Policy field and default added or changed (L9).
- [ ] Master-visible change made in the derived function; no handler publishes (L7).
- [ ] Wire names unchanged or newly frozen; add or update L12 string tests (create them if the
      project has none: output names, fault codes, display names).
- [ ] Invariants and sweep green; deliberate test changes explained.
- [ ] Design doc rows, Policy statuses, scenarios and wire contract updated.
- [ ] Decision recorded if the criteria above hold.

## Smells

The full list is in the `controller-kernel` skill (smells list). Specific to changing a rule:

- A number (`2000`, `10`, `3`) that the change puts into a handler body instead of Policy (L9).
- A rule implemented in the adapter or executor because "that is where the signal is"
  (adapters translate, they never decide).
- A new `bool m_xxx` added so a handler can remember to apply the rule later (L7).
- The same "escalate" / "discard" rule now copied into one more handler: move it into a derived
  function or one shared transition (L7).
- A handler that sets an output "directly" instead of the output following State (L5, L7).

## Worked examples (from the kernel repository: `examples/localization_core/`)

**A. Policy only: the camera should count five failed attempts, not ten.**

```cpp
// policy.h, Policy::defaults()
ctrl::RolePolicy &cam = p.roles[roleIndex(Role::Camera)];
cam.attemptsBeforeFault = 5;            // was 10; the handler is untouched
```

The handler already reads `p.attemptsBeforeFault` in `onCountedFailure`. The test
`camera_lost_counts_ten_failed_attempts_...` hard-codes 10 in its loop and in the
`faultExpected` line; the failing row comes first, then the test is rewritten to read the
number from `Policy::defaults().role(Role::Camera).attemptsBeforeFault`.

**B. Derived function (hypothetical field): ready must also require "no calibration expired".**

```cpp
// state.h: add NotReadyReason::CalibrationExpired and its name in reasonName()
// localization_core.cpp, readinessImpl(): one more if, in the documented order
if (s.config.calibrationExpired(*s.camera.adopted)) r.add(NotReadyReason::CalibrationExpired);
```

`bTaskReady` is `readiness().ok()`, so the output follows with no handler change; the
invariant `readiness().ok() <=> bTaskReady` already covers it. Test row first:
given a ready core with an expired camera, assert `readiness().only(CalibrationExpired)` and
`outputIs("bTaskReady", false)`. The new reason name is a wire name once released (L12).

**C. Policy flag choosing between two handler rows.** `holdWorkDuringCountedLoss` selects
between "hold the cycle" and "abort with the role's code" in `onRoleLoss`. Making the other
choice is a one-field change; adding a third option is a new row plus a new Policy value, and
needs a recorded decision because it creates another mode of the rule.
