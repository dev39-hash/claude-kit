---
name: build-gotchas-not-in-repo-docs
description: "Build/test failure modes learned on the deploy machine that docs/rules/build_and_verification.md does NOT document: 0-byte obj, app_logger swallowing test output, and a running app breaking two suites."
metadata:
  node_type: memory
  type: reference
  modified: 2026-09-21T01:00:00.000Z
---

From the deploy agent's `build-environment-actual` memory. Checked 2026-09-21 against
the dev repo: the `main.moc` trap, `NCR_JAI_TEST_IP` and `<exe> -functions` **are**
already in `docs/rules/build_and_verification.md`, so read the doc for those. These
three are not, and each one looks like something it is not:

- **Interrupted `nmake` leaves a 0-byte `.obj`.** nmake then skips it because the
  timestamp looks fresh, and the link dies with `LNK1136: invalid or corrupt file`.
  Delete the 0-byte object and rebuild; it is not a source error.
- **Test executables install `app_logger`, which swallows stdout** — qDebug, PASS and
  FAIL lines go nowhere visible from a redirected shell. Run with `-o results.txt,txt`
  to capture per-test verdicts. The exit code is the **failed-test count**, not a crash
  code.
- **A running `ncr_picking.exe` breaks two suites, and not visibly as environmental.**
  `architecture_contract_test::test_both_shells_take_the_same_instance_key` fails
  (`tryAcquire()` returns false) because the live app holds the single-instance guard,
  and `jai_camera_hardware_test` drops 21 passed → 3 passed / 18 skipped because a GigE
  camera accepts one control connection. Close the app before trusting a run — and
  **never kill it, the owner runs it.**

- **`architecture_contract_test.exe` will not even start from a bare shell.** It exits
  `-1073741515` (`0xC0000135`, STATUS_DLL_NOT_FOUND) before running a single test, and
  QTest writes no results file, so it reads like a crash rather than a missing DLL.
  It needs the deployed runtime set on `PATH`; `mc_frame_test` and `modbus_device_test`
  run without it. Measured on dev 2026-09-21 — prepend, in this order:
  `<Qt>\bin`, the OpenCV `bin`, `<Pylon>\Runtime\x64`,
  `C:\Program Files\Common Files\Pleora\eBUS SDK`,
  `3rdparty\advance_docking\bin` and `build\bin\release`
  (the last one carries the RobotKinematics DLLs the umbrella build deployed).

Also standing, and the reason a stale build lies rather than fails: **always re-run
`qmake` before `nmake`**, because an existing `build/<dir>/Makefile.*` can still name
last month's dependency versions.

**Why:** all three produce a failure whose text points at the wrong cause, so an agent
that trusts the message burns a cycle on the wrong fix.

**How to apply:** treat `docs/rules/build_and_verification.md` as the source of truth
for commands, and this note as the list of traps it omits. Build both shells through
the umbrella `ncr_picking_all.pro` in one directory — see
[[qt-creator-is-the-users-build-path]] and [[shared-working-conventions-with-deploy]].
**The two machines are on different toolchains — verified on dev 2026-09-21:**

| | dev (this machine) | deploy |
|---|---|---|
| Qt | 6.11.1 `C:/Qt/6.11.1/msvc2022_64` | 6.8.3 `C:\Qt\6.8.3\msvc2022_64` |
| MSVC | **Visual Studio 18 Community** | VS2022 Community |
| OpenCV | 4.14 at `C:/build_packages/opencv` | 4.14 at `C:/opencv/build` |
| Pylon | `PylonBase_v12` | `PylonBase_v10` |

Neither side's paths are in git; each machine's `qmake/local_paths.pri` (untracked)
supplies them, and on dev **no `OPENCV_*` / `PYLON_*` environment variable is set at
all** — the fallback file is doing all of it, which is the design. So never copy a
build command with paths in it between the machines, and expect a warning count to
differ across the two compilers rather than treating the delta as a regression.
