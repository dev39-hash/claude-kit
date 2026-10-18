---
name: kernel-verify
description: Run the verification pass for controller-kernel changes - configure, build with warnings as errors, ctest, optional Qt half build when qt/ is touched, the gate-check engine (ASCII, L2 purity, L4 timers, L9 literals, L10 blocking), clang-format check if a .clang-format exists, and a diff review against the twelve laws - then produce a PASS/FAIL report. Use after finishing a feature, a refactor or a fix, before declaring work done, and before committing.
metadata:
  origin: Adapted from ECC (affaan-m/ecc, MIT) verification-loop; rewritten for controller-kernel
---

# Kernel Verification Loop

Every phase says clearly when it was **skipped because a tool is missing**; a skipped phase
is not a PASS. Shortcut for phases 1-4: `node .claude/tools/build.js all` (and `--qt`);
the raw commands below are what it runs. Visual Studio's CMake is not on PATH:

```bash
CM="/c/Program Files/Microsoft Visual Studio/18/Community/Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin"
LLVM="/c/Program Files/Microsoft Visual Studio/18/Community/VC/Tools/Llvm/x64/bin"
```

Use `build/`, or a private slot from `node .claude/tools/wt-slot.js acquire <tag>` when
several agents build in parallel (release it afterwards).

## Phase 1: Configure

```bash
"$CM/cmake.exe" -S . -B build -G "Visual Studio 18 2026"
```

Omit `-G` if the generator name is rejected; CMake then picks the newest Visual Studio.
`CTRL_KERNEL_WARNINGS_AS_ERRORS` is ON by default (`/W4 /permissive- /utf-8 /WX`). On failure
stop and use the `cpp-build-resolver` agent.

## Phase 2: Build

```bash
"$CM/cmake.exe" --build build --config Debug
```

Zero errors and zero warnings. Record the counts.

## Phase 3: Tests

```bash
"$CM/ctest.exe" --test-dir build -C Debug --output-on-failure
```

Report total / failures. The suite is the single ctest entry `ctrl_kernel_test` (19 `KT_TEST`s
today: 18 scenarios plus the completeness sweep).

## Phase 4: Qt half (only when `qt/` or its CMake block changed)

```bash
"$CM/cmake.exe" -S . -B build-qt -DCTRL_KERNEL_BUILD_QT=ON -DCMAKE_PREFIX_PATH=C:/Qt/6.11.1/msvc2022_64
"$CM/cmake.exe" --build build-qt --config Debug
```

Builds `ctrl_shell_compile_check`, which includes every shell header. Otherwise report
"Qt: N/A (qt/ untouched)".

## Phase 5: Gate check

```bash
node .claude/tools/gate-check.js --all
```

Checks: ASCII only; L2 core purity (no Qt/device/clock includes in `include/ctrl_kernel/` or a
core); L4 no `QTimer` in a core; L9 numeric literals (warnings only); L10 no blocking waits
(`QEventLoop`, `BlockingQueuedConnection`, `wait(`). Errors fail the phase; L9 warnings are
listed and judged in Phase 7.

## Phase 6: Format (only if `.clang-format` exists)

```bash
"$LLVM/clang-format.exe" --dry-run --Werror <changed .h/.cpp files>
```

No `.clang-format` -> "Format: N/A". Tool missing -> "SKIPPED".

## Phase 7: Diff review against the twelve laws

Read the diff (`git diff` if under git, otherwise the touched files) against
`docs/controller_kernel.md` section 6:

- L1 only `step()` and const getters are public in a core; L2 no world access, no clock
- L3 every new request has one owner id in State and a stale-completion test
- L4 timers keyed with tokens; L5 handlers call nothing outside, effects ordered
- L6 no inline handling of a synchronous completion; L7 outputs only via `outputs()`
- L8 new Event/State cells decided or `Unspecified`, sweep sample added
- L9 no behavior constant in a handler (judge the Phase 5 warnings); L10 no blocking wait
- L11 batch order documented; L12 wire names, fault codes and display names unchanged

Also check: public symbols have Doxygen; no loose `bool m_xxx` outside a block; a new row
exists for every new rule; changes to a contract, law, block value set, `core_traits.h`,
public namespaces/CMake targets or a dependency have an ADR (skill
`architecture-decision-records`).

## Report

```
VERIFICATION REPORT
===================
Configure: [PASS/FAIL]
Build:     [PASS/FAIL] (X errors, Y warnings)
Tests:     [PASS/FAIL] (failures/total)
Qt half:   [PASS/FAIL/N/A]
Gates:     [PASS/FAIL] (E errors, W L9 warnings)
Format:    [PASS/FAIL/N/A/SKIPPED]
Laws:      [PASS/FAIL] (laws touched: Lx, Ly)
Diff:      [N files changed]

Overall:   [READY / NOT READY]

Issues to fix:
1. ...
```

For long sessions run Phases 1-3 after every logical step and the full loop at the end.
