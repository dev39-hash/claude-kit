---
name: qmake-msvc-build
description: Build ncr_picking (Qt 6, qmake, MSVC, nmake/jom on Windows) and diagnose build and link errors with minimal fixes. Use for every build, rebuild or failing build of the shells, the ncr_shared library or a test project, including in a .wt worktree slot. Covers the toolchain call, the umbrella build, MSVC/LNK error triage and the traps whose error text points at the wrong cause.
---

# Build ncr_picking with qmake + MSVC, and fix build errors minimally

`docs/rules/build_and_verification.md` is the source of truth for commands and build-directory policy.
This skill is the working procedure, plus the traps the doc does not spell out.

## 1. Toolchain

- One `cmd.exe` session: `call "<VS>\VC\Auxiliary\Build\vcvars64.bat"`, then `<Qt>\bin\qmake.exe`.
  Machine paths differ: dev uses VS 18 and Qt 6.11.1 (`C:\Qt\6.11.1\msvc2022_64`), deploy uses
  VS 2022 and Qt 6.8.3. Take the paths from the handoff or the machine, never hard-code them in a
  tracked file.
- Write `.bat` scripts with the Write tool, never with a Git Bash heredoc (a trailing `\` gets mangled).
  Under `setlocal EnableDelayedExpansion`, never put `!` inside a literal (`findstr /c:"FAIL!"` eats the
  `!` and waits on stdin forever); give `findstr` `< nul`.
- `cmake` and `dumpbin` are on `PATH` only after `vcvars64.bat`.
- Package paths come from the untracked `qmake/local_paths.pri` (template: `qmake/local_paths.pri.example`):
  `ADS_ROOT`, `EIGEN_INCLUDE_DIR`, `COAL_ROOT`, `BOOST_ROOT`, `ASSIMP_ROOT`, OpenCV, Pylon, eBUS. A
  missing one stops qmake with an error that names it — fix the `.pri` line, not the project file.

## 2. Build

- **Always re-run `qmake` before `nmake`/`jom`.** A stale `Makefile.*` keeps old include and library
  paths and lies instead of failing.
- Build both shells through the umbrella `ncr_picking_all.pro` in one build directory, never
  `ncr_picking.pro` alone (that leaves `ncr_runtime.exe` stale). `CONFIG+=release` or `CONFIG+=debug`;
  `CONFIG+=multicore` is opt-in parallel compilation.
- In a worktree slot: pass `QMAKE_PROJECT_DEPTH=0` **as a qmake argument** (an environment variable does
  nothing), set `NCR_PICKING_ROOT` to the slot, and check that no generated `Makefile*` names a path of
  the main tree.
- Use a fresh build directory when the handoff asks for a clean build; executables land in
  `build/bin/<config>` (fixed `DESTDIR`).
- Never launch or kill `ncr_picking.exe` or `ncr_runtime.exe`; a running shell locks its binary and makes
  the link fail with `LNK1104`.

## 3. When the build fails

Work from the **first** error in the log, not the last.

| Symptom | Real cause | Fix |
|---|---|---|
| `LNK1136: invalid or corrupt file` | an interrupted build left a 0-byte `.obj` that looks fresh | delete the 0-byte objects (`find <build> -name '*.obj' -size 0`) and rebuild |
| `LNK1104: cannot open file '...exe'` | the binary is running or locked | wait for the owner to close it; never kill it |
| `LNK2019`/`LNK2001` unresolved `staticMetaObject` / vtable | a `Q_OBJECT` header missing from `HEADERS`, so moc did not run | add the header to the right `.pri`, re-run qmake |
| `LNK2019` for a free function or method | source not listed in the module `.pri`, or a library missing from `LIBS` (Debug needs the `d` variant) | register the file in its module `.pri`; check the dependency `.pri` |
| `C1083: cannot open include file` | include path not set: a dependency `.pri` not included, or a `local_paths.pri` variable wrong | fix the variable or the include of the dependency `.pri` |
| `C2039`/`C2065` after a pull | stale moc output or Makefile | re-run qmake; delete the build dir's `moc_*.cpp` only if needed |
| exit `0xC0000135` when running a test | a runtime DLL is not found (not a crash) | put the deployed runtime on `PATH` (see `qttest-headless`) |
| `LNK2038` mismatch `_ITERATOR_DEBUG_LEVEL` / runtime library | a Release library linked into a Debug build | use the Debug library (`coald`, `-qt6d`, `*-gd-*`) |

**Rules for a fix:**

- **Surgical fixes only.** The smallest change that makes the build correct. Do not refactor, rename or
  "clean up" while fixing.
- **Never silence a diagnostic** with `#pragma warning(disable…)`, `/W0` or a removed check without
  the PM's approval.
- **Stop and report** if the same error persists after 3 attempts, if a fix produces more errors than
  it removes, or if the fix needs an architectural change or a file outside the handoff's touch-list.
- After a fix, rebuild from qmake and confirm no 0-byte `.obj` remains.

## 4. Report a build

For each fix: `[FIXED] <file> — <error code> — <one-line cause>`. Then one status line:
`Build: <config> <dir> QMAKE_EXIT=<n> NMAKE_EXIT=<n> — <errors fixed> fixed, <files> files touched`.
