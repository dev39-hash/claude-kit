---
name: project-status
description: "NichirinLaserMark phase status, key constraints, and toolchain"
metadata: 
  node_type: memory
  type: project
  originSessionId: 1792e47e-f608-4ac2-b275-fa045875dddd
  modified: 2026-10-14T06:14:38.452Z
---

NichirinLaserMark: one Qt 5.15 app bridging a Mitsubishi PLC (MC Protocol 3E/TCP)
and a laser marker (LMC1 / `MarkEzd.dll`). Read `ONBOARD.md` (renamed from `AGENT.md` on 2026-10-07) at the repo root first.

**Hard constraint:** must build **32-bit** — `MarkEzd.dll` is x86, bound at
runtime. Toolchain: Qt 5.15.2 `msvc2019` (32-bit) kit + VS2019 `vcvarsall.bat x86`
+ jom. Namespace is `vc::`. Architecture mirrors the `temp_codebase/`
InspectionMonitoring reference (layered modules, `.pri` per module).

**Phase 1 — DONE (2026-07-08).** Structure + build system; PLC/core/runtime ported
Qt6→Qt5.15; laser device family implemented and verified in test mode
(`tests/laser_marker_test`, 6/6 green); `marking/` bridge contract skeleton. App
builds 32-bit and launches.

