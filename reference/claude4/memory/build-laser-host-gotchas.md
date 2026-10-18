---
name: build-laser-host-gotchas
description: "How to incrementally build/verify laser_host.exe (and the app) 32-bit, plus two vcvars scripting gotchas"
metadata:
  node_type: memory
  type: reference
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-08T06:56:07.714Z
---

**Since 2026-10-07 (phase 18, ADR D13) build the WHOLE tree from the root** — `laser_host/build` no longer exists as the place to build. Bat pattern (works, used for phase 18): `call vcvars x86` → `set PATH=C:\Qt\5.15.2\msvc2019\bin;C:\Qt\Tools\QtCreator\bin\jom;%PATH%` → `cd /d <repo>\build\cli\<cfg>` → `qmake <repo>\NichirinLaserMark.pro -spec win32-msvc "CONFIG+=<cfg>"` → `jom /nologo`. Everything (app, laser_host, tests, EzCad2 runtime) lands in `build\bin\<cfg>\`; run tests from there with `QT_QPA_PLATFORM=minimal`, deleting the old `-o` report first (a stale report once read as a pass). A change to `mark_ezd_controller.*` / `laser_host/` still means: both oracles, from `build\bin\release`.

**Gotcha 0 — after adding a subproject (`SUBDIRS`), run `jom qmake_all` first.** Subdir Makefiles are generated only "if not exist Makefile", so an existing `tests\Makefile` silently skips a new test (2026-10-08: `qpb_smoke_test` was simply not built). Per-subproject build: `cd build\cli\<cfg>\tests\<name>` + `jom`.

Toolchain on this machine: VS2019 **Community** vcvarsall at `C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvarsall.bat` (arg **x86**); Qt kit `C:\Qt\5.15.2\msvc2019\bin`; jom `C:\Qt\Tools\QtCreator\bin\jom\jom.exe`.

**Gotcha 1 — don't script vcvars with `&&` chaining.** `call vcvars x86 && set PATH=...;%PATH% && jom` fails ("cl is not recognized"): cmd pre-expands `%PATH%` for the whole line *before* vcvars runs, so the `set` clobbers the toolchain PATH. Fix: put the steps in a **.bat file** (line-by-line execution expands `%PATH%` after vcvars). Working pattern: bat that does `call vcvars x86` → `set PATH=Qt\bin;jom;%PATH%` → `cd /d laser_host\build` → `jom /nologo`.

**Gotcha 2 — the `'vswhere.exe' is not recognized` line from vcvarsall is benign** (internal probe on stderr); vcvars still prints "Environment initialized for: 'x86'" and `cl.exe` resolves (Hostx86\x86). Ignore it.

Verified-32-bit check without dumpbin: read PE header — offset 0x3C → PE offset, then +4 → machine word; `0x014C` = x86. laser_host built clean (jom exit 0, machine 0x014C).

**Gotcha 3 — a stale `laser_host.exe` (not just `EzCad2.exe`) holds the LMC board.** Any laser test/init in another process then fails fast with `rc=1` (`LMC1_ERR_EZCADRUN`) — init bails at the "EZCad already running" check *before* reaching the board/prompt code, so symptoms look unrelated. `run_all.ps1` kills leftover `EzCad2.exe` but a leftover `laser_host.exe` from an earlier run does the same thing. Before running any laser test manually: `Get-Process EzCad2,laser_host | Stop-Process -Force`.

Running the SDK tools manually: kill leftovers first (above), run the exe by full path, and capture QtTest results with `-o file,txt` (Qt sends qInfo/QtTest logs to **stderr**, which plain `>` redirection drops).

Related: [[project-status]], [[laser-init-realmode]].
