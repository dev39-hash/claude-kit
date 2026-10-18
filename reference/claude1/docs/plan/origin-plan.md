> This is the plan from the origin project, kept here for context only.

> Extracted on 2026-10-14 from the origin project (a Qt vision-picking application, branch `controller-kernel`). DR-nnnn, WP-nn, PQ-n and item numbers cite that project's decision log and backlog; they explain why a rule exists and are not requirements of this repository. Paths were rewritten to this repository's layout.

# Controller kernel: plan of record

**Branch:** `controller-kernel`, cut from `main` at `c43ee12` on 2026-10-14.
**Status:** proposal. Nothing here is wired into the shipped runtime; the example core is
compiled and tested on its own, beside `LocalizationRuntimeController`, which is unchanged.
**Owner decision needed:** whether this becomes Phase 10's Stage 3 (the "pure core" the charter
already planned, see below) or stays a reference design.

## 1. What this is

A reusable shape for every controller in the product that coordinates several asynchronous
devices for one external master: a single-threaded actor with a typed event mailbox, a **pure
decision core** (`step(Event) -> Effects` over an explicit `State`, no Qt, no timers, no
threads), and an **effect executor** that carries the core's decisions out. The abstract is in
[`docs/controller_kernel.md`](../../architecture/controller_kernel.md); its first
instantiation, a pure core for the localization runtime, is described in
[`localization_example.md`](localization_example.md).

The localization runtime is the first controller; the deferred integrations AGENT.md lists (a
pick-and-place task, a robot communication runner) are the second and third. The kernel exists
so that each of them is a set of table rows and a policy struct, not another 4 000-line class.

## 2. Why now, and how it relates to Phase 10

Phase 10's charter (section 2) already accepted the hypothesis "RuntimeCore with orthogonal
machines, source-independent events, actions as data, policy as a parameter struct". Stage 3 of
that charter (WP-30..34, "build the core beside the old one") is not started and is gated on
Checkpoint 2. This branch is a concrete candidate for that stage, with three deliberate
differences from the charter's sketch, each argued in the abstract, section 11:

1. the start/stop lifecycle lives **in** the core (no nested `QEventLoop`, no
   `BlockingQueuedConnection`; items 88, 89, 91 become table rows);
2. correlation ids and stale-dropping live **in** the core (one rule for cycle, attempt, write
   and timer ids; tested by table);
3. readiness is a **derived function**, never a stored state; the six `CycleState` names survive
   only as a display projection.

Nothing in this branch changes a PLC signal name, a fault code, a display state name or any
DR-0001..DR-0015 ruling. Phase 11's boundary (it must not touch the runtime controller) is
respected: this branch does not touch it either.

## 3. What is on the branch

| Part | Path | State |
|---|---|---|
| Pure kernel (level 0, no Qt) | `include/ctrl_kernel/` : `ids.h`, `readiness.h`, `output_image.h`, `common_effects.h`, `blocks.h`, `core_traits.h` | compiled with g++ 13 and clang++ at `-std=c++17 -Wall -Wextra -Wpedantic -Wshadow -Werror`; registered in `core.pri` |
| Example core (level 2, no Qt) | `examples/localization_core/` : `events.h`, `effects.h`, `state.h`, `policy.h`, `localization_core.h/.cpp` | same compilers and flags; registered in `model.pri` |
| Standard test kit + example suite | `tests/` : `kernel_test_support.h`, `main.cpp`, `ctrl_kernel_test.pro` | 19 tests, 0 failures, both compilers; plain C++ console program, `CONFIG -= qt` |
| Qt half, reference only | `qt/ctrl_shell/` : `controller_shell.h`, `timer_service.h`, `output_diff_publisher.h` | **not registered in `runtime.pri`**: written against Qt 5 APIs but no Qt was available where this branch was produced; WP-K3 compiles and registers them |
| Abstract | `docs/controller_kernel.md` | this branch |
| Example design | `docs/localization_example.md` | this branch |

What was verified and what was not:

- The MSVC build was **not** run. The code uses nothing beyond C++17 standard library
  (`std::variant`, `std::optional`, `std::map`), and every file is ASCII (design_rules 16.2),
  but the first MSVC build is WP-K1's acceptance, not this branch's.
- `tests` was run by compiling it directly (`g++ -std=c++17 -Isrc ...`); the
  `.pro` is written in the repository's convention but qmake was not available to exercise it.
- The test kit is a plain C++ program, not a QTest subproject (design_rules 14.1). That is
  deliberate: "the core needs no Qt" is the property under test. A QTest wrapper around the same
  cases is a small follow-up if the owner prefers one binary shape for every suite.

## 4. Work packages

