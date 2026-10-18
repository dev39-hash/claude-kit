---
name: ezcad-config-drift
description: "components/ezcad is the deploy source; it drifts from the machine's run folder and silently invalidates hardware tests"
metadata: 
  node_type: memory
  type: project
  originSessionId: 1755aee4-764a-4565-a94a-2f8acdf94b0d
  modified: 2026-08-17T00:24:21.994Z
---

Every build with `CONFIG += ezcad` xcopies `components/ezcad/` next to the exe —
including `plug/markcfg7` and `EZCAD.CFG`, the real device configuration. The
machine's actual parameters live in the run folder (`build/Release/release/`) and
are rewritten there by EzCad2 whenever the owner tunes them. **The two drift.**

**Why:** on 2026-08-07 they differed in `AXISZEROFLAG0` (0 vs 1 — home sensor
off/on), `AXISROTATE0`, `AXISSTEPPERRO0` (10000 vs 1000), the travel limits
(±1000 vs ±25600) and `FIELDANGLE` (0 vs −90°). A board-attached test built from
the stale copy therefore ran a **different machine model**: homing returned 0
without moving the axis, and the test **passed anyway**, because "returns 0" is
indistinguishable from "homed" if you only check the signal. Two board-on results
had to be thrown away.

**How to apply:**
- Before trusting ANY board-attached test or probe result, diff the test folder's
  `plug/markcfg7` + `EZCAD.CFG` against the run folder's.
- After tuning parameters in EzCad2, copy them back into `components/ezcad/` —
  otherwise the next deployment ships the old ones to the machine.
- Synced 2026-08-07 (owner-directed, verified byte-for-byte).

Related: [[project-status]], [[dialog-dismisser-trap]], [[laser-init-realmode]].
