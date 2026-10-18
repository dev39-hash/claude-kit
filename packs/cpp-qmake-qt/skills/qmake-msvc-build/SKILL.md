---
name: qmake-msvc-build
description: Build a Qt project with qmake and MSVC (nmake or jom) on Windows and diagnose build and link errors with minimal fixes - the vcvars toolchain call through a .bat file, qmake before every make, the umbrella .pro, worktree builds, the error table whose messages point at the wrong cause. Use for every build, rebuild or failing build of the application, a library or a test project.
argument-hint: <config> [target | umbrella] [--worktree <dir>]
---

# qmake + MSVC build (pack cpp-qmake-qt)

`.claude/project/build-env.md` is the source of truth for the machine's paths and commands;
`packConfig.cpp-qmake-qt` names the vcvars script and architecture, the Qt bin dir, jom, the
umbrella `.pro`, the build-dir pattern and the local `.pri`. This skill is the procedure and
the traps.

## 1. Toolchain

- One `cmd.exe` session per build: `call "<vcvars>" <arch>`, then `<Qt>\bin\qmake.exe`, then
  `jom` (or `nmake`). `cmake`, `dumpbin` and `cl` exist on PATH only after vcvars.
- **Never chain `call vcvars && set PATH=...;%PATH% && jom` on one line**: cmd pre-expands
  `%PATH%` for the whole line before vcvars runs, so the `set` clobbers the toolchain. Put the
  steps in a `.bat` file (line-by-line expansion) and run `cmd /c file.bat`.
- Write `.bat` files with the Write tool, never a Git Bash heredoc (a trailing `\` is
  mangled). Under `setlocal EnableDelayedExpansion` never put `!` inside a literal; give
  `findstr` `< nul`.
- The `'vswhere.exe' is not recognized` line from vcvars is benign.
- Bitness is the project's (`vcvarsArch`): a 32-bit SDK DLL means `x86` everywhere; verify an
  exe by its PE machine word (`0x014C` x86, `0x8664` x64) when it matters.
- Machine paths (packages, SDKs) come from the untracked local `.pri` (`localPri`, with a
  tracked `.example`); a missing variable stops qmake with an error naming it: fix the `.pri`
  line, never the project file.

## 2. Build

- **Always re-run qmake before nmake/jom.** A stale `Makefile.*` keeps old include and
  library paths and lies instead of failing.
- Build through the umbrella `.pro` (`umbrellaPro`) in one build directory
  (`buildDir`, e.g. `build\cli\<cfg>`), with `CONFIG+=release` or `CONFIG+=debug`; every exe
  lands in the fixed `DESTDIR` (`binDir`, e.g. `build\bin\<cfg>`). Building a single shell
  `.pro` leaves the other shell stale.
- After adding a `SUBDIRS` entry run `jom qmake_all` once (subdir Makefiles are generated only
  "if not exist Makefile"); per-subproject: `cd <build>\<sub>` + `jom`.
- In a worktree or slot: pass `QMAKE_PROJECT_DEPTH=0` as a qmake ARGUMENT (an environment
  variable does nothing), set the project-root variable to the worktree, and check that no
  generated `Makefile*` names a path of the main tree. Builds may run in parallel; test
  suites may not.
- A running application or runtime locks its binary (`LNK1104`): never launch or kill it
  (`processes.neverLaunch` / `neverKill`); stop and tell the human.
- The deploy/copy project must be a `.depends` of the linkers, or jom races it ("Sharing
  violation").
- After rebuilding a host or helper exe that the app copies post-link, confirm the timestamp
  of the DEPLOYED copy (the copy only runs when the app relinks).

## 3. When the build fails

Read `.claude/rules/cpp-qmake-qt/qmake-build-errors.md` and work from the FIRST error.
Surgical fixes only; never silence a diagnostic; never change a signature unless the error
forces it; stop after 3 attempts on the same error, when a fix adds errors, or when the fix
needs an architectural change or a file outside the touch list. After a fix: re-run qmake,
rebuild, confirm no 0-byte `.obj` remains.

## 4. Report

```text
[FIXED] <file> - <error code> - <one-line cause>
Build: <config> <dir> QMAKE_EXIT=<n> MAKE_EXIT=<n> - <n> fixed, <files> files touched
Exe machine: 0x014C (x86) | 0x8664 (x64)        (when bitness matters)
```

A green build is not a passing test: run the relevant suites (`qttest-headless`) or say they
were not run.

## 5. Setting up build-env.md for a qmake project

Record: vcvars path and arch, Qt bin, jom path, the umbrella `.pro`, build and bin dirs per
config, the `.bat` pattern that works, the local `.pri` variables, the minimal PATH for tests,
and each gotcha the first time it costs time.
