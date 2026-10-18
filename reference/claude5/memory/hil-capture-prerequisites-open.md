---
name: hil-capture-prerequisites-open
description: "HIL capture prerequisites are decided (Checkpoint F ticked 2026-10-04); the owner now runs the captures, and Phase 9 waits until they are done"
metadata:
  node_type: memory
  type: project
  originSessionId: 1c0df7ef-a9b5-4ce3-8147-5a3bd661ce36
  modified: 2026-10-04T12:25:08.457Z
---

State on 2026-10-04: the two owner prerequisites of the first HIL capture are **decided**. The answers are in `temp-docs/hil-scratch-areas.md` and the Checkpoint F owner gate is ticked in `tasks/todo.md`:
- the scratch areas: the Q CPU uses `D100-D2099` and shares it with Q + C24; the FX scratch follows the ENET-ADP device ends;
- the FX3 facts: the special devices are M8000/D8000, and computer link offers 1C formats 1 and 4.

The owner runs the captures themselves, on real PLCs, with `hil_capture` or the `mc_workbench` HIL view. **Phase 9 (bench and release) waits until the owner says the captures are finished** (owner, 2026-10-04).

**Why:** the owner decides at the bench and wants the captured data before benchmarking and release work.

**How to apply:**
- Do not start Phase 9 or plan it in detail until the owner reports the captures are done.
- Before helping with any capture run, still recheck the operator procedure in `docs/spec/SPEC-hil-capture.md`. Real-PLC work is always owner-gated.

**Captures with 0.1.2 (2026-10-13/14), checked 2026-10-14:** 11 profiles in `build/mc_protocol-v0.1.0-hil/capture/` (Q03UDE 3E bin/ascii + 3C F1 sum/nosum, F2, F3, F4: all passed; FX5U 3E bin passed, 3E ASCII 1 fail; FX3 1E bin passed, 1E ASCII 10 fails). Still missing: the three FX3 serial 1C and the two FX5U RS-485 3C profiles. Bench-confirmed library bugs: 1E ASCII odd bit write needs a dummy '0' (FX3 manual §7.5.3); FX5 3E ASCII limit 480 words / 1792 bits and FX3 ENET-ADP 1E limits are below the library's tables. **P9-2 opened 2026-10-14 (owner):** T-087 (1E ASCII dummy), T-088 (`FrameConfig` caps) and T-089 (the 11 captures imported into `tests/vectors/captured`, `docs/hil/FINDINGS.md` F-001…F-021, F-014 withdrawn) committed together on 2026-10-15. Open next: owner decides the open FINDINGS entries; captures still missing: FX3 serial 1C ×3, FX5U RS-485 ×2, and a re-capture of `fx3-eth-1e-ascii` with the T-087 codec (it replaces the committed one).

Related: [[memory-dual-copy-sync]].
