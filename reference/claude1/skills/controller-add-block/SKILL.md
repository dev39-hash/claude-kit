---
name: controller-add-block
description: Use when a controller core needs new state (a loose bool, counter or optional with a long "set when" comment), when a state block in ctrl_kernel/blocks.h must be added or extended, or when deciding whether a block is reusable or controller-local. Produces a block card (values, consumes, emits, invariants, policy knobs) and the tests that guard it.
---

# controller-add-block: add or extend a state block

State in a kernel controller is a product of blocks, each with a closed value set, the events it
consumes, the effects it emits, invariants and policy knobs (the `controller-kernel` skill,
blocks table). A block holds FACTS; the core's `step()` changes it and the three derived
functions read it. A loose field in State is a block that has not been named yet. In the
controller-kernel repository the full text is docs/controller_kernel.md.

Files by role (reusable blocks live in the kernel's `blocks.h`; the worked example in the
controller-kernel repo composes them in `examples/localization_core/state.h`):

| Role | File |
|---|---|
| reusable blocks, id types | kernel `blocks.h`, `ids.h` |
| controller State (composition of blocks), controller-local blocks | `state.h` |
| the block's numbers | `policy.h` (a `*Policy` struct plus a field in the controller `Policy`) |
| transitions and derived-function use | `<name>_core.cpp` |
| block card for reusable blocks | the kernel's block table (`controller-kernel` skill, blocks table) |
| block choice for one controller | that controller's design doc, "Blocks chosen" |
| tests, `checkInvariants()`, sweep | the controller's test file (`Harness` pattern; see `controller-kernel`, test kit) |

## When to use / not to use

Use when:
- a "loose bool/int/optional" is being added to State, especially with a comment on when it is
  set and cleared (the first smell in the `controller-kernel` skill);
- the same hand-written pattern appears in a second place (retry counting, a refused value
  that must be remembered, an id with a current holder);
- an existing block needs a new value or a new field.

Not for:
- a one-line fact that is a pure function of existing State: write a derived query instead;
- a number: that is `Policy` (L9), not State;
- a new event only: `controller-add-event`.

## Inputs to gather first

1. The facts to remember, as a closed list of values (not a free-form status string).
2. Which events change it and which Effects its transitions emit.
3. What must always be true of it (the invariants), including "implies NotReady[...]".
4. Whether another controller needs the same pattern. Reusable blocks are added to the kernel
   only when a second controller names the need; until then the block is controller-local.
5. Which timers and ids it needs (each timer slot has a token, each request an id: L3, L4).
6. What Setup resets and what carries over (a fresh session starts clean, but ids and timer
   tokens must stay monotonic so a stale completion of the old session cannot match).

## Procedure

1. **Name it, or reject it.** Can the block be named from the I/O description in the design
   doc? If the only justification is "the handler needs to remember", the real answer is
   usually a missing readiness reason or a missing value of an existing block (L7). Re-read
   the blocks table in the `controller-kernel` skill first: extend an existing block before
   inventing one.
2. **Write the card** (reusable: a row of the kernel's block table; local: design doc section
   3): values, consumes, emits, invariants, policy, use instead of (the hand-written pattern the
   block replaces). Review the card before the code.
3. **Decide reusable vs local.** Local: a struct in the controller's `state.h`, written exactly
   like a kernel block, with the card in the design doc. Reusable: `blocks.h`, in namespace
   `ctrl`, with the block-table row added. Promote local to reusable only at the second user.
4. **Write the struct.** Rules: a closed `enum class Kind` whose first value is the idle /
   unknown one; plain data; small mutators that only set facts (`learn`, `accept`, `refuse`,
   `begin`, `end`, `arm`, `disarm`); doc comment states the invariants. No Qt, no device, no
   clock, no random, no decisions (L2). Ids are `ctrl::StrongId` counters stored in State; an
   id is bumped when its run ends so late completions are stale (L3). Timers go through the
   `Timers` slots (L4).