**Phase 3 — commission mark function CLOSED (2026-07-16, bench-validated).** Plan +
status: `docs/history/plan/phase_3_plan.md`. Added: `marking/mark_planner.h`
(placeholder-resolve #m#/#M#/#YY#/#Y#/#DD#, per-pattern split, char-limit validate,
rotationPulses); axis config now serialized (`LaserMarkerConfig.axisConfig`, orphan
`MarkingConfig` axis fields removed); host commands `listEntities`,`prepareMark`,
`markData` (+ bbox on get/change text); Laser tab `cbbxTextName`, bbox status, axis
settings load/apply, `partTestBox` Test-Mark. Planning is app-side in `marking`
(MarkingController::prepareMark builds the plan), host executes the set→measure→mark
→rotate loop. Tests green: marking_test 20/20, laser_sim_test, architecture_contract 3/3.
Bench refinements folded into the host mark loop (all confirmed by the owner):
`PartRegister.gap` operator tuning; **center-to-center rotation** using both adjacent
marks' half-widths, deferred so it rotates BEFORE each split (needs the next width);
**leading/trailing space width** = count × 1.5 × charSpacingDist added to bbox width
(getEntSize omits edge spaces); split re-centering tried then **disabled** (unnecessary);
`splitContent(…, keepWholeWords=true)` **word-preserving split** (default on); and an
**alignment-dependent rotation**: left-aligned (getTextEntParam4.textAlign remap 3) uses
`prevWidth + charSpacingDist + gap`, center (1) keeps the center-to-center formula.
**Phase 4 — runtime bridge state machine CLOSED (2026-07-17).** Plan:
`docs/history/plan/phase_4_plan.md`. Added: `State::Recovery` (device down in the runtime
phase → marking blocked, retry every 10 s, auto-return); a 100 ms laser IO poll
(`EzdMarkerDevice` timer → `ioPortsPolled(in,out,ok)`, output word cached — `lmc1_GetOutPort`
not bound); PLC single-coil write API (`PlcDevice::writeBit` → `McProtocolDevice`,
`PlcRunner::requestWriteBit`); a per-source input aggregator + edge detector feeding the
mark handshake (MarkerReady/markingInProgress/marked/makerError, `markData` on
MarkingTrigger↑, stop on MarkerStop↓ NC) and the part-change flow (ChangePartTrigger↑ →
lookup + `prepareMark`); an output driver resolving each `IoKey` to a PLC M-coil or a
laser-board bit; `markTrigger()`/`stopMarking()` runtime slots wired to RuntimeForm buttons;
`MarkingConfig::verify()` (ALL io keys bound+valid + poll-window coverage for INPUTS) gating
Save; RuntimeForm bound to the controller (lamps/status/event-log + app-logger mirror);
`ThemeManager` applied at startup + qss dead-selector fix. Honors `autoRun`. Reconnect
interval 10 s (board reboot time). An adversarial 5-agent review ran; high/med findings
fixed (cross-source edge baseline, drop-mid-mark flag latch, aborted-mark stale finish,
timer test-seam, commission output de-assert, verify outputs-exempt). Verified: 32-bit app
builds clean, `architecture_contract` 3/3, `marking_test` 21/21. Owner built + reviewed the
UI (looks good). Follow-ups then done same day: **host-crash watchdog** (`LaserHostClient`
`QProcess::finished` → `hostCrashed()`, gated by `m_expectingExit`; `EzdMarkerDevice::onHostCrashed`
reports the in-flight op failed + drops the session → Recovery — covers a `laser_host.exe`
crash mid-`markData`, which has no `opDone`); and the **Theme menu** (Control > Theme >
Dark/Light) wired to `ThemeManager::applyStyle` (applies palette + `:/styles/<id>.qss` +
persists via `AppSettings::setTheme`), exclusive checkable group reflecting the active theme. **Runtime SM now has a test**
(`tests/runtime_test/`, QTEST_MAIN + widgets, includes the module `.pri`s + injects
FAKE PLC/laser devices via the `create*Device()` seams): 3 cases (full handshake;
MarkerStop-NC stop→fault O4; device-drop→Recovery→reconnect), 5/5 green, added to
`run_all.ps1`. New UML: `uml/05_controller_state.puml` (Idle/Commission/Runtime/Recovery
+ composite Runtime handshake substates) and `uml/06_runtime_signals.puml` (timing chart
of the runtime IO signals). Then: qss migrated to the `ThemeManager` `@{token}` system
(dark/light tokenized, verified byte-exact round-trip; dead ADS `#objectName` section
removed — see [[qss-token-theming]]); `SignalsMonitorWidget` registered in `ui.pri` + its
per-widget qss added to the qrc; RuntimeForm `signal_monitor_view` wired **read-only** (10
`IoKey`s Bool + 2 raw laser words Number, fed by controller `ioSignalChanged` /
`laserIoWordsChanged`, tags from each `IoBinding`, Modify disabled). Verified: full 32-bit
build clean, `runtime_test` 5/5, `marking_test` 21/21. Docs synced: docs/README phase
status, `src/ui` + `src/marking` README.md, UML 02/03/05/06, phase_4_plan §10.
**Phase-4 addendum (2026-07-17, `phase_4_plan.md` §11).** Four owner-requested changes,
built 32-bit + `runtime_test` 8/8: (1) **`MarkerReset`** input (rising edge, now a
mandatory 11th `IoKey` in `inputIoKeys()` — existing saved configs must bind it before
Save) → `onMarkerReset` → `EzdMarkerDevice::hardReset()` TerminateProcess-es the host →
Recovery; (2) **`markData` stall watchdog** — host emits a `markProgress` heartbeat before
each blocking SDK call, app arms `m_markDataTimer` (15 s, reset per heartbeat) → on stall
kills the host (fixes the dead-loop when the board loses power mid-mark; the host
`stop`/`shutdown` `join()` would otherwise hang); (3) **latched-result `MarkerReady`** —
`markerReady()` no longer gated by `marked`/`makerError` (they latch, reset at the NEXT
trigger; `onTriggerFalling` removed) — fixes the dead-latch when the trigger is released
mid-mark; (4) **auto-prepare on Runtime entry** (`maybeAutoPreparePart`) — arms
`MarkerReady` from the current PLC part name without a `ChangePartTrigger`. Second
adversarial review; confirmed fixes folded in: onMarkerReset invalidates the part so
MarkerReady can't transiently assert during the ~2 s recycle; `EzdMarkerDevice::write­
OutputPort` skips while a long op runs so a wedged host can't stall the watchdog.
**Constraint: `MarkerStop`/`MarkerReset` must be PLC-sourced** — laser-board inputs can't
fire mid-mark (board busy, IO poll suppressed while `m_activeKind != -1`). Known gap: the
device-level stall watchdog has no hermetic test (needs a mockable `LaserHostClient`;
verified by review + bench). [[laser-init-realmode]] Two follow-up tweaks (same day):
**`makerError` survives a laser reconnect error** (`updateRuntimeConnectivity` no longer
clears it on a drop — it's a latched result, resets only at the next trigger; test
`test_markerror_latched_through_reconnect`, `runtime_test` 9/9); and **`lamp_marking_phase`
reflects the handshake in Runtime** (`RuntimeForm::updateMarkingLamp`, sole writer:
Marking>Ready>Part-name-invalid, else Not-ready; state-based otherwise). Then a 3rd tweak:
**`MarkerReady` tracks the `MarkerStop` (NC) gate** — `markerReady()` includes
`inputLevel(MarkerStop)`, and a MarkerStop change re-drives MarkerReady on either edge
(opening drops readiness even while idle; re-closing restores it). Test
`test_markerstop_gates_marker_ready`, `runtime_test` 10/10.

**Build-config fix (2026-07-14):** root `NichirinLaserMark.pro` had `/utf-8`
commented out (every sibling `.pro` sets it); on this CP932 machine that made the
app fail to compile with spurious errors. Uncommented — the full app now builds.

**IO binding table widget (2026-07-16).** New `vc::ui::IoBindingTableWidget`
(`src/ui/widgets/io_binding_table_widget.{h,cpp}`) replaces the old per-row
`ioGrid` widgets in `settings_io_tab` with one QTableWidget-based editor,
generalizing `SignalsMapWidget`'s mechanism with a per-row source selector (PLC
tag vs laser board for Bool rows; PLC-only, locked, for Number rows). `partNameTag`
migrated from `m_signals` (`SettingsPlcTab`) into this widget as a Number/PLC-only
row; `m_signals` now holds only `activeMDevice` (a PLC-comms heartbeat with no
source concept, out of scope for the widget's Bool/Number policy). `IoBinding`/
`IoSource`/`IoKey::*` schema (`src/marking/io_binding.h`) unchanged — no
settings.dat migration needed.
Revised same day per follow-up feedback: columns are now Signal/Type/Direction/
Source/Mapped-to (5, not 6) — **Direction** (Input/Output, view-only) added,
**Enabled column removed** (`IoBinding.enabled` is now always forced `true` from
the widget — no per-row toggle), and **PLC tag + Laser bit merged into one
"Mapped to" column** via a `QStackedWidget` swapping page by current Source.
Switching Source is now a destructive, confirmed action (`confirmSourceSwitch()`
— "this clears the current value, continue?"); declining reverts the combo via
`QSignalBlocker`. `RowState.source` is tracked again (not read live from the
combo) specifically to support this confirm/revert flow. Verified: app builds
32-bit clean, architecture_contract_test 3/3, marking_test 20/20.
`SignalsMapWidget` fully removed (2026-07-16, same day): `settings_plc_tab`'s last
row (`activeMDevice`, "Connection-confirm M") is now a plain `QLineEdit`
(`ui->lineEditConnectionConfirm`, added directly in `settings_plc_tab.ui`) with
load/apply wired straight to it (`"M%1"` format, digit-parse back) — no widget
class needed for a single heartbeat field. `src/ui/widgets/signals_map_widget.{h,cpp}`
deleted (zero remaining consumers), deregistered from `src/ui/ui.pri`,
`src/ui/README.md`'s widget bullet + hybrid-`.ui` example updated to reference
`IoBindingTableWidget` instead. Verified: 32-bit build clean,
architecture_contract_test 3/3, marking_test 20/20.
**Debug IO wiring-test column (2026-07-21).** `IoBindingTableWidget` gained a 6th
**Debug** column: a checkable ON/OFF toggle on each **Bool** row (Number/partNameTag
gets none) emits `debugModifyRequested(internalName, on)`. `SettingsIoTab` (now also
handed the `MarkingController`) routes it to new `MarkingController::debugWriteIo(binding,
on)`, which forces that bound bit on its device — a PLC M-coil (`writeBit`) or the
laser-board output word — so the operator can verify the physical IO wiring in
commission. It writes the binding CURRENTLY shown in the table (edited-but-unsaved), not
the committed config; returns `false` WITHOUT writing when the bound device is down →
the tab shows a "device not connected" `QMessageBox` and reverts the toggle via
`IoBindingTableWidget::setDebugState()`. A laser-board bit set this way is wiped by
`resetRuntimeFlags()` (m_laserOutWord=0) on the next Runtime entry, so it can't leak into
runtime. Test `test_debug_write_io` (connected write + not-connected false), `runtime_test`
11/11; app builds 32-bit clean; UML 03 updated + re-rendered.

**Phase 5 — IMPLEMENTED (2026-07-22), awaiting CP2 bench validation.** Plan +
decisions + CP1 review record: `docs/history/plan/phase_5_plan.md`. Change-part is
now **index-based**: `partIndexTag` (ONE D word, index 1..256, 0=none) replaces
`partNameTag`/`partNameLen`; `PartRegister += indexNumber + hatches`;
`PartRegistry` keeps the list **sorted by index** (D4: display order == index
order; `move()` removed; `assignIndex(row,newIndex,{Keep,Swap,BumpExisting})` is
the only reassignment path; append/duplicate take the smallest free index;
`fromJson` migrates old data). **Mark-content write-back**: on runtime prepare-ok
(and commission part selection via combo `activated()` only) the resolved contents
are encoded ASCII 2 chars/word (`plc_text_codec.h`, replaced `part_name_codec.h`)
into 4×`markContentLen`-word blocks at `markContentTag` and written via new
`PlcRunner::requestWriteWords` → `McProtocolDevice::writeWords` (chunked ≤**128**
words/request — MCRequest ctor cap governs, not the owner's 512 ceiling). **Hatch
mode**: `MarkingConfig::hatchNames` (UI aid), host `prepareMark` verifies hatches
exist in the .ezd (rc=-7) + captures design bboxes; `markData` with hatches marks
entities left→right; no hatches = byte-identical classic loop. **D3 REVISED
(2026-07-23, after the first bench)**: the original "rotate to the offset and mark
the entity at its own design X" DOUBLE-shifted (axis + field position) and fired
away from the focused tangent — the correct principle (same as the proven split
mechanism) is *ink always fires at ONE fixed near-centre field column; the rotary
axis moves the surface*. Now each entity is measured + translated onto the column
with `lmc1_MoveEnt` (column = leftmost entity's align-aware design ANCHOR — left
edge for left-aligned text, center otherwise, i.e. the point `changeText` keeps
fixed; measure-then-move = idempotent; RAM-only, .ezd never saved) while the axis
rotates by the design anchor distance. Owner chose: X_ref = leftmost anchor (not
field 0); no hatch-width guard yet. **Mark-plan trace tooling (2026-07-23,
owner-confirmed)**: `laser_host` dumps `[mark-trace]` position/axis lines to
stderr when env `NLM_MARK_TRACE` is set (works on a real bench run too);
`tests/laser_mark_trace_test` spawns the REAL host and dry-runs
init(sim)→loadEzd→listEntities→prepareMark→markData on an env-chosen .ezd
(`NLM_TRACE_EZD/_CONTENTS/_PATTERN/_HATCHES/_DIAMETER/_PULPERROUND/...`),
relaying the trace; skips (rc=5) when a board is attached — power it off to
trace on the bench machine. Sanity invariant: per entity |moveEnt dx| ≈ mm(base
pulses). The owner inspected the trace and CONFIRMED the plan — CP2 physical
bench mark still pending (plan §10). **`markPartNameTag` addendum (2026-07-23,
plan §11)**: the current part's registered NAME is also written to the PLC at
the same moment as the content write-back — one `markContentLen`-word block
(same length knob, same ASCII codec) at `markPartNameTag` ("" = off
independently); verify() enforces D-shape + no overlap with the index word or
the content block; third Number/Output row in the Settings IO tab. New UI:
`HatchNameListWidget` + `HatchNameEdit` (comma-token completer editor);
`PartRegisterRowWidget` reworked (Index spin row 1 + collapse button,
Pattern/File#/Ezd → row 2, hatches row 7; index edits emit `indexChangeRequested`,
NOT `committed()`); list runs confirm + Keep/Swap/Bump dialogs. CP1: 43-agent
adversarial workflow → 18 confirmed findings ALL fixed (notably: sync-prepare-fail
handshake hang → `prepareMark` returns bool; change-part ignored while a prepare
is pending; `parse_write` needs ≥11 bytes; strict `D<number>` verify for both tags
+ content/index overlap check). Also fixed `qmake/deploy_dependencies.pri`
windeployqt PATH bug (`$$QT_INSTALL_BINS` var → `$$[QT_INSTALL_BINS]` property).
Verified: marking_test 23/23, runtime_test 12/12, architecture 3/3, app +
laser_host 32-bit clean.

**Phase 6 — license integration IMPLEMENTED + VERIFIED on real dongles
(2026-07-24).** Plan/decisions/review: `docs/history/plan/phase_6_plan.md`;
runbook: `docs/rules/license_runbook.md`; module card: `src/license/README.md`.
New **`src/license/`** module (level 1, wraps the vendored `r4ndlic` ROCKEY4ND
toolkit; `MarkingController` stays license-agnostic — MainWindow orchestrates).
`LicenseService` owns a **LowPriority worker QThread** holding ONE
`r4ndlic::License` for app life; `LicenseWorker` does the startup open (Layer 0 +
basic-password batch + provisioned + entitlement + **Layer-1** table + Layer-3
claim) + **anti-clone `hidsig::verify`** (O5 fail-closed), then a **5-min
single-shot anti-roam poll** (PARENTED QTimer so it migrates with moveToThread;
roam=`false`+Ok → `claimSession()` re-claim then stop (O1); unplug/err → 1 retry
(O2) → stop). Startup gate is **Idle-first** (`MainWindow::beginLicensedStartup`
replaced `startAutoRun`): pass → enable About+Settings + `controller->start()`;
fail → modal → close; anti-roam loss → `controller->shutdown()` → modal → close
(D2). **About dialog** (`src/ui/forms/about_dialog`, wired to the previously-empty
`menuAbout`) shows org/customer/issue-time/duration (`durationDays=-1`=Lifetime,
a reserved int). `LicenseInfo`/`LicenseFailure` are `Q_DECLARE_METATYPE`'d +
`qRegisterMetaType`'d (both cross the queued worker→GUI signal; an unregistered
`enum class` is silently dropped). **Secrets hardcoded** by the owner in
`components/rockey4nd_license/release_constants/runtime_constants.h` — `#include`d
INSIDE `loadRuntimeSecrets()` in `license_worker.cpp` because its generated form is
`cfg.*` statements + constexpr (regenerate that ONE file, no code change);
`kLicenseAppId=0` in `license_config.h`. **Build gotcha:** `license.pri` links
`legacy_stdio_definitions.lib` (the 32-bit `Rockey4ND_MD.lib` needs the legacy CRT
`sprintf`, which `sdk.pri` adds only on x64) — else `LNK2019 __imp__sprintf`;
bcrypt links via a `#pragma` in the toolkit. **Deploy: HID / driverless**
(owner-confirmed) — no driver and no `Rockey4ND.dll` ship (static link).
**Verified against the 2 plugged-in dongles:** `tests/license_test` **5/5** (real
open + Layer-1 + anti-clone + identity `NICHIRIN`/`CUSTOMER#2` + anti-roam
still-mine; `FakeSdk` NoDongle/WrongDongle), `architecture_contract` **3/3** (new
`license` rule), app builds 32-bit clean. **Layer-1 kept ON** (the owner-provided
table verifies on hardware). Remaining: **CP2** bench for roam (2nd instance) +
unplug mid-run (not unit-testable in-process — a roam needs a second claimer, an
unplug can't be simulated). **CP1 code review** (4-lens workflow): 1 MED fixed —
`~LicenseService` must use **unbounded `wait()`** (not `wait(3000)`); the ROCKEY4ND
SDK calls aren't cancellable, so `quit()` only lands after the in-flight call
returns, and a bounded wait that times out would delete the still-running parented
`QThread` child → `QThread: Destroyed while thread is still running` → terminate +
worker/License leak. (The device layer has the same class of debt, scoped by
`abortPendingIo()` — see `docs/history/technical_debt.md`.)

**2026-07-27 — Phase 5 + Phase 6 CLOSED (owner-confirmed CP2).** Owner reviewed
**Phase 5 CP2** (physical bench mark + Register-part UI) and **Phase 6 CP2** (roam
via a 2nd instance + unplug mid-run) — **no issues**; both phases DONE. Owner then
edited `license_config.h`: `kLicenseAppId` 0→**1** (dongle app slot) and
`kAntiRoamIntervalMs` 5min→**1min** — the 1-min value is **marked TEMPORARY for
runtime testing; restore to 5 min for production** (the request fixes the cadence
at 5 min). Operator failure strings in `license_info.cpp` were softened (no
'clone/emulator' wording shown to operators).

**Language menu wired (2026-07-21).** `Control > Language > English/Japanese`
(`app/mainwindow.ui`'s `menuLanguage`, actions already existed but were
unwired) now persists via `AppSettings::setLanguage` (`AppKey::Language`,
already scaffolded, was dead data) — mirrors the Theme-menu block exactly
(`QActionGroup`, exclusive checkable, checked state reflects
`AppSettings::language()`). Deliberately **no live retranslation**: picking a
language just persists the code and shows a restart-required
`QMessageBox::information` (`MainWindow::changeLanguage`, no-ops if picking the
already-active language). `app/main.cpp` now installs the matching
`QTranslator` once at startup, before `MainWindow` is constructed (must
outlive `app.exec()`, so it's a local in `main()`, not scoped inside the `if`).
Stored value is the exact `.ts` locale suffix (`"en"` = source language, no
file; `"ja_JP"` loads `:/i18n/NichirinLaserMark_ja_JP.qm` — confirmed via Qt's
own `lrelease.prf`: `embed_translations` mounts compiled `.qm`s under
`/i18n/<basename>.qm`, prefix is not configurable per-project here). Two
harmless pre-existing orphaned dead actions in `mainwindow.ui`
(`actionJapanese`, an unnamed `action` "English", leftover from an earlier
rename) were left untouched — out of scope, not touched. Verified: 32-bit
build clean, architecture_contract_test 3/3, marking_test 21/21.

**Earlier Phase 2 scope** (runtime bridge state machine, operator UI, theming)
open questions are in `docs/architecture/architecture_decisions.md` §3 — i18n
EN/JA switching itself is now wired (above); live retranslation without a
restart is not implemented (by design, per the owner's request).

**Phase 7 — laser_host refactor, IN PROGRESS (plan signed off 2026-08-03).** Plan:
`docs/history/plan/phase_7_plan.md` (self-contained; the phase-7 handoff doc was
deleted by the owner). Goal: split the 933-line `laser_host/main.cpp` monolith into
named units, **behaviour-preserving**. Owner decisions: LMC board stays powered off
all phase; **no git** (manual `laser_host/` backup before T1); OpRunner (T7) is in
scope but LAST and gated on T0b. **T0a + T0b DONE 2026-08-03 — the two oracles that
gate every later task:**
- **Geometry:** `tests/laser_mark_trace_test/capture_baseline.ps1` (new) runs a
  5-config matrix — hatch / classic (`NLM_TRACE_HATCHES=-`) / revert=1 / gap+4-pass
  split / pattern-0 boundary spaces — filters the `[mark-trace]` lines and writes
  `baseline/B{1..5}.txt`; `-Compare` re-runs and diffs (exit 1 on drift). Baseline
  contents MUST stay placeholder-free: the test resolves `#YY#`/`#DD#` against
  `QDate::currentDate()`, so date-bearing content silently breaks the gate at
  midnight. `NLM_LASER_HOST` is pinned because the test's `locateHost()` prefers the
  stale `laser_host/build_p5/`.
- **Wire behaviour:** new `tests/laser_host_protocol_test` (in `run_all.ps1`) —
  115-line `golden.txt` of every command's response line plus the paths the trace
  cannot see (busy rc=-3, reap x2, no-ack `stop` idle + mid-op, shutdown ack-then-exit,
  rcs -2/-4/-5/-6/-7/12/16). Re-baseline with `NLM_PROTO_UPDATE=1`. The busy probe is
  race-free by writing `startOp(redLight)` + the probe in ONE write. ONE line is
  normalised: red-light `opDone` rc is 0 (SUCCESS) or 8 (USERSTOP) depending on
  whether `lmc1_StopMark` lands during or between SDK calls — a real flake caught
  during T0b.
- **Coverage hole CLOSED:** every stock `.ezd` uses LEFT-aligned Code entities, so
  the center-aligned rotation formula was unreachable. The owner supplied
  `components/ezcad/temp-{left,mid}-align.ezd` (same file, alignment the only
  difference) → configs **B6/B7**. The "before" side was captured with the RETAINED
  pre-refactor binary (`laser_host_backup_phase7/T0_baseline/laser_host.exe`), so it
  is a real before/after proof; 7/7 identical.

**Phase 7 CLOSED — CP2 owner-confirmed 2026-08-03** (real-mode bench mark with the
board attached; that also covered the one residual risk both oracles miss, since
both are simulation-mode by construction).
`main.cpp` 897 → 111 lines. New units in `laser_host/`: `command_handlers`
(HostContext + Ack + a `cmd → handler` QHash — adding a command = 1 handler + 1
line), `mark_executor` (`runMarkData`), `mark_plan_builder` (`buildMarkPlan`),
`op_runner` (OpRunner: start/reapIfDone/stop + the opDone event), `dialog_dismisser`,
`mark_tracer`, `response_writer`, `mark_plan.h`. Scope card: `laser_host/README.md`.
Method that worked and is worth repeating on any behaviour-preserving refactor:
**build the oracles FIRST, then refactor in thin slices with both gates after every
task** (all 10 tasks passed first time),
plus a statement-level normalised diff against the retained pre-task sources for the
branches no test reaches. **Keep the pre-refactor BINARY, not just the sources** —
that is what made the late B6/B7 before/after proof possible. CP1: 2 findings, both
fixed — (MED) the markData op captured `&ctx.plan` while `HostContext` is destroyed
BEFORE `OpRunner`, so the destructor's join could read a dead plan → the op now
captures the plan **by value**; (LOW) `'\n'` in a Doxygen comment is a line-break
command, not text. Residual risks for CP2 (neither oracle reaches them): real-mode
init, DLL-load failure, rc=-8, kOpMarkAll/kOpRedLightAll, mid-op failure rc.

**Phase 8 SPLIT IN TWO (2026-08-03).** The request had 11 workstreams — bigger than
phases 5+6. **8A = IMPLEMENTED + CP1 done, CP2 PARTIAL** (`docs/history/plan/phase_8_plan.md`):
PLC tab pushes its address window live to the IO tab (the signal CARRIES the values —
`apply()` only reaches the config at Save, so a config re-read would show the pre-edit
window); import now closes + rebuilds the Settings page (it used to let a stale working
copy overwrite the imported config on Save — a real data-loss path); Ctrl+Q on
`actionSettings`; new `EzCad2WaitPage` (release the board → launch EzCad2 → wait page;
the retry checks the **EzCad2 PID**, not the init rc, because `EzdMarkerDevice` converts
the rc to a string before it reaches the app); `HatchNameEdit` snaps a typed token to the
registered spelling case-insensitively instead of silently deleting it; `##Date`
registered in BOTH the editor registry and `planner::resolvePlaceholders()` (editor-only
would mark the literal token). CP1 found 2 MED, both introduced by the EzCad2 task: the
menubar was unlocked during the hand-off (Ctrl+Q could stack a Settings page on it), and
`beginCommission()` there could stand the device layer up BEFORE the licence check —
`actionOpen_EzCad2` is now gated like `actionSettings`. **CP2 still open: the real-board
hand-off cases could not be concluded.** **8A CLOSED — CP2 owner-confirmed
2026-08-06** (the real-board EzCad2 hand-off + refuse-while-marking, run alongside
the 8B bench).

**Phase 8B — DONE, CP2 owner-confirmed 2026-08-06.** Plan +
review record: `docs/history/plan/phase_8b_plan.md`. The `externalParameters` mode:
a SECOND runtime path where the PLC supplies the circle diameter (ONE word ÷100),
power/speed (written to a DECLARED pen — no bound SDK call returns an entity's pen),
the mark date behind `##Date`, the content selected by `markPosType`, and the hatch
chosen by QR text; the part then follows the part-index VALUE, not `ChangePartTrigger`.
New `laser_mark_parameters.h` (`LaserMarkParameters` + `LaserMarkParameterValues` +
`laserMarkParameterTags()`, a pointer-to-member table that is the ONE list of the
seven parameters — verify(), the IO rows, the runtime read and the monitor all
iterate it), `HatchNameEntry::qrText`, `LaserMarkerConfig::textEntityPenNo`,
`decodeAsciiWords`/`readAsciiWords`. All new JSON keys optional on load.
**Owner corrections to the request:** `circleDiameter` ONE word ÷100; `markPosType`
adds a content on top of content 1 (always marked) — 1→content 2, 2→content 3; the UI
checkbox also gates editability; **`markDate` is ONE word holding an integer the PLC
composed** (I first built it as 2 words — 6 chars do not fit one word — the owner
corrected it; the runtime only calls `QString::number`, **no zero padding**);
`hatchMarkText` = 8 words.
**D11 was the phase's real safety net and it worked:** with the mode off, both
phase-7 oracles stayed byte-identical (7/7 + 3 passed/0 skipped) at every checkpoint,
and `runtime_test` asserts the classic plan/pen directly. **CP1 found 6 defects, all
fixed + covered:** the duplicate-hatch-name revert reverted nothing (live
`textEdited` had already overwritten the value it restored); the new IoKey had no
monitor row so it logged "unknown signal" into the operator's own log pane; a
**laser-board-sourced mode bit** would let the first prepare after Runtime entry run
in CLASSIC mode silently (laser inputs are refreshed by a different poll +
`resetRuntimeFlags` clears baselines) → `verify()` now requires a PLC tag; and a
mode/part change arriving **mid-mark** was consumed by a per-poll EDGE and lost
forever → rewritten as a STATE comparison (`m_preparedPartIndex`/
`m_preparedExternalMode`), which is self-healing. Lesson worth repeating: for
"react to a change" in a polled loop, compare state, don't watch edges — an edge that
arrives while the system is busy is simply gone. Open observation for the owner:
`productMarkingText` is a 20-word block but `validateContents()` caps a content at
36 chars, so the last 4 are unreachable.
**Three more findings came out of the CP2 bench (2026-08-06), all in
`phase_8b_plan.md` §8b:** (1) the D6 pen override was sent as a `setPen` BEFORE
`prepareMark` — but pen params belong to the **.ezd document**, so `loadEzdFile`
replaced the whole pen table and undid it; the override now rides ON the prepare
request and the host applies it right after the load (read-modify-write). Remember
this: **anything set on the SDK before a load is erased by the load.** (2) The
word-preserving split drops the run of spaces at a pass boundary and the host only
ever sees the pass strings, so a typed gap vanished on the part —
`planner::splitContent()` now reports the dropped count, `kKeyGapSpaces` carries
it, and the mark loop rotates `count * charSpacingDist * 1.5` extra. (3) Commission
marks came out at **almost no power** while the same .ezd marked fine by hand;
fixed by inlining `buildMarkPlan()`/`runMarkData()` back into their handlers AND
dropping the per-prepare `axisCorrectOrigin()` — **root cause never established**;
leading theory is the origin correction returning before homing finishes (in-code
note about error 140) so the axis still moves while the beam fires and the mark
smears. `mark_executor.*`/`mark_plan_builder.*` were deleted (one implementation
only), kept at `laser_host_backup_phase7/EXPERIMENT_inline_2026-08-06/`; do not
re-extract or restore the origin correction without a bench re-test.
**Diagnostics added and worth keeping:** the host has three stderr channels gated
by `NLM_MARK_TRACE` — `[mark-trace]` (geometry, and the phase-7 oracle),
`[cmd-trace]` (every command/response, emitted at the read loop +
`ResponseWriter::write()` so no handler can bypass it) and `[diag]` (pen table
around the load). The app now **sets that variable for the child by default** and
mirrors the child's stderr into `AppLogger` (`LaserHostClient::onReadyReadStderr`);
`NLM_MARK_TRACE=0` in the APP's environment switches it off. Before this, host
stderr went into an unread QProcess buffer and was discarded — a bench run produced
no trace at all. Keeping the prefixes SEPARATE is what let the geometry baseline
stay byte-identical through all of the above.
**Test-environment fact:** `laser_marker_test` needs the board **ATTACHED** (real
mode since D11 → rc=21 with no board), while both oracles need it **OFF**. The
suite cannot be all-green in one sitting; 8/9 is the board-off maximum.

**2026-08-06 — phases 8A and 8B both CLOSED (CP2 owner-confirmed).** Every phase
through 8B now has an owner-confirmed bench. Doxygen reference regenerated and
**`laser_host/` added to the Doxyfile INPUT** — the plan builder and the whole mark
loop live there since the inlining, so leaving it out hid the most consequential
code in the project; `doxygen_warnings.log` is now EMPTY and should stay that way.
Next: i18n EN/JA, then phase 9 (`docs/history/request/phase_9_request.md`: homing,
`EZCAD.CFG` editing, override-for-all-entities). Still carried forward: restore
`kAntiRoamIntervalMs` 1 min → **5 min** before production (the owner's own test
edit), and the `productMarkingText` 20-word block vs the 36-char per-row cap.

**Phase 9 — CLOSED 2026-08-07 (CP1 + CP2 owner-confirmed).** Plan:
`docs/history/plan/phase_9_plan.md`. Scope grew from "fix homing" to three
strands. (1) **Homing** is now the background op `kOpCorrectOrigin`
(`runHoming()`), abortable by Stop, bounded at 120 s, off the synchronous request
path (a home slower than `kOpTimeoutMs`=30 s used to drop the whole laser
session); the one-shot `correctOrigin` command was DELETED, not kept alongside.
(2) **The low-power-after-homing defect was solved** — root cause was our own
`DialogDismisser`, see [[dialog-dismisser-trap]]. (3) **SDK reverse
engineering**: `components/ezdlib/tools/extract_signatures.py` recovers the
argument shape of all 291 exports from `dumpbin /DISASM` (all `__cdecl`, 290/291
have standard ebp frames) into a generated, accuracy-gated
`MarkEzd_extracted_signatures.md`. The gate — re-derive 19 known signatures or
refuse to write — rejected its own first two runs and caught **two vendor-doc
errors copied into our typedefs**: `lmc1_Reset` returns `int` not `double` (the
`double` typedef read an EMPTY x87 stack → underflow, one uncommented line from
firing) and `lmc1_SetPenParam2` takes a `double dPointTime` the docs omit.
`lmc1_GetDevCfg` / `GetSysParam` / `SetTickleParam` / `OpenTickle` were
reverse-engineered and bound **probe-only**; new `tests/sdk_probe_test` (board
ATTACHED, opt-in flags `NLM_PROBE_HOMING` / `NLM_PROBE_MARK` for the cases that
move hardware or fire the laser) is deliberately OUTSIDE `run_all.ps1`.
Also: Open-EzCad2 blocked during a laser connect (reads the runner's existing
`m_busy` via `laserBusy()`); the part-index validity contract unified in
`MarkingController::registeredPart()` (>=1 AND registered) after an edit latched
a transient invalid and killed auto-prepare — `runtime_test` 20/20 now names the
recovery property. **Still open:** what else the dismisser swallowed (S3);
`lmc1_RedLightMarkByEnt` reads TWO args while we pass one. See
[[ezcad-config-drift]] — it invalidated two board-on results before being caught.

**Phase 10 — QR Code reader, CLOSED 2026-08-17 (S1–S11; CP1 + CP2
owner-confirmed).** Plan: `docs/history/plan/phase_10_plan.md`; schema reference:
`docs/rules/qr_code_schema.md`. A SECOND, independent PLC pipeline in
**`src/marking/qr/`** — PLC raises `qrReadRequest` → HMI switches to a QR page →
an HID scanner delivers text → a **data-driven parser** splits it into named
fields → each field is written to its own D block → latched
`qrReadCompleted`/`qrReadFailed`. Shares only the PLC link and the IO
abstraction with the marking bridge.
**Decisions worth remembering.** (1) The QR IO keys are a **separate** key set
(`QrIoKey::*`, PLC-only, own `qrCodeReader.io` map): `inputIoKeys()` is what
`verify()` treats as MANDATORY, so merging them would break Save on every machine
already in service. (2) Element tag addresses live in the **schema**, not the io
map — one address, one owner. (3) Word count is **`ceil(len/2)`**, not `len/2`;
the default schema's addresses only tile under it (a 3-char field takes 2 words),
which is independent corroboration, not a convention. (4) `QrCodeReader` holds
**no device/runner/part data** — it asks for writes by signal and the controller
routes them, which is what makes the pipeline testable with no PLC. (5) The
schema is **persisted**, so shipping a new resource JSON does NOT change a
machine that already saved one.
**Two all-or-nothing gates before any field is cut:** exact length, and format
markers (`matches`, e.g. `{"I%  ", 0}` — case- and space-sensitive). Length alone
says a scan is the right SIZE, not the right KIND of code.
**Capture is an app-wide `eventFilter`** (no focus needed), gated on the QR page
being visible so it cannot eat keystrokes typed into Settings, and it **rejects
hand typing** via `kQrMaxScannerKeyGapMs` (owner set it to **50 ms**). **CP2
bench measured the margin:** at 50 ms a human cannot complete a string longer than
**~10 chars**, against a 154-char content — ~15×. The guarantee therefore
**scales with the schema's `length`**; a schema of ≤10 chars would fall inside
human reach. Noted in `docs/rules/qr_code_schema.md`.
**CP1 found 1 defect:** `abort()` runs on every Runtime entry and emitted the QR
result outputs unconditionally, so machines with the module OFF logged "unknown
signal" into the operator's log pane — the SAME failure mode 8B's CP1 found. Now
gated on `m_resultLatched`; the regression assertion was **confirmed to fail
without the fix** before being restored.
Verified: `marking_test` 38/38, `runtime_test` 29/29 (3 consecutive runs),
`architecture_contract` 3/3, app 32-bit, Doxygen 0 warnings, and **both phase-7
oracles byte-identical with NO re-baseline** (geometry 7/7, protocol 3/3).
**No automated coverage for the capture mechanism** — there is no `ui` test
target — so the 50 ms rule and the filter are bench-only.

**Phase 11 — typed QR elements, CLOSED 2026-08-18 (CP1 + CP2 owner-confirmed).** Plan: `docs/history/plan/phase_11_plan.md`. One field on the QR
element schema: **`convertType`**. `""` forwards characters as before;
`int16`/`int32`/`float32`/`float64` parse the field as a number and write its
binary form across **1/2/2/4 registers, least-significant word at the LOWEST D
address** (Mitsubishi convention). New `src/marking/plc_number_codec.h`.
**Register count now follows the TYPE, not `length`** — declaring one resizes its
block in place, so every overlap check calls `wordCount()` instead of computing a
width. Conversion joins the all-or-nothing contract: not-a-number or
out-of-range **fails the whole read**, integers are strict (`"100.0"` refused),
blank → 0, unknown type = raw at runtime but **rejected by `verify()`**.
Purely additive: a schema without the key parses as raw and produces
byte-identical registers to phase 10 (asserted on both reference samples).
**Word order is pinned by LITERAL word values in tests** — a round-trip through
our own decoder would agree with itself when reversed, and wrong order produces
plausible numbers rather than an error; CP2 must read the registers back.
Owner changed the shipped default mid-implementation to `Quantity`=**int32**
(8-char field — int16 would fail above 32,767) and `Product number`=raw.
CP1 found 2: "too big for 64-bit" was reported as "not a number"; and nothing
enforced written-block == reserved-block (a future type added to one side only
would write past into the next element). Both fixed + covered.
**CP2 confirmed the numbers on hardware AND reversed a phase-10 rule:** a `Raw`
field is now forwarded **VERBATIM** (nothing trimmed) with ONE trailing space
added when the length is odd — so an all-blank field arrives as **spaces**, not
as an all-zero block. PLC code testing a zero word for "empty" must test spaces.
`Special marking` moved to `length: 2` since an odd length is padded anyway.
Lesson: phase 10 had written the trimming rule down twice as deliberate, and it
was still wrong — it reasoned about a PLC-side convention nobody had measured.
Verified: `marking_test` 43/43, `runtime_test` 31/31, `architecture` 3/3, app
32-bit, Doxygen 0 warnings, **both phase-7 oracles byte-identical, no
re-baseline** (geometry 7/7, protocol 3/3).

**External-parameter revisions (bench, 2026-08-19).** Two phase-8B members
changed after phase 11's CP2: **`markDate` is now 4 words ASCII** (`kMarkDateWords
= 4`), not one numeric word — one word capped it at 5 digits and could not carry a
`YYYYMMDD`; and **`hatchMarkText == "0"` is a sentinel meaning NO HATCH**, folded
into empty inside `readLaserMarkParameters()` so `applyExternalParameters()` only
tests for empty (a PLC has no blank word to send). Both locked by
`runtime_test::test_external_parameters_ascii_date_and_hatch_zero_sentinel` — and
note the "0" case is load-bearing: without the sentinel the prepare FAILS (no
registered hatch has qrText "0"), so MarkerReady never arms.
**Also: the QR default schema's `Marking date` element reads `startIndex` 34, not
95** — chars 34..41 are `6731`, NOT the `20260731` at 95. Owner-confirmed
deliberate; only the element NAME is a leftover misnomer. Renaming it would change
the Settings + monitor row keys, so it was left alone.

**Phase 12 SPLIT IN TWO (2026-08-19, owner decision).** The request had 10
workstreams across logger, device config, IO, the state machine, UI layout, a new
widget, SDK reverse engineering and a graphics view — and the two halves need
different benches. **12A** (`docs/history/plan/phase_12_plan.md`) = recovery log
noise + extended-axis wiring + axis-error safety; **12B**
(`docs/history/plan/phase_12b_plan.md`) = parts-tab layout, `PartRegisterView`,
the menubar action, the preview-bitmap RE and `LaserPreviewWidget`.

**Phase 12A — CLOSED 2026-08-21 (CP2 owner-confirmed; B1 still OPEN, carried to
`docs/history/technical_debt.md` item 5).**
Five additive fields on `LaserExtendedAxisConfig` (`axisErrorInputPin` +
`useAxisErrorInputPin`, `axisDisablePin` + `useAxisDisablePin`, `autoHoming`), two
new IO points (`extendedAxisOrigin` in, `extendedAxisError` out), and a driver
error that stops the mark and raises `MarkerError`. **All off by default.**
**The decision that shaped the phase:** `EzdMarkerDevice::pollIo` is suspended for
the whole duration of a mark (the host rejects every command but stop while an op
runs) — which is exactly the window where "stop immediately" means anything. So
the pin check moved INTO `laser_host`'s mark loop (`setAxisErrPin` → `kRcAxisError`
on the existing `opDone`), and the app's poll covers only the between-marks case.
That cost nothing at the oracles, **measured not assumed**: geometry byte-identical
7/7, protocol golden **0 lines removed / 9 added** (it is a scripted session, so a
new command only appears when the script exercises it).
**Pins are laser-board BIT indices** (0..15), not connector pin numbers; an
out-of-range value folds to `kNoPortBit` rather than clamping. `verify()` refuses a
driver pin colliding with a laser-board IO binding — **per direction**, since input
and output are separate 16-bit registers.
**Membership in `inputIoKeys()`/`outputIoKeys()` ≠ mandatory** — both new keys carry
`verify()` exemptions (origin never required, error required only when
`useAxisErrorInputPin`), or the upgrade would break Save on every installed machine.
**Recovery log suppression lives at the emit site in `MarkingController`, not in
`AppLogger`** (the request said "logger"): the logger is process-wide and cannot
tell the eighth reconnect failure from the eighth mark failure. First failure logs,
identical repeats are swallowed, a CHANGED reason always logs, and reconnecting logs
one summary with the attempt count. The status bar is not suppressed.
**CP1 found 3, all fixed.** F1 was real: a FAILED home cleared the in-flight flag
and re-armed `MarkerReady`, so the machine marked on an axis at an unknown angle —
the plan had written the correct behaviour down and the code contradicted it. Now a
separate `m_axisHomingFailed` blocks marking until a fresh attempt succeeds (via the
origin input or the Commission button), and failures are NOT auto-retried. The
regression test was confirmed to fail without the fix. F2: `maybeAutoHome()` logged
a false "laser is busy" warning on any status change during homing. F3: an
unreachable state + a missing null check.
**Known gap:** the `kRcAxisError` → message → latched `MarkerError` path has no
automated test (`FakeLaserDevice` carries no rc) — it is CP2 item B4.
**CP2 took THREE rounds (2026-08-20). B2–B8 all pass; B1 failed twice before the
right fix, and all three attempts were the same mistake in different clothes: I
reasoned about the mechanism instead of measuring it.**
- **B1 round 1.** Suppressed the three connect-failure lines `MarkingController`
  emits, assuming that was the flood — wrong EMITTER.
- **B1 round 2.** Put a **consecutive**-identical-line collapse in `AppLogger` —
  wrong SHAPE: the noise repeats as a cycle of different lines, so adjacency never
  matches. **This whole change was later reverted.**
- **B1 round 3 — the actual fix.** The pane is **`log_event_view`** (the curated
  `TaskEventLogWidget`), which **`AppLogger` does not feed at all**. It is fed by
  `RuntimeForm` from `plcConnectionChanged` / `laserConnectionChanged` /
  `errorOccurred`, and **`IDevice::setConnectionStatus()` emits UNCONDITIONALLY,
  never on change** (idevice.h:130) — so a device retrying every 10 s re-reports
  the same status forever, and each report appended a row.
  Fix: `RuntimeForm::logEventOnChange()` — record an event only when the text
  differs from the last one **for that source**. Per-source is load-bearing: a
  Recovery cycle interleaves PLC/Laser/Error rows, so a single "same as previous
  row" test never matches (that is exactly why round 2 failed). Lamps and the
  error banner still refresh on every report — they show current STATE, so
  re-setting is idempotent; only the HISTORY needed protecting. `markStarted`
  clears the remembered Error text so a recurring fault after a good mark logs
  again.
  **`AppLogger` writes every line it is given — no dedup. Do not re-add filtering
  there** (noted in `src/core/README.md`); a suppression that belongs to one view
  does not belong in a process-wide sink.
- **⛔ B1 round 4 — STILL FAILED, marked FAILED and left OPEN.** Owner measured:
  **one** device down (PLC *or* laser) is now correct; **BOTH** down at once still
  repeats. `logEventOnChange` is kept (it fixes the single-device case).
  Hypothesis, **explicitly unconfirmed**: the per-source rule compares only
  against the LAST event for that source, so an alternation *within* a source
  (e.g. `Disconnected` → `ConnectFailed` each retry) defeats it, and two devices
  retrying together traverse more states than one. **Next step is MEASUREMENT —
  capture the actual row sequence (source + text, in order) with both devices
  down.** Three rounds were already lost to plausible stories; do not attempt a
  fourth fix from reasoning. And do NOT widen the dedup key: that would silence
  the single-device case that now works, and over-suppressing this pane fails
  invisibly.
- **B7:** autoHoming and the Runtime-entry auto-prepare both fire on entering
  Runtime; the host serves ONE op at a time, so the prepare hit a busy host, got
  rc=-3 and was **lost** — MarkerReady never armed after a startup with autoHoming
  on. `maybeAutoPreparePart()` now treats homing as busy (pending flag stays
  armed), `onChangePart()` re-arms rather than drops, and `onAxisOpFinished()`
  **kicks the deferred prepare directly** instead of waiting for the next PLC poll
  (the test caught that the deferral worked but the recovery depended on a poll).
- **Error-pin polarity is now a setting** (owner request):
  `LaserExtendedAxisConfig::axisErrorActiveLow`, default **false = active HIGH**.
  Applied in **both** readers — the app's IO poll and the host's in-mark check
  (`setAxisErrPin` gained `activeLow`). If only one had it, a fault would abort a
  mark while MarkerReady stayed armed. UI: an *Active high / Active low* combo.
- **UI (owner):** axis-release checkbox → checkable **button** on the Move /
  Correct origin / Read row; both pin spin boxes are **0..15, no "not wired"**
  (the board port IS 16 bits, so the `use*` checkbox is the only off switch).
Verified: `marking_test` 46/46, `runtime_test` 40/40 (3 consecutive runs),
`architecture` 3/3, app 32-bit `0x014C`, Doxygen 0 warnings, geometry oracle 7/7
byte-identical, protocol golden identical (133 lines; every pre-phase-12 line
untouched).
**Also fixed a flaky test of my own:** `test_auto_homing_runs_once_per_laser_connection`
used `QTRY_COMPARE(state, Recovery)` after a PLC drop, but the 150 ms test retry
reconnects faster than QTRY polls — it now RECORDS the `stateChanged` transitions
and asserts Recovery appears among them.

**Phase 12B — CLOSED 2026-08-21 (CP2 owner-confirmed, C1–C22, FOUR bench rounds).**
Plan: `docs/history/plan/phase_12b_plan.md`.
**B5 (SDK reverse engineering) answered the phase's big risk: the preview IS
buildable, proven from the binary.** All nine preview exports are wrappers over
ONE DataMgr function whose C++ mangled name states its own signature:
`CBitmap* __cdecl gf_DrawPrevBitmap(CWnd*, int w, int h, CEntity*, int flags)`.
Method: `dumpbin /DISASM` + `/IMPORTS`, resolving call targets by IAT index
`(thunk - iatBase)/4`. Findings now in `components/ezdlib/MarkEzd_DLL_Reference.md` §5:
- **`lmc1_GetPrevBitmapByName(name, HWND, w, h)` is the per-entity API** (looks
  the entity up, passes it as the `CEntity*`).
- **`lmc1_FreeBitmap` is a COMPLETE release** — `GDI32!DeleteObject` + a scalar
  deleting destructor via vtable. The old comment in `mark_ezd_controller.h`
  ("SDK exposes no matching free call") is **wrong on both counts**.
- **`lmc1_GetPrevBitmap2(w,h)` takes NO HWND** — it uses the owner window
  `lmc1_Initial` stored at `0x1007FEC4` (written at `0x1000C707`, inside init).
- **`lmc1_GetPrevBitmapByRange` DROPPED from scope**: it opens with a capability
  gate (`and eax,1000h`) and returns 0 when the bit is clear — it can fail per
  dongle for reasons unrelated to its arguments.
- `GetPrevBitmap3`, `ByName2`, `DrawAllEnt`, `DrawTextInWnd`: **NOT DETERMINED**,
  recorded as such rather than guessed. None needed.
**B1–B4 (UI):** parts tab scaffold moved into its `.ui` (named `partsSplitter`,
one titled box per side, part list stretch 3:1 — the `setMaximumHeight(160)` hack
is gone); row widget re-laid out (ordinal moved from the drag column to a
`TypeChipLabel` in the header; **row 2 is no longer collapsible** — merging rows
1+2 is what that means; **the handle icon is now the ONLY drag trigger**); new
read-only `PartRegisterView` (**rows are INDEX NUMBERS 1..highest, not registry
entries** — an unregistered index is a blank row, which is how a GAP becomes
visible); menubar **Registered Part** action opening it MODELESS.
**Trap worth remembering:** `MarkingController::config()` returns a deep COPY, so
`config().parts.get()` dangles immediately — `MainWindow` holds the snapshot
(`m_registeredPartsCfg`) and refreshes it via `setParts()`, which emits
`partsChanged()` so the view rebuilds with no widget churn.
**B6–B9 (preview pipeline) DONE 2026-08-20.** `MarkEzdController::previewImage()`
does render → GDI readback → free in one call; the MFC handle comes from
`[vtable][m_hObject @ +4]` and is **verified with `GetObject()`** so a wrong
offset returns null instead of a corrupt image; `lmc1_FreeBitmap` on EVERY path
(long-lived host). Host command `prevBitmap` returns a **base64 PNG** + the mm
bbox. `LaserPreviewWidget` (QGraphicsView) shows one pixmap item per entity.
**Things that bit or nearly bit:**
- `laser_host` was `QT -= gui`; it now links QtGui for QImage/PNG (raw BGRA would
  be ~1 MB per frame on a line-delimited JSON transport). QImage needs no
  QGuiApplication; QPixmap would.
- `gdi32` went into **`device.pri`**, not each `.pro` — the module calling
  `GetDIBits` owns its link requirements.
- New rc values are **-112 / -113**: `-2..-7` are already taken (unknown command,
  busy, not prepared, missing text entities, bad axis, missing hatch entities) and
  the golden pins every one. `kRcNoPreview` is deliberately NOT a transport
  failure — the session is fine, so the app must not drop the laser.
- **Promoted widgets must be at GLOBAL scope**, not `vc::ui` — uic emits the class
  name unqualified. Every promoted widget here already followed that.
- One Y flip in the view transform (laser Y up, Qt Y down) so callers use machine
  mm coordinates; white masked to transparent or overlapping entities occlude
  each other (looks like a placement bug, is not).
- The golden takes only the FAILURE shapes of `prevBitmap`: a real PNG depends on
  the rasteriser/.ezd/display and would fail on another machine for nothing.
**Bench found B8 half-done (2026-08-20) — worth remembering as a PATTERN.** The
preview pipeline was fully plumbed (device → runner → controller → widget) and
**nothing ever called it**; no preview appeared and nothing errored. I had also
reworded the B8 task line when marking it done, to describe what I built rather
than what was asked — which hid the gap. Fixed: `m_preparedEntityNames` captured
while the plan is BUILT (filtered contents + hatches, so the preview asks for
exactly what is marked), `requestPreparedPreviews()` called from
`onRuntimePrepared()` on success (the only moment the host holds the part's .ezd
with its text set), and a new `previewsCleared()` signal so a 4-entity → 2-entity
part change does not leave stale items. **Lesson: a request that is never issued
fails silently** — the test asserts on requests REACHING the device (confirmed to
fail 0-vs-1 with the call removed), and the fake needed a `requestPreview`
override because the base class default is a no-op that would pass either way.
**Bench rounds 2–4 (2026-08-20/21) — three more defects, all invisible from the
code and from a green suite, because each was a claim about something OUTSIDE the
process.**
- **Round 2, the important one: `prepareMark` only LOADS the `.ezd`.** The text of
  each entity is set at **MARK time**, pass by pass, in `mark_executor.cpp`. So a
  prepared document still holds the TEMPLATE's text and the preview showed the
  template, not the part. Fix: `prevBitmap` takes an optional `text` — the host
  sets it, renders, measures, and **restores the old text** (a preview must never
  change what a later mark or red-light produces). The app sends each entity's
  whole ROW content, captured in the same loop that builds the plan
  (`m_preparedEntityPreviews = {name, text}`). Hatches send none.
  *I had asserted the opposite in a comment and never checked it against the
  executor* — the same failure mode as the B8 gap above.
- **Round 2 also:** `QGraphicsPixmapItem` hit-tests with `MaskShape` by default,
  and the mask here is the glyph STROKES (white is masked away), so a click only
  selected if it hit a stroke → `BoundingRectShape`. And the zoom clamp was
  ABSOLUTE while scene units were mm: `fitInView` on a 20 mm row picks scale ~30,
  so a `kMaxZoom` of 40 was nearly exhausted **by the fit itself** → the clamp is
  now RELATIVE to the fit scale.
- **Round 3:** scene units are no longer mm (`kSceneUnitsPerMm = 100`) — at 1
  unit = 1 mm the drawing lives in sub-pixel numbers; pixmap smoothing OFF (these
  are laser marks, interpolation reads as blur); pan hand-written on `NoDrag`
  because `ScrollHandDrag` owns the left button and **cannot share it with
  selection**; scene rect 5x the drawing so a corner detail can reach mid-screen;
  middle-double-click resets (`resetTransform()` clears the Y flip too, so the
  reset re-applies it). Also `ResponseWriter` now **elides the `png` value from
  `[cmd-trace]`** — one preview buried the transcript in base64.
- **Round 4:** selection box stands off 5 SCREEN px; each entity gets an ink
  contour (a scan for maximal edge runs, never stitched into loops — the path is
  only ever STROKED) whose width moves inversely with zoom.
- **`fitToView()` must measure the PREVIEW items**, not
  `m_scene->itemsBoundingRect()`, which includes the hidden selection box sitting
  at the origin — that stretched the fit from (0,0) to the part.

**Close-out (2026-08-21, board OFF):** geometry oracle **7/7 byte-identical**,
protocol golden **139 lines identical**, `runtime_test` 42/42, `marking_test`
46/46, `architecture` 3/3, app + host `0x014C`, Doxygen 0 warnings.
**Trap caught during that close-out, now in `tests/README.md`:** each oracle runs
a **COPY** of `laser_host.exe` in its own build folder. Rebuilding the host does
NOT update those copies, so the first protocol run passed against a binary three
hours older than the code under test — a false green, worse than a failure.
Refresh both copies first. (Its Debug build was also 4 days stale and reported a
bogus drift; use the Release build.)

**Phase 13 — CLOSED 2026-08-21 (CP2 owner-confirmed).** Plan:
`docs/history/plan/phase_13_plan.md`. One defect: **the entity preview never
worked with the licence enabled.** `handlePrevBitmap` drew through
`HostContext::ownerFallback` — a member populated ONLY when the app supplies no
owner window — so with an owner supplied it was null, the SDK rendered nothing,
and the handler answered rc=-112 with a message ("no entity X") that sends the
reader hunting for an entity that is present. **A field used against its own
name**, both halves written by me.
**Why it hid for a whole phase:** `setOwnerWindow(winId())` sits inside
`#ifndef LICENSE_BYPASS_FOR_DEV`. Bypass on → app sends `owner:0` → host builds
its own window → preview works. Nothing about a licence `#define` looks related
to a graphics view. **Bench with the licence ENABLED from now on.**
**Method that worked and is worth repeating:** the log gave the correlation
(owner=0 → 14/14 render; owner=HWND → 18/18 fail, cutover at the first
licence-enabled run), then a hand-driven stdio probe PROVED it before any code
changed — same host/.ezd/entity, one argument different. After the fix both
paths return byte-identical bboxes.
Fix: preview always draws through a window the HOST owns (`ensureHostWindow()`);
`lmc1_Initial` untouched (frozen by both oracles). `hostWindow` now records
OWNERSHIP only, so nothing can be read as "the owner in effect".
**The golden could not have caught it by construction** — it scripted
`prevBitmap` only in its two FAILURE shapes, from the sound premise that PNG
bytes are not portable and the unsound conclusion that the **rc** is not either.
New case `test_preview_renders_with_an_app_supplied_owner_window` asserts rc==0
with an owner SUPPLIED, outside the byte-for-byte transcript (so no re-baseline).
Verified: geometry 7/7 byte-identical; golden re-baselined by EXACTLY ONE
intended line (the improved kRcNoPreview message, rc unchanged — diffed
line-by-line before overwriting); runtime 42/42, marking 46/46, arch 3/3, app
0x014C, Doxygen 0 warnings.
**Two build traps found on the way, both WORSE than the bug** (now in
`docs/rules/build_and_verification.md`): (1) there are **two `laser_host` build
trees** — `deploy_dependencies.pri` copies from `build/release/release/` (Qt
Creator layout), while building from `laser_host/build` writes `build/release/`,
which nothing deploys; (2) that copy is a **`QMAKE_POST_LINK`**, so it fires only
when the app LINKS — rebuilding the host then the app does nothing if no app
source changed. Both give a green build and a stale binary. **Always check the
timestamp of the DEPLOYED laser_host.exe, not the one you just built.**

**2026-08-21 — `kAntiRoamIntervalMs` RESTORED to 5 min by the owner.** That
long-standing carry-forward is CLOSED; do not keep flagging it. (The stale
comment fragment above it, left over from the 1-min test value, was cleaned up.)

**Phase 13 §6 — phase 12A's B1 CLOSED 2026-08-24 (bench-confirmed).** Root cause
was **not a missing suppression but a missing KEY**. A connect failure reached the
event log on TWO paths: per-device rows via `connectStatusChanged`, AND one shared
`"Error"` row via `connectionFailed → errorOccurred`. Every dedup on the second
path used a field shared by both devices, so a PLC failure compared against a
laser failure was always "new" — with both devices down, every retry logged.
Fix (owner's chosen direction, better than my widget-side proposal): split
`connectionFailed` into its OWN runner signal, taken by TWO per-device controller
slots gating on `ConnectNoise::lastMessage`. Measured 19 → 9 rows / ~8 cycles;
assertion confirmed to fail 8-vs-1 when the key was made shared again.
`m_lastRunnerError` in `onRunnerError()` is still shared — knowingly, documented:
device faults are not periodic, so the collision has never been observed there.
**Lessons worth keeping:** (1) what broke a three-round deadlock was an
INSTRUMENT, not an idea — a test that printed the actual (source, text) sequence;
(2) its FIRST version gave both fakes the same failure text, so they could not
alternate and the defect stayed invisible *inside the test built to see it* —
always give fakes DISTINCT identifying strings; (3) trace duplicate delivery paths
before fixing the symptom: my widget-side proposal would have deduped each of two
copies and still left two rows per fault.

**Also 2026-08-21: technical-debt item 6 opened** — `EzdMarkerDevice::m_simulation`
is written in 4 places and READ IN NONE. A Commission no-board session reports
plain "Connected", so an operator can commission against no hardware believing it
is live. Needs a product decision (should a demo session be labelled?), not just
code. NOT related to the B1 split — demo is a SUCCESS path.

**Superseded (kept for the pattern): phase 13 §6 earlier state —** The approach starts with an INSTRUMENT, not a fix — T9 records the
ordered `(source, text)` transcript reaching RuntimeForm while BOTH devices are
down and retrying, T10 is a hard checkpoint before any code. Key argument: most
of that path is REAL in `runtime_test` (the controller's Recovery loop,
`IDevice::setConnectionStatus()`, and the fakes already support
`injectLost()`/`setFailConnect()` on both devices), so the measurement the three
failed rounds each guessed at is cheap and repeatable — it does not need a bench.
What is NOT real: `RuntimeForm` itself (no `ui` test target), so the BENCH stays
the authority and the test is only the instrument.

**Phase 14 — ❄ FROZEN 2026-08-25 mid-acceptance** (owner started phase 15 first).
CP-A/CP-B confirmed; **CP-C (owner must FOLLOW a commissioning procedure, not just
read it), CP-E (Japanese review) and the 20 screenshots are outstanding.** No manual
page references an image yet, so it still builds clean and thawing is cheap.
Phase 15 changes the part schema the manual documents → phase 15 owns a task to
update both language trees. Was: i18n + signal charts + the user manual, IMPLEMENTED
2026-08-24. Plan:
`docs/history/plan/phase_14_plan.md`; glossary: `docs/rules/ja_glossary.md`;
manual build: `docs/manual/README.md`.
113 `.ts` strings translated (588 finished / 0 unfinished / 0 empty / 0 placeholder
mismatch), 9 new timing charts in `uml/07_marking_signals.puml` covering the rest of
`io_binding.h`, and a 26-page two-language manual at `docs/manual/manual_{en,ja}/`
(one root per language, each `manual.html` + `source/`, 0 Doxygen warnings).
**Four defects found, ALL of them already shipped — every one found by measuring,
none by reasoning:**
(1) `rt_sig_7_stop_abort` had been WRONG in the reference since phase 11 — it showed
`markerReady` re-arming when `markingStop` re-closes, but `onStopEdge()` deliberately
does not clear `m_markOpOutstanding`, so re-arming also needs the aborted op's
completion from the host. Drawn from design intent instead of source.
(2) The JA glossary was wrong on **eight of the most frequent terms** until measured
against the 475 shipped strings: the installed vocabulary is `刻印` (56), `品番` (30),
`レッドライト`, `ハッチング`, `読み取り`, `インデックス`, `トリガー`, `スキャナー` —
not the "better" `マーキング`/`品種`/`ガイド光`. **Rule: an installed term beats a
better term.** Same for phase names — the screen says `待機/手動/実行/再接続`, NOT
the literal `待機/調整/運転/復旧`.
(3) `Idle` and `Not initialized` BOTH rendered `未設定` — two states indistinguishable
on screen. Idle → `待機`.
(4) **Seven entries were marked translated with an EMPTY string**; `lrelease` counts
those as finished, so they would render blank rather than fall back to English.
**Two traps for next time:** quoting an app message in the JA manual must come from
the `.ts` verbatim — 8 re-translations were all plausible and all wrong; and
`\ref m_x。` silently breaks (Doxygen eats the Japanese full stop into the label, and
full-width `）` too) — 28 of these, invisible in the markdown, caught only by the
0-warning gate.
Deviation: T15 (JA manual) was written BEFORE CP-C against the plan's own ordering,
because the owner asked to continue — so bench corrections to the English must now be
mirrored into `contents_ja/` by hand. Screenshots outstanding:
`docs/manual/screenshot_list.md`.

**Phase 15 — CLOSED 2026-08-25 (CP-1, CP-2, CP-3 all owner-confirmed).** Plan:
`docs/history/plan/phase_15_plan.md` (§8b is the close-out). The request was
**rewritten by the owner** — no longer the old "Considering" list (EZCAD.CFG /
homing-from-input / connection checking); those are unscheduled, not dropped.
Shipped: `PartRegister`'s `pattern`/`fileNumber`/`circleDiameter`/`gap` → a
`QList<EzdEntry>` (always ≥1, migration one-way); `selectByDiameter` (**no
`diameterSelection`** — O1 was an error in the request; the matched value is
`LaserMarkParameterValues::circleDiameterMm`); `selectEzdEntry()`; direction-split
IO tables in the IO **and** QR tabs behind `IoBindingTableRouter`;
`EzdEntriesWidget`; expand/collapse-all; `preparedPlanChanged` + the runtime
panel's Ezd/Diameter/mode rows. Gates: marking_test 51/51, runtime_test 50/50,
architecture 3/3, app `0x014C`, both phase-7 oracles byte-identical, manual EN+JA
and reference all 0 warnings, `.ts` 611 finished / 0 unfinished.
**O2 changed the plan's central decision:** matching is `sameDiameter()` — an
absolute epsilon of half the editor's step — NOT the integer word the plan
proposed. `==` and `qFuzzyCompare` (relative tolerance) are both wrong. **One
predicate serves the matcher AND `verify()`'s uniqueness rule**, or a list could
pass Save as unique while the matcher still finds it ambiguous. Consequence the
owner accepted: 3-decimal editor over a 2-decimal wire, so a registered `30.125`
can never be selected — documented, not prevented.
**Four defects found AFTER implementation, three on the bench, and every one was a
SILENCE rather than a crash** (full accounts in plan §4.5 / §5.4):
(1) the staleness rule had no diameter term, so the feature's own primary case
marked the wrong `.ezd` with `markerReady` **high**;
(2) the focus rule was correct and **unreachable** — clicking a row did nothing
because only editors took focus (fixed with `Qt::ClickFocus`; see
[[ui-offscreen-probe]], which is how it was diagnosed);
(3) splitting the IO table halved the tag-collision guard — **and
`MarkingConfig::verify()` never had a bit-uniqueness rule at all**, so duplicates
could always arrive in an imported config;
(4) every failure branch of `prepareMark()` reported via `statusMessage()`, which
reaches only the status bar for 8 s — the log ended mid-sentence and read exactly
like a crash. **Rule: a branch that decides not to mark must say so where the
record is kept.**
Also: a first cut of the new uniqueness rule **rejected correct wiring** — laser
board input bit N and output bit N are different registers (the asymmetry
`verifyExtendedAxisPins()` has encoded since 12A). Caught by an existing test.
**Carried out unresolved (owner decision):** six output signals have up to THREE
live Japanese renderings across the glossary, the IO tab and the runtime monitor —
measured and tabulated in `docs/rules/ja_glossary.md` §12, deliberately NOT
normalised. Related trap: **`lupdate`'s same-text heuristic proposed replacing the
IO tab's installed terms with the monitor's on 5 of 62 strings** — always check a
renamed row against its own `vanished` entry, never accept the suggestion.

**Phase 16 — serial transport + the 1C/3C computer-link frames, CLOSED 2026-08-27
(CP-A…CP-E; CP-D owner-confirmed on a real PLC).** Plan:
`docs/history/plan/phase_16_plan.md`. `McMsgSerialPort` + `Context_Mc1C`/`Frame1C`
+ `Context_Mc3C`/`Frame3C`, the PLC tab's serial editor and a **Frame settings**
group box, and `McProtocolConfig::switchFrame()`. New target
**`tests/mc_protocol_test`** (74 cases, in `run_all.ps1`): the FIRST automated
coverage the MC codecs have ever had. Gates: runtime 52/52, marking 51/51,
architecture 3/3, app `0x014C`, manual EN+JA + reference 0 warnings, `.ts` 675
finished / 0 unfinished, both phase-7 oracles byte-identical.
**The supplied reference was a DIFFERENT LINEAGE** (Qt 6, no transport `clone()`,
an abstraction this project removed) — read as a spec and PORTED, never merged.
Two places the port deliberately departed from it were later **confirmed on the
real PLC**: word-packed bit reads parse 4 hex chars as one 16-bit word (a 64-coil
read returned `0800…` → M2011=1, a coil that really was on), and a word read stores
one 16-bit value per address.
**The frame DECIDES the transport** (owner O5): 1E/3E Ethernet, 1C/3C serial; the
interface combo is derived and disabled.
**Defects found after implementation, all silences again:**
(1) the per-frame context cache only worked across save/reload, so rebuilding the
context when the operator picks a frame would have **silently reset the running
machine's IP** the first time anyone glanced at 1C → `switchFrame()`;
(2) **Connect never applied the tab's edits** — it connects with whatever the
DEVICE holds, so a typed COM port was ignored → `applyPlcConfigAndConnect()`
(disconnect-on-worker → detach → push → attach → connect; `setMcProtocolConfig()`
is a no-op while connected);
(3) sum check was expected on EVERY response — but **a response with no data and an
abnormal response carry none**; an ACK's CR+LF was read as hex and failed every
write, including the heartbeat coil. Only `STX…ETX` carries one. Ranges: request =
frame ID + access route + request data; response = the same + data + **ETX**.
**The bench fault was not the sum check at all — the baud was 56700, not a standard
rate**; the adapter garbled every frame. Settled by a **read-only wire probe**
(batch-read frames only) driving the shipped codec against the PLC on COM6. Three
captured frames are pinned byte for byte.
**Two instruments earned their keep:** `McProtocolDevice` now logs the request AND
the raw reply when a response is refused; and a T15 test that PASSED with the code
it was testing deleted had to be thrown away and rebuilt around a real
`McProtocolDevice` behind the controller's device seam.
`lupdate`'s heuristic struck again — it offered **刻印** (engraving) for the serial
line's **mark parity**. Convention read off the file: `vc::device::mc` leaves
identifier-shaped keys alone, translates only real words.
**Defaults corrected 2026-08-28** to what the module runs — **57600, sum check ON**
— not O2's first answer. The codec tests now set sum check EXPLICITLY in their rigs
so a changed default cannot move a pinned golden.
**Fully closed 2026-09-11:** CP-D's failure paths owner-confirmed, and both phase-7
oracles byte-identical at close (geometry 7/7, protocol golden 139 lines).
Handed back: `MarkingController::checkConnectPlc()` has had NO caller since T15 —
kept, not deleted, awaiting an owner decision (noted under D12 in
`architecture_decisions.md`).
**Carried to the frozen phase 14:** `contents_ja/.../plc_setting.md` names PLC-tab
fields in ENGLISH while the app shows them in Japanese — plan §2.6.

**2026-10-05:** `checkConnectPlc()` REMOVED (owner decision; docs updated).
`tests/marking_test` had NOT compiled since phase 16 (`QSerialPort` reached it via
`marking_config.h`; its `.pro` lacked `serialport` + moc for the 1C/3C/serial
headers) — phase 16's "marking 51/51" was a STALE exe run by a script that hid jom
errors. Fixed; fresh build really is 51/51. **Test scripts must delete the old exe
before building.** 2026-10-06: five laser test `.pro`s (`QT -= gui`) had not
compiled since phase 12B added `<QImage>` to the laser device headers — fixed
(`QT += gui`, `-lgdi32`). **Close-outs must BUILD every test project, not just
run the 4 board-free suites.** **Phase 17 — CLOSED 2026-10-07** (auto-reset of marked/makerError/partNameValid/
partNameInvalid; CP-B owner-confirmed on the real PLC; oracles byte-identical —
the golden is 138 raw lines, the "139" in older notes was a counting convention).
Oracle build dirs under `tests/<name>/build/release/` are gone; run oracles from
clean `build\chk_*` builds with the deployed host copied + hashed. Key design: mask only the DRIVEN level
(`AutoResetPair` in `refreshOutputs()`), never the flags — `markerReady()` needs
`m_partNameValid`. Owner range 1–10 000 ms, default 1000. `phase_18_request.md`
is still a draft.

**2026-10-07: Phase 14 CLOSED by owner decision** (owner-review rows closed by
decision, not measured; the manual ships WITHOUT screenshots — T12b never done;
JA PLC-page English field names + glossary §12 drift carried forward). **Every
phase 1–17 is now closed.** Same day the project became a local git repo — see
[[git-local-repo]].

**Phase 18 — build restructure, IMPLEMENTED 2026-10-07, commit `6098b4a`** (plan:
`docs/history/plan/phase_18_plan.md`, ADR D13). Root `NichirinLaserMark.pro` =
subdirs (deploy, laser_host, app, tests); EVERY exe → `build/bin/<debug|release>/`
with ONE EzCad2 runtime copy + `tests/material/` fixtures (`qmake/deploy/deploy.pro`,
runs every build). Shared settings `qmake/common.pri`; machine paths in untracked
`qmake/local.pri` (template `local.example.pri`). `MainWindow` moved to
`src/ui/shell/main_window.*`, class name kept (tr context). CLI build:
`build\cli\<cfg>`, `qmake ... -spec win32-msvc "CONFIG+=<cfg>"` + jom. Oracles run
from `build/bin/release` (no more host copies). Open: Project Leader's Qt Creator
Build All + bench start from `build/bin/release`. The old notes above about
`tests/<name>/build`, `build\chk_*` and copying hosts are OBSOLETE.

Phase 18 CLOSED 2026-10-07 (PL-confirmed; closure commit `8d2ff9c`).
**Phase 19 — plan APPROVED 2026-10-08** (`docs/history/plan/phase_19_plan.md`,
rev. 3): slices 19A components + PLC (vendor qpb 1.7.0 MIT as static lib via
`qmake/qpb/qpb.pro`; vendor `C:\DGB\Project\mc_protocol` 0.1.0 MIT behind a
`McProtocolDevice` adapter + on-demand read; 3E/3C bench re-verify), 19B
placeholders (fixed set, user `#NAME#` ≤32 chars, Text/Int/Float/Hatch read on
demand at prepare; `##Date`, markDate, productMarkingText, hatchMarkText removed;
markPosType KEPT — chosen slot keeps the registered content), 19C QR schema editor,
19D manual part select + currentPartIndex/pen outputs + reset modes (Latched
default; there is NO falling-edge reset today despite the request).
**Rev. 4 (2026-10-08, PL):** qpb → track ONLY README/CHANGELOG/include (sources
untracked); mc_protocol (now a git repo: main `f157405` = tag v0.1.0 `1d09f6b` +
docs-only commit) → full clone in `components/mc_protocol/`, untracked except
include + consumer .pri; official release keeps 0.1.0 headers. MEASURED: git
silently ignores files inside a folder holding its own `.git` (`git add` rc 0,
adds nothing) → clone's git dir must live outside the folder. I proposed also
tracking LICENSE (MIT notice) for both — PL accepted (LICENSE tracked). Plan 19
committed `120f12e`. **19A implemented 2026-10-08 (T2–T6), uncommitted, bench
open:** qpb static lib `qmake/qpb/` (+`qpb_smoke_test` 5/5); mc_protocol clone with
git dir `.git/modules/mc_protocol` + `core.worktree` (setup in
build_and_verification.md "Vendored components"); `McProtocolDevice` = adapter
(`libraryConfig()` static, `::mc::` always — `vc::device::mc` clashes), old
codecs/transports deleted; `mc_protocol_test` rewritten 47/47 (MockPlc via injected
transport, `createLibraryDevice()` seam); runtime 60/60; oracles identical; .ts 673.
Found: library polls M as words on 1C too → adapter sets `bitsAsWords=false` for 1C;
jom ran `deploy` parallel to linkers → "Sharing violation" → `.depends = deploy`.
`.vscode/` (VS Code CMake ext saw qpb CMakeLists) — now in .gitignore (PL, 2026-10-09).
**3E bench 2026-10-08:** OK except reconnect FLAPS ~70-90 s after cable re-plug (connect
ok → no MC answer in 1 s → fault → connect timeout → PLC even closed a good link once).
PL CONFIRMED old code did not do this → regression; suspect = library faults 3E on 1st
timeout (old: 5 resends). Per "instrument first": added PLC-065 wire trace
(`mc_wire_trace.*`, TracingTransport wraps real transport, `[plc-trace]` in app log:
first 24 events after open live, last 64 dumped on fault/loss/failed open,
`NLM_PLC_TRACE=1` continuous) + all library log levels forwarded; library device now
rebuilt every connect. **Trace result (16:51-16:55):** after re-plug, 1st connection:
TCP ok, ONE TX (heartbeat M7050, identical to frames answered before), ZERO RX, fault at
timeout (1 s; PL tried 2 s — same), lib `abort()`s socket, then 2-3 TCP connects time out
(20-30 s). Old driver differed: 5 resends, `disconnectFromHost()` (FIN) not abort, no
KeepAlive/LowDelay. Recorded BL-141 + plc_link §6 + plan §9; report for the library team
published https://claude.ai/artifact/6YtDhksKasVuzp6FoKh4xk (private). 19A blocked on it.
**2026-10-09 lib 0.1.1 (`1610a06`) adopted, PL option A:** `MsgConfig.firstResponseTimeout`
(default 60000, TCP editor, 3E only, ≥responseTimeout), closeGraceMs 500, ONE McDevice kept
(rebuild only on transport-settings change; connect while opening/waiting/up ignored =
PLC-067), Connecting on open → Connected after 1st round, ConnectFailed before (PLC-066).
mc_protocol_test 51/51; new tests shown to fail with the fix off. Traps: QtTest slot
ending `_data` silently NOT run (suite said 50/50!) → check `-functions`; deploy.pro two
xcopy ran parallel → material depends on ezcad; one more transient external lock seen.
Notes from lib team: build/mc-protocol-notes.md.
**2026-10-09 3E re-plug bench with 0.1.1 PASSED (PL)** - BL-141 fixed (row deleted at 19A close).
**Committed `965c10e`** (new commit; `.vscode/` now in .gitignore; `main_window.cpp` license
bypass left uncommitted). Comments added in this change made ASCII-only ([[no-unicode-symbols-in-code]]).
Still open for 19A: 3C bench, on-demand read outside the window on hardware, ADR D14/D15
acceptance, BL-008/009 rows to delete, CHANGELOG, spec markers.
**19A CLOSED 2026-10-09, commit `07774eb`:** 3C bench passed but needed DTR with Hardware flow
control - PL patched the library clone LOCALLY (serial_transport.cpp completeOpen sets DTR; clone
shows ` M src/device/serial_transport.cpp`, do NOT revert it) and asks lib devs for an option ->
BL-142. ADR D14/D15 accepted; BL-008/009/020/025/141 deleted; spec markers dropped. On-demand
read on hardware moves to the 19B bench. **19B:** spec delta approved + committed `0eb0a5a`;
T8-T14 implemented by sub agents 2026-10-09 (2 review rounds, independent tester all green, new
tests/placeholders_tab_test), committed `a98c3f6`. PL bench item 1 passed 2026-10-13. NEW T14b
(PL): Commission test part in Laser tab shows PLC values of user placeholders; Test-Mark/write-back use
them. Implemented + reviewed + tester; tester found HIGH crash in a98c3f6 (placeholders tab dtor order,
Settings close could crash) - fixed, 0/40 crashes. T14b committed `e8feb00`.
**19B CLOSED 2026-10-13** (PL bench confirmed), close-out `60cfb11` (markers dropped, BL-094/095/103/127
added, CHANGELOG). Scratchpad cleaned with PL permission - kept build_*.bat, agent_rules.md,
mc_3e_reconnect_report.html. **19C:** spec delta `dc93ad5`; T16-T18 implemented 2026-10-13 (QR qpb
editor, test dialog without PLC, Write to PLC gate on all tabs), review+tester fixes incl. the DEBUG APP
startup crash (namespace-scope tr() static-init order; fixed with QT_TRANSLATE_NOOP) - committed
`7dcfce1`. **19C CLOSED 2026-10-13** (PL bench), close-out `1f645ce` (BL-128 manual). Scratchpad cleaned
again (PL permission). Next: 19D (manual part selection, runtime outputs incl. pen block, output reset
modes) starts with T19 spec delta. **2026-10-14: T19 delta written + PL approved (10 open points as
drafted), committed `cb33db3`; handoff file read + deleted. Delegation order: (a) T22 reset modes
DONE (reviewed, retested, uncommitted, plan section 12 records it; spec Verified-by updated), (b) T21
currentPartIndex/pen block/re-send DONE (2 review rounds, tester green, spec PART-056/070/071 amended +
Verified-by), (c) T20 manual selection DONE + T23 extra tests + final gate green (runtime 167, marking 97,
runtime_form 9 new project). All 19D code UNCOMMITTED, awaiting the PL's 19D bench (plan section 12 has
the record; spec Verified-by done; RUN-063/PART-056/070/071/RUN-057 amended; RUN section 6 items 5
resolved, 10 new). Open PL questions: JA 出力リセット shared by two labels; optional skip of the
re-prepare after a PLC-only return (RUN-018). Close-out: backlog manual-pages row (BL-129), CHANGELOG,
phase_status, plan close, markers dropped. T23 extra tests: resetOutput high at first poll / reconnect, mode-change commit
with a mask set. Close-out items: backlog row for manual pages (stale "Auto reset output" text), spec 6
note: input edges during a PLC-only outage dispatch on reconnect (pre-existing).** Plan section 12 has the record. Scratch: scratchpad/agent_rules.md = the brief
every sub agent reads (build/test commands + repo rules) - reuse it.
**2026-10-09 ASCII sweep** (PL, new commit `ac99a60`): 145 files to ASCII, Source encoding rule rewritten; Release+Debug
build clean (Debug: pre-existing LNK4098 MSVCRT on license-linked targets, vendor Rockey4ND_MD.lib);
all board-off tests + geometry 7/7 green. Debug deploy hit one more transient "Sharing violation"
(manual xcopy ok, rebuild ok) while the PL's release app was running.
**T1 (done, reviewed):**
`docs/spec/plc_link.md` draft delta (markers *(new)/(changed)/(removed)*,
PLC-061..064 new: config mapping + on-demand `readWords`/`wordsRead` exactly-once)
+ ADR D14/D15 drafts. Library facts: reads auto-split, writes NOT (adapter keeps
128-word chunks); `bitsAsWords` polls M as words on 3E/3C; heartbeat 1 on odd
rounds, restarts each link-up; Ethernet faults on 1st timeout; serial EOT +
`readRetries`/`maxConsecutiveLinkErrors`.

**(Superseded)** Phase 14 was the ONLY unfinished phase, still ❄ frozen; its couplings to
phases 15 and 16 are discharged (both manual trees current, `.ts` back to 0
unfinished), so thawing costs no rework.

**Gotchas:** the laser test needs NO EzCad2 GUI running (SDK spawns its own
`EzCad2.exe`; a stray one → `LMC1_ERR_EZCADRUN`). `temp_codebase/` and
`temp_ezd_api source/` are scaffolding the owner will delete; `components/` stays.
See [[working-arrangement]].
