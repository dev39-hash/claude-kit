---
name: phase-11-runs-on-dev-beside-phase-10
description: "Phase 11 (3rdparty -> build_packages, qpb replaces the Qt Solutions property browser, runtime-shell docking rewrite) is implemented on the dev machine while Phase 10 stays entirely on deploy; owner rulings 2026-10-04."
metadata:
  type: project
---

Owner rulings 2026-10-04: **Phase 10 belongs entirely to the deploy machine. Phase 11 is implemented on
the dev machine, and this agent is its PM and the project's main coordinator.** The plan of record is
`docs/plan/phase_11/` (README, charter, request, wp/). **Checkpoint 0 closed 2026-10-04**: the owner accepted the charter. Commits: `b5ce601b` (qpb 1.6.0
source, not built yet) and `b434033d` (docs), with annotated tag `phase11-cp0`. WP-02's dev half was **merged `e720726b`** on 2026-10-04 (report commit `c384924f`). Eigen tag 3.4.0 is commit `3147391d`; the headers are byte-identical to PCL's, with tree SHA-256
`6e6d604b…c2e6`. The deploy half is pending. **Lesson:** dev's global `core.autocrlf=true` turns every
third-party clone into CRLF. Clone into `C:\build_packages\_src` with `-c core.autocrlf=false`.
There is no `cmake` on PATH until `vcvars64.bat` runs; VS 18 bundles cmake 4.3.1 and Ninja. The owner's own scratch note `temp_docs/cratch.md` is
quoted verbatim in `request.md`; the owner will delete the scratch note.

Facts that are easy to get wrong:

- **ADS is Qt-linked.** Dev's `C:\build_packages\qtadvanceddocking-5.1.1` was built against Qt
  6.11.1/VS18; deploy runs Qt 6.8.3. Each machine therefore keeps its **own** ADS 5.1.1 build at the
  same path. The owner confirmed both build and run. Never ship dev's ADS DLL to deploy.
- **Eigen:** the repo's `3rdparty/eigen` is 5.0.0, but PCL 1.15.1 ships 3.4.0, and `build_packages`'s
  Coal 3.0.3 was built against PCL's 3.4.0. The owner chose 3.4.0, cloned into
  `C:\build_packages\eigen-3.4.0` (WP-02, both machines).
- **Paths:** one variable per package in `qmake/local_paths.pri`: `ADS_ROOT`, `EIGEN_INCLUDE_DIR`,
  `COAL_ROOT`, `BOOST_ROOT`, `ASSIMP_ROOT`. Never put `C:/build_packages` in a tracked file.
- **qpb** (`components/qpb`, 1.6.0, MIT, CMake-only, model/view): track it as source and compile it into
  `ncr_shared`. Its qmake glue lives **outside** the folder, because a qpb update replaces the whole
  folder. Migrating to it means rewriting 26 property-page files, not changing include paths.
- **The docking crash** happens on a project switch (the old layout is kept), a layout change, a dock
  drag and a dock move. There is no log or dump. The owner wants a full survey and rewrite of the
  runtime shell's docking. Unproven lead: `stopTaskRuntimes()` calls `deleteLater()` on docks with no
  `removeDockWidget()`, then `startProject()` lays out the new docks while the old ones are still
  inside the manager.

**Why:** both machines now write to one history. A Phase 11 edit inside Phase 10's footprint costs a
merge conflict on the deploy machine, which owns the production cell.

**How to apply:**

- Respect the boundary in charter §3. The highest-risk shared file is
  `tests/architecture_contract_test/main.cpp`: Phase 11 may only edit the two named tests there, and
  every new Phase 11 test goes into a new test project.
- Migrate the Basler and JAI camera pages only inside an owner-announced freeze window, during which
  the deploy machine does not edit them.
- Before issuing any work package, check its touch-list against the last deploy bundle.
- Numbering: DRs from DR-0101, backlog items from 201, branches `p11/wp-nn-slug`. Deploy continues
  DR-0016 and item 92.
