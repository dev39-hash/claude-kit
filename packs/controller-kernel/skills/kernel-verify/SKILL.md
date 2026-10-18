---
name: kernel-verify
description: The controller-kernel addendum to the leader's verification loop - the Qt half build when shell code changed, the pack gate tool (ASCII, L2 purity and includes, L4 timers, L5 call-outs, L9 literals, L10 blocking, warning pragmas) and a diff review against the twelve laws, producing the extra lines of the READY / NOT READY report. Use after every task that touches a core, the kernel or the shell, before Gate 2 and before any commit.
metadata:
  origin: ECC verification-loop (MIT) as rewritten for a controller-kernel project; made tool-neutral for the kit
---

# Kernel verification (addendum to `verification-loop`)

Run the core `verification-loop` skill as usual (configure, build with warnings as errors,
full tests with shape check, goldens, format and static analysis, gates, diff review). This
skill says what the kernel adds to phases 2, 6 and 7. Build and test commands come from
`.claude/project/build-env.md` (with the `cpp-cmake-gtest` pack:
`node .claude/tools/cpp-cmake-gtest/build.js all`, `--slot <tag>` for parallel agents). A
phase skipped for a missing tool is SKIPPED, never PASS.

## Phase 2 addition: the Qt half

Only when shell, executor or adapter code (or its build block) changed: configure and build
the configuration that compiles the shell headers against every Qt version the project
supports (`build-env.md` names the option, for example a `BUILD_QT` switch and the Qt prefix
path). Otherwise report `Qt half: N/A (shell untouched)`.

## Phase 3 addition: the test kit

The full test target runs every `KT_TEST` row, the completeness sweep and the invariants.
Report total / failures and, for a task that added an Event or a State field, that the sweep's
sample count still equals the number of Event alternatives and that the `changed` predicate
covers the new field (the tester's Test report `Sweep:` line).

## Phase 6: gates

```bash
node .claude/tools/controller-kernel/gate-check.js --all
```

Errors fail the phase (ASCII, `L2-purity`, `L2-include`, `L4-timer`, `L5-callout`,
`L10-blocking`, `WARN-PRAGMA`). `L9-literal` warnings are listed and judged in phase 7: each
is either a Policy field the task forgot or a named constant with a reason in the task file.
`packConfig.controller-kernel.walkDirs` must include every core directory; a directory the
tool did not walk is not covered.

## Phase 7 addition: diff review against the twelve laws

Read the diff against the `controller-kernel` skill, section 6:

- L1 only `step()` and const getters are public in a core; L2 no world access, no clock.
- L3 every new request has one owner id in State and a stale-completion test.
- L4 timers keyed with tokens; L5 handlers call nothing outside, effects ordered.
- L6 no inline handling of a synchronous completion; L7 outputs only via `outputs()`.
- L8 new Event or State cells decided or explained; sweep sample added.
- L9 no behaviour constant in a handler (judge the phase 6 warnings); L10 no blocking wait.
- L11 batch order documented; L12 wire names, fault codes and display names unchanged, or
  changed on purpose with string tests and the ADR the Plan names.

Also: public symbols have Doxygen; no loose `bool m_xxx` outside a block; a new row exists for
every new rule; a change to a contract, a law, a block's value set, the core traits header,
public namespaces or build targets, or a dependency has an ADR (`architecture-decision-records`).

## Report lines (added to the Leader verify block)

```text
Qt half:    PASS | FAIL | N/A (shell untouched) | SKIPPED (<tool>)
Gates:      PASS | FAIL (<errors> errors, <L9 warnings> L9 warnings: <judged how>)
Laws:       PASS | FAIL (laws touched: Lx, Ly; <one line each>)
Sweep:      <samples>/<alternatives>, <states> prepared states | N/A
```
