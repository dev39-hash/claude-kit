---
name: controller-design
description: Use when designing a NEW controller on ctrl_kernel (a pure core that takes events from one master and several asynchronous devices and returns effects), or when a design document, I/O contract, policy table or scenario list is needed for such a controller. Drives the kernel's 8-step recipe, fills the templates in templates/, and scaffolds the code files once the design is accepted.
---

# controller-design: the 8-step recipe for a new controller

The `controller-kernel` skill fixes the shape, the five contracts and the twelve laws (L1..L12).
A new controller fills in content only: its events, effects, state blocks, policy numbers, three
derived functions and handler rows. This skill produces the design document that makes that
content reviewable BEFORE any handler exists, then scaffolds the code. In the kernel
repository the full text of the standard is `docs/controller_kernel.md`.

## When to use / not to use

Use when:
- a new controller is being started (a task that coordinates devices for a master: PLC, TCP
  command source, UI, robot);
- an existing controller is being re-expressed on the kernel and needs its design written down;
- someone asks for "the I/O table", "the policy table" or "the scenarios" of a controller.

Do not use when:
- the controller already exists and a signal, event, block or rule changes: use
  `controller-add-event`, `controller-add-block` or `controller-change-rule`;
- there is a single synchronous device and no master handshake: the kernel is not warranted (a
  kernel controller exists to hold late, lost and duplicated answers from several devices).

## Inputs to gather first

1. The master and how it talks (tags, a TCP grammar, UI calls). Any existing wire contract:
   signal names, fault codes, display names. Those are frozen from day one (L12).
2. Every device role and what each can do wrong: drop, answer late, never answer.
3. The job, if any: its stages and who completes each stage.
4. The numbers already known (timeouts, retry counts, caps) and the unknown ones.
5. Where the design document will live in the consuming project, and where the core directory
   will live (recommended: `<name>_core/` beside a `tests/` directory).

## Procedure

Copy `templates/design-doc.md` to the project's docs and fill it in order. Each step has one
deliverable; do not start step N+1 with step N unreviewed.

1. **I/O contract.** Fill `templates/io-contract.md`: inputs from the master (name, kind, writer,
   edge or level), inputs from devices, outputs to the master (name, kind, meaning). Mark each
   edge input also as a level in the snapshot. Protects: L12 (names on the wire).
2. **Sources and sinks, closed lists.** One adapter per source, one effect group per sink.
   Write the batch order in which one input batch from the master is split into events (L11).
   State that each adapter emits a synthetic `RoleStatus` with a new epoch at bind time and that
   every completion echoes the id the executor stamped (L3). Protects: L11, L3, L2.
3. **Pick blocks** from the `controller-kernel` skill (blocks table) that the I/O names.
   Table: block, instance, why needed / why NOT used. A block that cannot be named from the I/O
   description is not used. List roles and each role's `RolePolicy`. Anything state-like that
   fits no block is a candidate for `controller-add-block`, not a loose bool.
4. **Write `Policy`.** Every number and behaviour flag, including unknown ones, with a guessed
   default, unit, and a status of "ruled" or "needs a ruling". Protects: L9.
5. **Write the three derived functions first.** `readiness()`: ordered closed enum of reasons,
   one `if` per reason, exceptions as a parameter of the same function. `outputs()`: one
   expression over State per output name. `display()`: fixed precedence, stable names. These
   are what the master sees; they are reviewed against the wire contract before any handler.
   Protects: L7, L12.
6. **Write handlers as rows.** One handler per Event; each row is (guard, State change,
   Effects). Every (State, Event) pair not covered is written as "ignored: leaves a Trace or Log
   explaining the no-op and no State change" -- never silent. Protects: L1, L3, L4, L5, L6, L8.