- Tell the deploy machine all of this in the first bundle note after Checkpoint 0.

See [[shared-working-conventions-with-deploy]] and [[dev-deploy-sync-workflow]].

**WP-03 STOPPED 2026-10-04** (commit `7759f695`, branch `p11/wp-03-build-packages`, not merged; the
report is `docs/plan/phase_11/reports/WP-03_report.md`). The cause is
`src/model/robot_kinematic_picking_checker.cpp:236`, which calls `canonicalEulerAngles`, an API only
Eigen 5 has. It is the only Eigen-3.4 incompatibility in the product build (checked with `nmake /K`).
The contract test compiles the same file. Eigen 3.4's `eulerAngles` returns a different range, and
the code overwrites single axes, so swapping the call would change behaviour.

Today's build is consistent at Eigen 5.0.0: the retired Coal was built against
`third_party/eigen` (5.0.0), while the `build_packages` Coal was built on 3.4.0. **Resolved by charter
revision 1 (accepted 2026-10-04, commit `72905a80`):** option A, as WP-03a.

The dev machine was restored to its pre-WP-03 state: `main` checked out, the trees back in
`3rdparty/`, the stale DLLs back in `build\bin`.

Traps found on the way:

- Qt Creator locks `3rdparty/advance_docking` against a whole-folder move; move the subfolders one at
  a time.
- The "if not exist" DLL copies never replace changed DLLs. All four mesh-collision DLLs differ
  between the old trees and `build_packages`.
- The first file to include `local_paths.pri` (`opencv_dependency.pri`) shadows the environment for
  every variable read after it.
- Git Bash heredocs mangle a backslash at end of line inside Python strings; write scripts with the
  Write tool instead.

**Charter revision 1 (2026-10-04, owner rulings, quoted in request.md §5):**

- Replace `components/RobotKinematics` with the pre-release **0.1.0** that the owner placed in
  `reference_source/RobotKinematics`. Its CHANGELOG verifies Eigen 3.4.0, Coal 3.0.3, Boost 1.87.0
  and Assimp 6.0.5, so **Eigen stays 3.4.0**.
- **Stop tracking RobotKinematics source** (RobotKinematics only; qpb stays tracked). Each machine,
  the deploy machine included, clones it by hand into `components/RobotKinematics`. Git keeps only:
  - the repo's build glue (`qmake/robotkinematics_dependency.pri`, written in WP-03b);
  - the component's `CHANGELOG.md` and `README.md`, which record the version.
- Track A order is now **WP-03a → WP-03b → WP-03**:
  - **WP-03a** replaces `canonicalEulerAngles` with a header-only `canonicalZyx` helper, proven equal
    on a dense grid **while the build is still on Eigen 5**.
  - **WP-03b** handles the component swap and its glue (version check, DLL copy when different, mesh
    assets).
  - **WP-03** is re-scoped to ADS only.
- The 0.1.0 public API differs from the old copy only by additions. It ships no tests, tools or
  AGENTS.md, and its own qmake does no DLL or asset copy.
- Upstream `github.com/gstorm-b/RobotKinematics` has **no `v0.1.0` tag yet** (only `bundle_260930`).
- **The bundle that untracks the component deletes it from the deploy machine's disk.** The deploy
  machine must copy 0.1.0 into place right after applying that bundle.
- `nachi_mz04d_mesh_collision_simplified.json` (and the MZ07F equivalent) is **generated, by design
  not tracked** (the old component's .gitignore already ignored it). The owner ruled on 2026-10-04:
  generate it with the 0.1.0 component's own `tools/mesh_simplification` (Eigen-3.4-safe;
  `scripts\run_mesh_simplification_nachi_msvc.bat [voxel] [safety] [MZ04D|MZ07F]`), with **voxel 40
  and safety factor 0.4**, for both presets, **after WP-03b**, on every machine. The deploy machine is
  told in the WP-03b bundle note.
