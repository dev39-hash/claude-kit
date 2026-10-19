---
name: cmake-build
description: How to configure, build and test a CMake / CTest project in this kit - the build.js and wt-slot.js tools, build slots for parallel agents, explicit options, warnings as errors, multi-config generators, tools that are not on PATH, and the first-error triage. Use whenever a task builds, when the build breaks, and when setting up build-env.md for a CMake project.
argument-hint: <configure | build | test | all> [--config] [--slot tag]
---

# CMake build (pack cpp-cmake-gtest)

## Commands

```bash
node .claude/tools/cpp-cmake-gtest/build.js all                      # leader's tree (build.leadBuildDir), default config
node .claude/tools/cpp-cmake-gtest/build.js all --config Release
node .claude/tools/cpp-cmake-gtest/build.js all --slot <task-tag>    # parallel agents: a build slot
node .claude/tools/cpp-cmake-gtest/build.js test --filter <Suite>    # one suite
node .claude/tools/cpp-cmake-gtest/build.js all -DFOO=ON             # any -D forces a reconfigure
node .claude/tools/cpp-cmake-gtest/build.js all --fresh              # empty the build dir first (moved tree, foreign cache)
node .claude/tools/cpp-cmake-gtest/build.js all --slot <tag> --empty-slot   # a true first build in a slot
node .claude/tools/cpp-cmake-gtest/wt-slot.js status|release <tag>|reset <tag>|touch <tag>|reclaim
```

`build.js` finds `cmake` / `ctest` through `build.toolchain.cmakeExe`, PATH, then the Visual
Studio installs; `packConfig.cpp-cmake-gtest` supplies the generator, architecture, standing
configure arguments and the warnings-as-errors option name. Configure arguments may say
`$env{NAME}` (taken from the environment at run time) and `${sourceDir}` (the project root);
use them for anything that names the tree or a per-machine directory, so a moved tree needs no
config edit; never a literal path in `CMakeLists.txt`. Every step writes a log under
`<paths.scratch>/build-logs/` and prints duration, warning and error counts (and the ctest
totals); `build` / `all` reconfigure by themselves when a CMake input is newer than the cache or
a source file was added or removed; a cache of another tree stops the run until `--fresh`.
Raw `cmake` / `ctest` lines are fine too; copy them from `project/build-env.md`, not from memory.

## Rules

- **Every option explicit on every configure** in a slot: a previous task may have left the
  opposite value (`BUILD_SHARED_LIBS`, sanitizer, SIMD) in the cache.
- **Warnings are errors** on every compiler the project ships (MSVC `/W4 /permissive- /WX`,
  GCC/Clang `-Wall -Wextra -Wpedantic -Wshadow -Werror`); never silence one.
- **Multi-config generators** (Visual Studio, Xcode): `--config` on build, `-C` on ctest;
  `CMAKE_BUILD_TYPE` is ignored.
- **Whole tree**: verification builds everything, not `--target x`; read the log for `error`
  and `warning` before trusting ctest.
- **Slots**: agents never create their own build directories. `build.js all --slot <tag>`
  acquires `build-wt/slotN` (count and stale age in `build.slots`); release it at the end
  (`--release-slot` or `wt-slot.js release <tag>`); `touch <tag>` on a task longer than the
  stale age. Tester and implementer of the same task use two tags. The leader's own tree is
  `build.leadBuildDir`; `build-*` is in `build.buildDirPatterns` and ignored by git.
- **Tests run alone**: nothing from `processes.busyBeforeTests` running; shape-check the total
  (`ctest -N`).
- **Dependencies** come from cache variables (`-D<Pkg>_DIR=$env{VAR}` in `configureArgs`, or a
  literal toolchain path outside the tree recorded in `build-env.md`); a new dependency,
  option or target needs an ADR.
- **Visual Studio generator, many targets in one directory**: a first `--parallel` build can
  race on the shared `generate.stamp` (`Cannot restore timestamp`, `MSB8066`); set
  `packConfig.cpp-cmake-gtest.suppressRegeneration: true` and let `build.js` decide when to
  reconfigure. After that a raw `cmake --build` never re-runs CMake: configure by hand after
  any CMake input change.
- **Sanitizers**: the project's option (`packConfig...asanOption`) builds the regression
  suite under ASan/UBSan at least once per release.

## When the build breaks

Spawn `build-resolver` (`/build`) with the exact command and the slot; it reads
`.claude/rules/cpp-cmake-gtest/cmake-build-errors.md` and fixes the first error only.
A 0-byte object after an interrupted MSVC build shows as LNK1136: delete it in the build
dir, rebuild.

## Setting up build-env.md for a CMake project

Record: the generator and architecture, the toolchain paths (VS root, cmake, clang-format,
clang-tidy), every `-D` the project needs with its source variable, the configurations
shipped, the shape-check command, the slot command, and each gotcha the first time it costs
time.