7. **Plan the completeness sweep and the invariants.** List the prepared states and the one
   sample per event kind (the sweep also checks that the sample count equals the number of
   Event alternatives); list the invariants (at minimum: `readiness().ok()` iff the ready
   output; fault latched iff the fault output; plus each chosen block's invariants). Protects: L7, L8.
8. **Scenarios.** Fill `templates/scenario.md` for five to eight event sequences. Minimum set:
   the normal run; a role lost mid-job; the master lost; an acknowledge while a role is still
   down; a stop during start-up. Each shows State deltas and Effects per step.

## Scaffold (after the design is accepted)

Instantiate `templates/code/` (this skill's folder) into the project. The templates compile as
they are and form a minimal working controller: one Setup/Stop lifecycle, one Job, one role, one
fault, the three derived functions, a Harness with `checkInvariants()`, a completeness sweep and
one stale-completion probe. They are modelled on the worked example (in the kernel
repository: `examples/localization_core/` and `tests/main.cpp`).

Placeholders: `{{name}}` snake_case controller name; `{{Name}}` PascalCase; `{{ns}}` the full
C++ namespace (for example `ctrl::pump` or `myapp::pump`); `{{NAME}}` UPPER_SNAKE, used only in
include guards.

| Template | Becomes |
|---|---|
| `events.h.tmpl` | `<name>_core/events.h` |
| `effects.h.tmpl` | `<name>_core/effects.h` |
| `state.h.tmpl` | `<name>_core/state.h` |
| `policy.h.tmpl` | `<name>_core/policy.h` |
| `core.h.tmpl` | `<name>_core/<name>_core.h` |
| `core.cpp.tmpl` | `<name>_core/<name>_core.cpp` |
| `core_test.cpp.tmpl` | the controller's test file, e.g. `tests/<name>_core_test.cpp` |

Steps:
1. Copy each file, substituting the placeholders in the text and in the file names.
2. Build the core as a static library on the include paths of the kernel and of the project's
   core directory parent (headers are included as `"<name>_core/events.h"`); build the test
   executable with the kernel test kit header (`kernel_test_support.h`) on its include path. Keep
   exactly one `main()` per test executable (delete the one in the test template if the project
   already has a runner).
3. Build with the project's strict warning flags and run the project's full test target. The six
   scaffold tests pass before any edit; if they do not, fix the instantiation first.
4. Replace the placeholder content with the accepted design, in the order of the recipe: roles and
   `Policy`, events, effects, state and blocks, the three derived functions (and their tests), then
   one handler row group at a time, each with its table tests. Extend the sweep's samples, prepared
   states and `changed` predicate as events and State fields appear. Keep the `static_assert` on
   `ctrl::is_controller_core`.
5. Remove what the design does not use (the single role `Device`, the fault codes, reasons and
   outputs of the scaffold are placeholders), but keep the structure: handlers as
   `on(const X &, Effects &)` overloads, `finish()` appending Trace and PublishOutputs, derived
   functions recomputing from State.

## Checklist / Definition of done

- [ ] I/O tables complete: every master signal has a kind, a writer, and an event or output.
- [ ] Adapter list and effect list are closed; batch order is written (L11).
- [ ] State is a product of chosen blocks; no loose flag (or each exception is named in the
      document, justified, and has as few readers as possible).
- [ ] Policy holds every number, each with a status (L9).
- [ ] readiness, outputs and display each have a table.
- [ ] The (State x Event) grid has no empty cell: each cell is a decision or a deliberate
      "ignored + Log/Trace" (L8).
- [ ] Invariants listed and each one is expressible as a check on State and outputs.
- [ ] Minimum five scenarios exist.
- [ ] Names on the wire (tags, fault codes, display names) match the contract (L12).
- [ ] After scaffolding: the instantiated tests build and pass before the design content goes in.

## Smells (see the `controller-kernel` skill, smells list; design-time wording to catch)

- "The handler asks the device": a core reading the world (L2). The adapter must push it as an
  event, including a bind-time snapshot.
- "Wait until the device answers" in start or stop: Starting/Stopping states with deadlines (L10).
- A request in the design with no id, or an id owned in two places (L3).
- A number in a handler sketch (`2000`, `10`): it is a Policy field (L9).
- A planned display value that names a combination ("ReadyButRecovering"): combinations belong
  to State; display only projects (L12).

## Worked example (from the kernel repository: `docs/localization_example.md`)

Step 1, one row each of inputs and outputs:

```text
| bExecuteTrigger | edge  | master | TriggerRise / TriggerFall; level also in PlcSnapshot |
| nActiveCamera   | level | master | SelectCamera{n}, or IndexTypeMismatch; value in PlcSnapshot |
| bTaskReady      | bit   | task   | readiness().ok()                                    |
```

Step 2, batch order: snapshot levels, SelectCamera, SelectGroup, ErrorResetRise,
TriggerRise/TriggerFall (so a selection change in the same batch is applied before the trigger
is judged).

Step 3, a block table row and a recorded non-use:

```text
| Latch<int> x 2 | camera, group | a refused selection must be remembered, not re-derived |
| HandshakeWrites | not used     | out of scope for this example; tracked as a later package |
```

Step 5, the readiness reason list is ordered and closed:
`NotLive, SetupInvalid, PlcDown, OutputDown, CameraDown, CameraRefused, GroupRefused,
CalibrationInvalid, GroupUnusable, FaultLatched, CycleBusy, TriggerHigh`.

Step 8, scenario "camera lost mid-cycle": TriggerRise -> Running; RoleStatus(Camera, Lost) ->
cycle held, `bMatchingBusy` stays 1, no fault; late GrabDone dropped by id; camera Connected ->
cycle re-runs from stage 1 with a new job id.

See `templates/` for the three fill-in documents and `templates/code/` for the code scaffold.
