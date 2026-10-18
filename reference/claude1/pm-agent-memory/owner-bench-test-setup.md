---
name: owner-bench-test-setup
description: "No MC hardware on the dev side (2026-09-21): the owner bench-tests with a real Basler camera and a Modbus TCP simulator, provokes faults on purpose, and a bench run never closes a gate defined on the cell."
metadata:
  type: project
---

As of 2026-09-21 there is **no MC-protocol PLC hardware** on the dev side, so the owner
bench-tests with:

- camera: a real **Basler acA2500-14gm**, SN 21688213, GigE at `192.168.0.197`;
- PLC role (and the vision_output role, on the same device): a **Modbus TCP client talking
  to a simulator on `127.0.0.1:800`**, unit 1;
- project file: `build/Test-data/virtual-project-2.vproj`;
- run log: `build/bin/release/logs/app_log_<date>.txt` — one file per day, appended
  across app sessions.

**The owner provokes faults on purpose** — pulls the camera cable mid-cycle and at
`Ready`, drops the Modbus link, writes invalid selections — and on the production cell
clears cycle faults with `bErrorReset` on purpose. **Ask before calling an outage
spurious.** On 2026-09-21 I suspected a 16 s camera outage came from a redundant
reconnect; it was a deliberate cable pull.

**Why:** the production cell is an MC station, so a bench run proves the controller path
(guard, `RT state=` trace, recovery), not MC behaviour. The owner ruled on 2026-09-21 that
the bench run does **not** close Checkpoint 1; the deploy machine repeats it on the real
cell.

**How to apply:**
- Split a day's log at its `Application starting` lines before counting anything, and
  check the `VIRTUAL device` warning per session — an earlier session the same day ran a
  virtual camera.
- Never count a bench run as a gate or ring defined on the cell (Checkpoint 1's owner
  run, DR-0013 Ring 2, DR-0014 Ring 2). Record it as bench evidence instead;
  `docs/plan/phase_10/reports/CP1_bench_run_2026-09-21.md` is the pattern, with a
  checklist for the run on the cell.
- A Basler camera stays "connected" after a cable pull until a grab or a connect touches
  it (backlog 76), so a pull can surface long after it happened.
- The app_log does **not** capture Qt's own warnings — nothing calls
  `qInstallMessageHandler` — so thread-affinity defects show only as behaviour that never
  happens, e.g. a timer armed and never fired (backlog 73, 74).

Related: [[shared-working-conventions-with-deploy]], [[build-gotchas-not-in-repo-docs]].
