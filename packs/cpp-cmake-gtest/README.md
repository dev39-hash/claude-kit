# Pack cpp-cmake-gtest

C++17 (or newer) libraries and applications built with CMake, tested with GoogleTest through
CTest, on MSVC, GCC or Clang. Derived from the `.claude` folders of two earlier CMake projects
(ECC rules adapted, project-written build tools). Install with
`node install.js --target <project> --packs cpp-cmake-gtest`.

## Contents

| Path | Installed as | What |
|---|---|---|
| `rules/cpp-coding-style.md` | `.claude/rules/cpp-cmake-gtest/` (path-scoped) | principles, files, language level, resources, errors, headers, smells |
| `rules/cpp-patterns.md` | same | ports and adapters, config value types, results, RAII owner, Rule of Zero/Five, views, angles |
| `rules/cpp-security.md` | same | boundary validation, memory safety, UB, untrusted data, sanitizers |
| `rules/cpp-testing.md` | same | GoogleTest/CTest layout, fixtures through a cache variable, tolerances, goldens, coverage |
| `rules/cpp-performance.md` | same | measure first, hot-path allocation rules, SIMD scalar twin |
| `rules/cpp-code-review.md` | same | memory-safety triggers, checklist, severity map |
| `rules/cmake-build-errors.md` | same (CMake files) | MSVC / GCC / Clang / CMake error table for the build-resolver |
| `skills/cpp-coding-standards/` | `.claude/skills/` | ECC C++ Core Guidelines digest (verbatim, ASCII) |
| `skills/cpp-testing/` | `.claude/skills/` | ECC GoogleTest/GoogleMock/CTest how-to (verbatim, ASCII) |
| `skills/cmake-build/` | `.claude/skills/` | build.js / wt-slot.js usage, slots, explicit options, triage |
| `skills/golden-tests/` | `.claude/skills/` | golden regression workflow, update flag, drift review |
| `agents/silent-failure-hunter.md` | `.claude/agents/` | read-only hunter for swallowed errors (sonnet) |
| `tools/build.js`, `tools/wt-slot.js`, `tools/kit-env.js` | `.claude/tools/cpp-cmake-gtest/` | configure/build/test wrapper; build-slot allocator |
| `hooks/settings.fragment.json` | merged into `.claude/settings.json` | read-only permissions for the tools |

## Config keys (`kit.config.json`)

```json
"build": {
  "isolation": "slots",
  "slots": { "dir": "build-wt", "count": 8, "staleHours": 3 },
  "leadBuildDir": "build",
  "warningsAsErrors": true,
  "toolchain": { "vsRoot": "", "cmakeExe": "", "ctestExe": "", "clangFormatExe": "", "clangTidyExe": "" }
},
"packConfig": {
  "cpp-cmake-gtest": {
    "generator": "",
    "architecture": "",
    "configureArgs": [],
    "defaultConfig": "Debug",
    "warningsAsErrorsOption": "",
    "asanOption": "",
    "testDataVar": "TEST_DATA_DIR",
    "goldenDir": "tests/golden",
    "updateGoldenFlag": "--update-golden",
    "suppressRegeneration": false
  }
}
```

`configureArgs` holds the standing `-D` options (dependency dirs, feature switches). It may
use `$env{NAME}` (an environment variable; `build.js` stops when it is unset) and
`${sourceDir}` (the project root with forward slashes), so moving the tree needs no config
edit: `"-DTEST_DATA_DIR=${sourceDir}/fixtures"`, `"-DOpenCV_DIR=$env{OpenCV_DIR}"`. A
toolchain path outside the tree may stay literal. `warningsAsErrorsOption` is the project's
CMake option name that `build.js` sets to ON when `build.warningsAsErrors` is true.

`suppressRegeneration: true` adds `-DCMAKE_SUPPRESS_REGENERATION=ON`. Use it with the Visual
Studio generator when many targets share one directory: on a first `--parallel` build every
project runs its own CMake re-check against the one shared `generate.stamp` and they race
(`Cannot restore timestamp ... Access is denied`, `MSB8066`; seen 2026-10-18 with 43 test
executables in `tests/unit`). With the option the build never re-runs CMake by itself;
`build.js build|all` makes up for it by reconfiguring when a CMake input is newer than the
cache or the set of source files changed (see below). A raw `cmake --build` does not.

## build.js behaviour worth knowing

- Logs every step to `<paths.scratch>/build-logs/<time>_<dir>_<config>_<step>.log` (outside the
  build dir, which may be emptied) and ends each step with duration, distinct warning and error
  lines, and for tests the ctest totals and skip count.
- `build` and `all` reconfigure when: no cache, a `-D`, `--fresh`, a CMake input newer than the
  cache, or a source file added or removed since the last configure (recorded in
  `<dir>/.kit-build-inputs.json`). `--no-reconfigure` turns that off.
- A cache written for another tree (moved project, copied build dir) stops every step with
  exit 2; `--fresh` empties the directory (only a build dir inside the project or a slot; the
  slot lock stays) and configures from scratch. Deleting only `CMakeCache.txt` is not enough
  after a move: MSBuild `*.lastbuildstate` keeps the old path (MSB8028).
- Children run with `MSBUILDDISABLENODEREUSE=1`: no idle MSBuild node outlives the run.
- The build summary counts compiled files; an up-to-date build says `NOTHING COMPILED (up to
  date: not compile evidence ...)`, so "no work to do" is never reported as a compile.
- `--slot <tag> --empty-slot` takes a slot without a cache (a true first build);
  `wt-slot.js reset <tag>` empties the slot a tag holds.

## What stays in the project layer

Naming convention, error strategy, mutation policy, public-header dependency allow-list,
tolerances, hot-path names and budgets, angle convention, vocabulary bans: all in
`.claude/project/rules.md`, which wins over every file here. The exact configure/build/test
lines and toolchain paths: `.claude/project/build-env.md`.

## Licences

The two ECC skills and the adapted rules derive from affaan-m/ECC (MIT, `LICENSE-ECC-MIT.txt`).
`build.js` and `wt-slot.js` are project-written (2026); the `controller-kernel` pack reuses them.
