---
paths:
  - "**/*.pro"
  - "**/*.pri"
---
# qmake, moc, uic and MSVC build errors (pack cpp-qmake-qt)

> Error table for the `build-resolver` agent (read it explicitly when fixing a build); also
> loaded when a `.pro`/`.pri` is edited. From an earlier `qmake-msvc-build` skill and a Qt
> project's build resolver. Work from the FIRST error; one surgical fix at a time;
> never silence a diagnostic; stop after 3 attempts on the same error.

| Symptom | Real cause | Fix |
|---|---|---|
| `LNK1136: invalid or corrupt file` | an interrupted build left a 0-byte `.obj` that looks fresh | delete the 0-byte objects in the build dir (`find <build> -name '*.obj' -size 0`), rebuild |
| `LNK1104: cannot open file '...exe'` or `.lib` | the binary is running or locked, or a library path is wrong | a running app: stop and tell the human (never kill `processes.neverKill`); a lib: fix the local `.pri` variable |
| `LNK2019` / `LNK2001` unresolved `staticMetaObject` / vtable | a `Q_OBJECT` header missing from `HEADERS`, so moc did not run; or `Q_OBJECT` added without re-running qmake | add the header to the owning `.pri`; re-run qmake |
| `LNK2019` for a free function or method | source not listed in the module `.pri`, or a library missing from `LIBS` (Debug needs the `d` variant) | register the file in its module `.pri`; check the dependency `.pri` |
| `LNK2019 __imp__sprintf` and friends | a 32-bit third-party lib needs the legacy CRT | link `legacy_stdio_definitions.lib` in the owning `.pri` |
| `LNK2038` mismatch `_ITERATOR_DEBUG_LEVEL` / runtime library | a Release library linked into a Debug build (or the reverse) | use the matching variant (`d` suffix, `-gd-`) |
| `LNK4098` defaultlib conflicts (vendor lib) | pre-existing, benign on known targets | leave it; note it in the report |
| `C1083: cannot open include file` | include path not set: dependency `.pri` not included, local `.pri` variable wrong, include not module-qualified | fix the variable or include the dependency `.pri`; includes are module-qualified from the source root, no `..`, no `src/` prefix |
| `C2039` / `C2065` after a pull or a rename | stale moc output or Makefile | re-run qmake; delete the build dir's `moc_*.cpp` only if needed |
| `C2027 use of undefined type` | forward declaration where the full type is needed | add the module-qualified include |
| `C4819` / garbage errors on comments | non-ASCII byte in a source on a code-page machine; `/utf-8` missing | rewrite the line in ASCII (kit rule 03); ensure `msvc: QMAKE_CXXFLAGS += /utf-8` in the `.pro` |
| `C2664 cannot convert` | type mismatch | fix the types; never cast the problem away |
| uic: unknown promoted class / `setupUi` link error | promoted widget declared in a namespace; new `ui/` file not in the module `.pri` | promoted widgets at GLOBAL scope; register the file |
| a new `SUBDIRS` project is never built | subdir Makefiles are generated only "if not exist Makefile" | run `jom qmake_all` (or `nmake qmake_all`) once after adding a subproject |
| "Sharing violation" while linking | a parallel deploy/copy step raced the linker | make the deploy project a `.depends` of the linkers |
| `cl is not recognized` from a one-line script | `call vcvars && set PATH=...;%PATH% && jom` pre-expands `%PATH%` before vcvars runs | put the steps in a `.bat` file, run `cmd /c file.bat` |
| `'vswhere.exe' is not recognized` from vcvars | internal probe on stderr | benign; ignore |
| exit `0xC0000135` when running a test | a runtime DLL is not on PATH (not a crash) | put the deployed runtime on the minimal PATH (`qttest-headless`) |
| a worktree build writes into the main tree | qmake resolved paths through the main tree | pass `QMAKE_PROJECT_DEPTH=0` as a qmake ARGUMENT (an env var does nothing); set the project root variable to the worktree; check that no generated `Makefile*` names the main tree |
| stale `Makefile.*` keeps old include/lib paths | qmake not re-run | always re-run qmake before `nmake`/`jom` |
| app builds but the runtime/second shell is stale | only one `.pro` was built | build through the umbrella `.pro` (`packConfig.cpp-qmake-qt.umbrellaPro`) in one build dir |
| wrong bitness (SDK DLL is x86) | 64-bit vcvars or kit used | the project's arch (`packConfig...vcvarsArch`); verify with the PE machine word (`0x014C` = x86, `0x8664` = x64) |

Report format: `[FIXED] <file> - <error code> - <one-line cause>` per fix, then
`Build: <config> <dir> QMAKE_EXIT=<n> MAKE_EXIT=<n> - <n> fixed, <files> files touched` and the
exe machine word when bitness matters.