Sizes follow the planning convention (XS/S/M, at most about 5 files per package). The first two
are verification of what is already here; from WP-K3 on, each is a slice of the migration in
the abstract's section 11, ordered so that every slice leaves the shipped controller working
and the existing contract suite green.

| WP | Content | Size | Acceptance |
|---|---|---|---|
| **WP-K1** | Build the branch with MSVC through `ncr_picking_all.pro`; run `tests` through qmake/nmake; fix anything MSVC refuses | S | both shells build; 19/0 on MSVC; `architecture_contract_test` unchanged in count and green |
| **WP-K2** | Add two include rules to `architecture_contract_test`: `include/ctrl_kernel/` includes only the standard library and `core/`; `src/model/*/core/` and `examples/localization_core/` never include `runtime/`, `device/`, `ui/`, `<QObject>`, `<QTimer>` | XS | the two tests exist and pass; a planted violation fails them |
| **WP-K3** | Compile and register the Qt half (`qt/ctrl_shell/`); add an executor test with a fake runner (`ExecutorHarness` in the abstract, section 9) proving effect order and no re-entrancy | M | `runtime.pri` lists the three headers; the harness test is green |
| **WP-K4** | Example core, first missing piece: handshake write tracking (DR-0003 / DR-0010) as a `HandshakeWrites` block, `WriteDone` event and 301 escalation; the five handshake names from `isHandshakeSignal()` | S | table rows for retry, exhaustion in and out of a cycle; invariants extended |
| **WP-K5** | Example core, second missing piece: cycle timings (`CycleTimings` equivalent) carried on completion events and reported in `Notify{CycleResult}`; the self-redial check timer (Q-E) as a counted check | S | rows for Q-E; the ten-check raise test for a self-redialing output |
| **WP-K6** | Adapter slice: `PlcSignalAdapter` (tag map to events, edge detection, batch ordering per abstract section 7.6) and `RoleAdapter` (status + epoch + bind-time synthetic status), unit-tested against the virtual PLC (`IPlcInputSimulator`) | M | an injected PLC batch with both an index and the trigger changed produces events in the documented order |
| **WP-K7** | Strangler step 1: `LocalizationRuntimeController` delegates the **cycle** (grab/match/send) to `LocalizationCore` through the shell; roles and faults stay as today; the three per-cycle connection handles are deleted | M | the existing contract suite unchanged in count and green; the `RT state=` trace format unchanged |
| **WP-K8** | Strangler step 2: role health and timers move to the core; `scheduleRole*()`, `stepSequence`, `attemptInFlight`, `selfRedialing` and the four `QTimer::singleShot` sites are deleted | M | contract suite green; the WP-24/25/27/28/29/30 scenarios pass through the real delivery path |
| **WP-K9** | Strangler step 3: selection latches, fault register, trigger gate; then outputs as a diffed image through `OutputDiffPublisher`, reviewed once against `plc_signal_contract.md` with the PLC programmer | M | contract suite green; the output table in `plc_signal_contract.md` section 4 equals `outputs()` |
| **WP-K10** | Strangler step 4: `Setup`/`Stop` through the mailbox; delete `awaitPrimaryPlcSnapshot()`, the `BlockingQueuedConnection` in `setupRuntimeController()`, `m_startGeneration` | S | item 91's scenario is a table row and a test; no `QEventLoop` left in `task_localization.cpp` |
| **WP-K11** | Proof of the kernel: a second command source (the TCP `Trigger,`/`ChangePart,`/`ChangeCamera,` adapter from PQ-12, or a UI manual-execute button) added as an adapter only; the core is not modified | S | the diff touches no file under `examples/localization_core/` |

Checkpoints: after WP-K2 (the kernel builds everywhere and its boundary is enforced), after
WP-K8 (the recovery machinery, which carried most of the hotfix chain, is on the core), after
WP-K11 (the success criterion the Phase 10 charter set for WP-51).

Stop rules for every package: an existing contract test goes red and the cause is not a DR that
changed the behaviour; a file outside the touch list needs changing; a behaviour is found that
no row in the example design and no DR describes (it becomes a PQ card first).

## 5. How to read the code

Start with `include/ctrl_kernel/blocks.h` (the state blocks), then
`examples/localization_core/state.h` (how the localization core composes them), then
`localization_core.cpp` from `readinessImpl()` and `display()` downwards: those two functions are
what used to be `markRuntimeReady()`'s gate and the 16 assignment sites of `m_cycleState`. The
test file `tests/main.cpp` is organised by the scenarios DR-0015 names and is
the quickest way to see what one event does to the state.

## 6. Language

English, like every committed document. The owner's working notes and the two artifacts this
plan was written from are Vietnamese and stay outside the repository.
