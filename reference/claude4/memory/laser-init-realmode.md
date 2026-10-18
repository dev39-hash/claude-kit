---
name: laser-init-realmode
description: Laser rc=5 HARDVER root cause — init must be real mode (testMode=FALSE) with a board; NOT a firmware version mismatch
metadata: 
  node_type: memory
  type: project
  originSessionId: 1792e47e-f608-4ac2-b275-fa045875dddd
---

`lmc1_Initial` rc=5 (LMC1_ERR_HARDVER) on the real LMC board was **NOT** a board firmware ↔ SDK version mismatch (my earlier conclusion was wrong). Root cause: we called `initial` with `bTestMode=TRUE` ("simulation, no board required" per the vendor's own checkbox tooltip) while a real board was physically attached → SDK returns HARDVER. HARDVER has multiple causes; mode-vs-hardware mismatch is one.

**Why:** Proven by the vendor reference in `temp_complete_source/MarkEzd` — same board, same MarkEzd.dll/EZCAD.CFG/runtime folder — which connects fine because its Connect checkbox defaults **unchecked** (testMode=FALSE) and it passes a real owner HWND (winId()). Owner-null is a distinct code (rc=13), and our null-owner test still got rc=5, so owner was never the cause.

**Init mode is latched per-process:** once `lmc1_Initial(testMode=TRUE)` runs in a process with a board attached, a later `lmc1_Initial(testMode=FALSE)` in the SAME process fails even after `close()`+`FreeLibrary` — only a full process restart clears it (test-mode init latches process-global SDK/driver/spawned-EzCad2 state that Close doesn't reset). Consequences: never do a sim-mode init before real-mode work in one process; changing testMode at runtime needs an app RESTART, not a reconnect.

**How to apply:** Production drives the board in **real mode**. `LaserMarkerConfig::testMode` defaults to `false` (was `true`); only check "Test mode" on a board-less machine. App wires a real owner via `MainWindow::winId()` → `MarkingController::setOwnerWindow`. `laser_marker_test` inits in real mode with an owner window and REQUIRES the board. Simulation init lives in a SEPARATE process `tests/laser_sim_test/` (board-presence probe: rc=0 → no board, rc=5 → board present) so it can't poison the real-mode suite. Reference: `temp_complete_source/MarkEzd` (markezdcontroller.cpp/mainwindow.cpp, ezdlib/MarkEzdDll_API.md). Relates to [[project-status]].
