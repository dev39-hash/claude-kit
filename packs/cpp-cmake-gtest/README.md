# Pack cpp-cmake-gtest

C++17 (or newer) libraries and applications built with CMake, tested with GoogleTest through
CTest, on MSVC, GCC or Clang. Derived from the image_matching project's `.claude` (ECC rules
adapted) and the controller-kernel build tools. Install with
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
    "updateGoldenFlag": "--update-golden"
  }
}
```

`configureArgs` holds the standing `-D` options (dependency dirs from environment variables,
feature switches); `warningsAsErrorsOption` is the project's CMake option name that
`build.js` sets to ON when `build.warningsAsErrors` is true.

## What stays in the project layer

Naming convention, error strategy, mutation policy, public-header dependency allow-list,
tolerances, hot-path names and budgets, angle convention, vocabulary bans: all in
`.claude/project/rules.md`, which wins over every file here. The exact configure/build/test
lines and toolchain paths: `.claude/project/build-env.md`.

## Licences

The two ECC skills and the adapted rules derive from affaan-m/ECC (MIT, `LICENSE-ECC-MIT.txt`).
`build.js` and `wt-slot.js` are project-written (controller-kernel, 2026).