- The tool's `canonicalEulerZyx_rad` (main.cpp:226-237) is the same five-line formula as WP-03a's
  helper, using `std::hypot`. That is independent corroboration for WP-03a.

**Progress 2026-10-04 (evening):**

- **WP-03a merged `29706e4f`** after implementer → PM re-run → reviewer (ACCEPT). The record commit is
  `0fe8b295`, which also **issued WP-03b** and committed the not-yet-issued handoffs: WP-03 v2 (ADS
  only), WP-04, WP-05 and WP-09.
- `robot_pose_decomposition_test` is 5/0 on Eigen 5. After WP-03b (Eigen 3.4) expect 4 passed + 1
  skipped.
- Phase 10 flaky test `test_a_never_connected_plc_disconnected_on_purpose_is_not_retried`: 14/20
  failures on `fff149a8`, 15/20 on WP-03a, on an idle machine. It goes **unnumbered** into the next
  dev→deploy bundle note (README finding 6).
- The owner's RobotKinematics copy now has 14 STLs:
  - the MZ04 STLs are byte-identical to the git blobs;
  - the MZ07F STLs are CRLF copies of them (same geometry);
  - **`Centering_tool.stl` is missing** (its mesh entry is enabled), so WP-03b restores it from
    `fff149a8`.
- **While an implementer works in the shared tree:** park new PM docs in the scratchpad and never
  commit (HEAD is the implementer's branch).

**Owner rulings 2026-10-04 (late):**

- **"Hãy bỏ centering tool ra khi build preset cho MZ04D."** The simplification tool loads every mesh,
  even disabled ones, so `Centering_tool.stl` is still restored from `fff149a8`. Then `"enabled": false`
  is set on `centering_tool_mesh` in the local MZ04D mesh profile, as the component guide says, before
  the MZ04D run. `CoalMeshCollisionBackend` and the validator skip disabled meshes. This was sent to the
  running WP-03b implementer. **The WP-03b handoff and request.md still need the ruling written in
  after the implementer finishes.**
- **Worktree slots** `.wt/slot1..3` were created on 2026-10-04: `git worktree add --detach … main` at
  `0fe8b295`.
  - `.wt/` is ignored through `.git/info/exclude` only, so it is local.
  - `.wt/README.md` holds the rules and the slot register, and `.wt/prepare_slot.ps1` re-prepares a
    slot.
  - 3rdparty trees are shared by **junction**. RobotKinematics is **copied**, never junctioned, because
    git could write through the link.
  - `QMAKE_PROJECT_DEPTH=0` is verified: 1,500 absolute paths, all inside the slot.
  - Builds may run in parallel, suites may not. Release only; the C: drive has 28 GB free and a slot
    costs about 0.7 GB.
  - Remove a junction only with `cmd /c rmdir`.
  - Future handoffs name a slot in §9.

**WP-03b reviewed 2026-10-04 (late), ACCEPT, awaiting the owner's merge approval.** Branch
`p11/wp-03b-robotkinematics-0-1-0` = `0dd2e13c` (swap + glue), `7de2386f` (docs), `1d972fd4` (report),
by the Sonnet implementer. The PM reviewed directly, with no reviewer, and re-ran everything: suites
4+1 skip / 11 / 10 / contract 256+1 twice (only the finding-6 test).
- Precedence probe: the env is ignored in the product build, because `opencv_dependency.pri` includes
  `local_paths.pri` first; it works in the test projects. Folded into finding 3.
- The review text is parked at `scratchpad/pending_03b/WP-03b_review.md`; the merge-record script is
  `scratchpad/p11_merge03b.py` (dry-run OK; replace `MERGE_SHA`). It adds request.md §9 (the
  centering ruling, renumbering the last section to §10), "(ruling)" steps in the handoff, and README
  findings 8–10.
- `scratchpad/pending_wp/` holds stale copies that are already committed at `0fe8b295`; do not
  re-place them.
- Open owner questions: Debug links release Coal (finding 8); a glue warning for the centering flag
  (finding 9).

**2026-10-04 (night) — WP-03b merged `facdb886`, record `20bf89ee`; charter revision 2 + issue `a720d6b5`.**
- Owner rulings (request.md §10): Debug uses `coald` (new **WP-03c**); a refreshed RobotKinematics drop is
  still "0.1.0" but has **no centering tool and no STL** (14 STLs restored from `fff149a8` blobs; §9's
  `enabled:false` step is moot); start WP-03 v2, WP-04, WP-05 in parallel. ("Merge WP-03" was a typo for
  WP-03b — owner confirmed.)
- **Trap hit:** `git checkout main` from the WP-03b branch overwrote the ignored 0.1.0 files that share
  paths with old tracked ones, and the merge then deleted them (142 → 34 files). Remains are in
  `C:\build_packages\_retired\RobotKinematics-0.1.0-first-drop-remains\`. The PM re-provisioned the main
  tree from the refreshed drop and re-ran the tool at 40/0.4: MZ04D `a84e1428…` 9 114 B, 7 meshes; MZ07F
  `dd7cdc0d…`, byte-identical to before. The main tree shows `M` on the two tracked component files until
  WP-03c merges.
- Running Opus implementers: WP-03 `.wt/slot1` (removes its own junctions only), WP-04 slot2, WP-03c
  slot3, WP-05 `slot4` (new, no build). Merge order WP-03c → WP-03 → WP-04 → WP-05; resolve
  `common_deps.pri`, `README.md` and `build_and_verification.md` at merge. After WP-03 merges, the PM
  retires the main tree's real `3rdparty` trees.
- `prepare_slot.ps1` now resets the two tracked component files after copying.
- `git fetch origin` failed: "Repository not found" for `gstorm-b/computer-vision-app` — ask the owner
  before any push.
- **WP-05 done 2026-10-05** (slot4, `764910b0` map + `113eb32d` report), PM review **ACCEPT**; review
  parked at `scratchpad/pending_05/WP-05_review.md`, merge awaits owner. Docs-only, no conflict with
  other branches.
  - **For the next bundle note (unnumbered, Phase 10 rules):** the MC page's enum rows (`frameFormat`
    1/4, `dataBits` 5–8) show the wrong option and write the option index (`setValue(value.toInt())`
    on an enumTypeId row).
  - qpb in the tree is **1.6.1** (docs-only over 1.6.0); charter, WP-04 and `b5ce601b` say 1.6.0. The
    WP-04 implementer was told; fix the charter wording in the WP-04 merge record.
  - The WP-05 implementer spawned its own reviewer, against the no-reviewer rule. Say it explicitly in
    future handoffs.
- **WP-05 merged `9e92c454`** (record `288f9047`). Afterwards, the WP-05 implementer's own reviewer
  reported late. The PM confirmed 4 findings its ACCEPT had missed:
  - QS cell editors have a reset button (`QtIntEdit` and siblings);
  - `setKeyboardTracking(false)`, so typing does not commit per keystroke;
  - a D-1 data-bits edit makes the line run at 7 bits (`toQtDataBits` falls back to `Data7`), and
    Format 4 is unreachable;
  - the P8 pick position is `cv::Point2f`.

  **WP-05a** (map corrections, docs only) was issued `038a8163` in slot4, on **Sonnet**, the first
  package under the owner's Sonnet rule. Lesson: review a survey against the vendored widgets too, not
  only the pages that use them.
- **WP-04 done** (slot2: `c0723bfe` work, `a3fb3eae` report). PM review **ACCEPT**, parked at
  `scratchpad/pending_04/WP-04_review.md`.
  - The PM re-ran `property_browser_test`: 6/0.
  - Waits to merge after WP-03c and WP-03, because `common_deps.pri` is shared.
  - After those three merges, re-run all suites on `main`.
  - Fix the charter's qpb wording (1.6.1) in the WP-04 merge record.
- **WP-03c merged `0f8c8374`** (record `73bebf15`), PM review ACCEPT. Debug now links `coald` and
  deploys the debug DLLs, with a guard in the glue.
  - Before the merge, the main tree's two tracked component files had to be reset to `HEAD`; they were
    byte-equal to the branch.
  - Lesson for handoffs: run `tasklist` immediately before **each** suite run, because
    `vision_output_device_test` binds the fixed ports 25101/25102. For a missing-DLL negative check,
    take `build\bin` off the `PATH`.
- **2026-10-05: WP-03 v2 merged `91ed6308`, WP-04 `8e505daa`, WP-05a `aaa2a8cd`; record + WP-09 issue
  `de247331`.**
  - The main tree's 8 old `3rdparty` trees were moved to `C:\build_packages\_retired\ncr_3rdparty\`
    after removing the slot junctions with `cmd /c rmdir`.
  - `main` verified: fresh Release umbrella exit 0; all 5 suites at baseline (contract 257/0).
  - Track A's dev side is done; Checkpoint 1 needs the deploy machine (bundle when the owner says).
  - Track B waits on the CP2 rulings (WP-05 map).
  - Track C: **WP-09 running in slot1 on Sonnet.** After it: WP-10 (the docking DR) needs the owner
    at CP2, so the PM stops there and asks.
  - Owner-run: start both shells and check the ADS dock icons.
- **WP-09 merged `9ad9ac6b`** (record + WP-10 issue `fca18d3e`), PM review ACCEPT. The PM re-ran the
  probe: 32/0 in Release and in Debug.
  - Root cause: `stopTaskRuntimes()` calls `deleteLater()` without `removeDockWidget()`, which leaves
    ghosts; touching one crashes inside ADS.
  - Closing the shell with a floated dock crashes too.
  - A layout change alone is safe.
- **WP-10 is running (Sonnet, slot2):** it drafts DR-0101 as **Proposed**. It must not edit the
  `docs/decisions/README.md` index, because deploy appends DR-0016 there. The PM adds the row when the
  owner accepts.
- **After WP-10, every remaining package needs the owner:**
  - CP2: the map rulings, which unblock WP-06/07/08;
  - DR-0101, which unblocks WP-11.

  The PM stops there and asks.
- `QMAKE_PROJECT_DEPTH=0` works only as a qmake command-line argument, not as an environment variable.
- **WP-10 merged `64b70052`** (record `89a601c1`). DR-0101 is **Proposed**, with Q-1…Q-7 for the owner.
  **All slots are free.**
  - **Stopped:** every remaining package needs the owner (CP2: the map rulings plus DR-0101; WP-07's
    freeze window; CP1 needs a bundle to deploy).
  - **When DR-0101 is accepted:** add its row to the `docs/decisions/README.md` index, and tell the
    deploy side in the bundle note that DR-0101 is taken.
- **2026-10-06 architecture/pointer review** (owner asked "triển khai team"): 6 Sonnet agents, read-only.
  - Reports and the PM's README synthesis (Vietnamese) are in
    `build/architecture_review_2026-10-06/` (git-ignored).
  - **Dev-owned High findings, PM-verified:**
    - D1: the commissioning shell never deletes removed docks, and `onCloseProject` resets the project
      before the docks go; this is DR-0101's bug in `components/app`.
    - D2: no `catch` anywhere around matching, and unvalidated ROI leads to `std::terminate`.
    - D3: `ProjectRepository::load` ignores `fromJson`, and a bad binding strips patterns, after which
      Save deletes the images.
    - D4: the system log is unbounded, with an O(n²) re-render.
  - **Phase 10 proposals P1–P12:** runner "safe from any thread" is false; `unregisterDevice` does not
    disconnect; `getDeviceName` has an inverted ternary; Basler TL leak; god class; 72 dead files.
  - **Not yet acted on:** the dev fixes are outside the charter, so they await the owner's decision.
    The P-items go in the next bundle note.

- **2026-10-14: PHASE 10 PAUSED by the owner at Stage 2** (`docs/plan/phase_10/closeout.md`, tag
  `phase10-closeout`). The controller works but is hard to extend; a later phase restructures the
  controllers' abstraction.
  - The charter §3 boundary still holds until the owner rules otherwise in a new charter.
  - **Deploy fixed some of our findings:**
    - WP-32: the MC/device-page enum rows now write the value (our D-1 / finding 11);
    - WP-36: the WP-28 flaky test was fixed test-side, with residual backlog item 97;
    - WP-34: Stage 3 renumbered to WP-60..64;
    - the stale comment is gone;
    - DR-0016 adds `IDevice::deviceTerminateConnection()`.
  - **DR-0024 removes the robot-check widget from both vision-output pages**, so WP-06 must not port
    it. The WP-05 map needs re-checking against WP-32 and WP-38 before WP-06.
  - DR-0016..0031 are taken by Phase 10; DR-01xx stays Phase 11's.
  - WP-02 report hash command: deploy asks for `LC_ALL=C sort -z`, because locale changes the hash.
  - Expected suites at `c2849527`: contract 301/0 (299 functions), `mc_frame` 57, modbus 32,
    `vision_output` 14, `tcpip_client` 12, pose 4+1, `property_browser` 6, `runtime_docking` 32.
- **2026-10-14: dev verified `c2849527` with fresh Release builds.** All 8 suites match deploy's
  numbers (contract 301/0), and WP-28 passed 20/20. Docs commit `06fd8c53` marks README findings 6, 10
  and 11 as handled and fixes the WP-02 hash command (`LC_ALL=C`).
  - Script lesson: never write `findstr /c:"FAIL!"` under `EnableDelayedExpansion`; the `!` is eaten
    and `findstr` waits on stdin forever. Use `< nul` and avoid `!` in patterns.
  - Another project, `C:\DGB\Project\mc_protocol` (`mc_workbench_tests.exe`), sometimes runs on this
    machine. Wait for it before running timing suites, and never kill it.
  - **Pending owner decisions:** DR-0101 (Q-1..Q-6, recommended accept); charter revision 3 (WP-11
    runtime docking, WP-12 logging, WP-13 crash-proofing, WP-14 commissioning teardown, WP-15 small
    cleanup), with runtime-shell work first.
  - The owner proposed an integration branch held until the deploy bundle arrived. The bundle has
    arrived, so work can merge to `main` normally.
- **2026-10-14, later: the owner approved DR-0101 (Q-1..Q-6 as recommended) and charter revision 3**,
  and made code files ASCII-only (`design_rules.md` §16.2, backlog item 201, the first Phase 11 item;
  `guard-edit.js` enforces it).
  - Issuing commit `c43ee120`. Revision 3 adds track D (charter §2.5 findings D1..D8, D11), WP-12..15.
  - Wave 1 running: WP-11 (slot1, `p11/wp-11-docking-rewrite`), WP-12 (slot2, bounded logging),
    WP-13 (slot3, matcher input checks + exception boundary + fresh result image, load fails on bad
    JSON). Wave 2 (WP-14 commissioning-shell dock teardown, WP-15 Basler dialog wait + Pylon include out
    of header) after WP-11 merges.
  - Merge loop: PM checks the report, then `/review-wp` (code-reviewer, Opus), then merge.
  - Still owner-pending: CP2 property-map rulings (WP-05 wrapper, D-1..D-7) before WP-06..08; the
    WP-07 freeze window; DR-0101 Q-7 (debugger, LocalDumps) for the CP3 bench runs.
  - Next bundle note must also carry: WP-13's proposal on how the runtime reacts to
    `MatchResult::isError`, and the task-config half of review finding D3.