5. **Policy knobs.** Every number or flag the block's transitions use goes in a `*Policy`
   struct (the kernel's `RolePolicy` is the model) and a field of the controller `Policy`
   with a default and a note "ruled / needs a ruling" (L9).
6. **Compose it** into the controller `State` as a named instance. Decide its initial value
   and whether `Setup` resets it. Remove the loose field it replaces in the same change.
7. **Wire the transitions** in the core: handlers call the block's mutators and push the
   Effects the card lists. Read the block in `readiness()` (one `if` per reason), `outputs()`
   and `display()`; never publish from a handler (L5, L7).
8. **Invariants.** Turn each card invariant into a check in `checkInvariants()` of the test
   file's `Harness` (the kit does not provide one; copy the pattern); add a row to the block
   table for reusable blocks. Extending an enum: grep every `switch`, reason
   list and name function that mentions the enum; a value that reaches the wire is frozen
   once released (L12).
9. **Tests.** (a) A direct test of the block (pure struct, no core): each mutator, each
   invariant. (b) Table tests of the core rows that use it, through the harness. (c) Add a
   prepared state that exercises each value to the sweep and add the new field(s) to the
   sweep's `changed` predicate, otherwise a handler that only touches the block looks like a
   silent no-op (L8). (d) A stale probe if the block owns an id or a timer (L3, L4).
10. **Docs.** The block-table row (reusable) and the "Blocks chosen" table of the design
    doc; remove the loose-field mention from "Not used". Run the project's full test target
    (all KT_TEST rows, the completeness sweep and invariants); in controller-kernel:
    `node .claude/tools/build.js all`. If the project has a gate tool (controller-kernel:
    `.claude/tools/gate-check.js`), run it.

## Checklist / Definition of done

- [ ] Card written first: values, consumes, emits, invariants, policy, use instead of.
- [ ] Reusable vs local decided and recorded (second user for reusable).
- [ ] Closed enum with idle/unknown first; struct holds facts only; no Qt, device or clock.
- [ ] Numbers are Policy fields (L9); ids and tokens owned in State (L3, L4).
- [ ] Composed into State; Setup behaviour decided; the replaced loose field is gone.
- [ ] Used by readiness / outputs / display, not by handlers publishing (L7).
- [ ] Invariants coded; block test, core row tests, sweep state and `changed` field added.
- [ ] Docs updated; decision recorded when the kernel's blocks or a contract change (see
      `controller-change-rule`, "When the change needs a recorded decision").

## Smells

The full list is in the `controller-kernel` skill (smells list). Specific to blocks:

- A new `bool m_xxx` in State that belongs to no block, with a long comment on when it is set
  (L7). Exception to document, not to repeat: a single fact with very few readers, named
  under "fields outside any block" in the design doc.
- A block that stores a decision ("shouldRetry") instead of facts; the decision is derived.
- A block with a `Kind::Other` / free-text status: the value set is not closed.
- A block mutator that reads the world (a clock, a runner): the adapter must supply the fact
  as an event (L2).
- Counting retries with a hand-written integer next to a timer: `RoleHealth` plus Timers (L4).

## Worked example (from the controller-kernel repo: `Latch<T>` in `include/ctrl_kernel/blocks.h`)

The need: a commanded selection that can be refused must not be forgotten, must not be
overwritten by an unrelated accepted write, and must make the controller NotReady. Without a
block that is a pair of loose flags per selection; as a block it is one struct:

```cpp
template <class T>
struct Latch {
    enum class Source { None, Default, Commanded };
    std::optional<T> adopted;     // the value in force, if any
    Source source{Source::None};
    std::optional<T> refused;     // last refused command, while refused
    bool isRefused() const { return refused.has_value(); }
    void accept(T value, Source from) { adopted = value; source = from; refused.reset(); }
    void refuse(T value) { refused = value; }
};
```

Composition in `state.h`: `ctrl::Latch<int> camera; ctrl::Latch<int> group;`. Use in the
derived functions, not in handlers:

```cpp
if (s.camera.isRefused()) r.add(NotReadyReason::CameraRefused);      // readiness()
img.set("bCameraValid", !s.camera.isRefused() && s.camera.adopted && ...);  // outputs()
```

Invariant coded and tested (`a_refused_startup_camera_latches_and_only_the_same_signal_clears_it`):
an unrelated `SelectGroup` and an `ErrorResetRise` leave `camera.isRefused()` true; only an
accepted `SelectCamera` clears it. The sweep's `changed` predicate compares
`camera.isRefused()` and `camera.adopted` for exactly the reason in step 9.

A recorded exception: the example's `plcEverConnected` flag sits outside any block and the
example design doc names it. That is the acceptable form (named, justified, as few readers as
possible); once several functions read it, promote it to a value of `RoleHealth` or a new block.
