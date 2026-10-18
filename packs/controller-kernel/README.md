# Pack controller-kernel

For projects that build controllers on the controller kernel: a pure decision core
`step(Event) -> Effects` over an explicit `State` of blocks, an effect executor, a thin Qt
shell, and the twelve laws L1-L12. The pack carries the portable "layer A" (the standard, the
four controller skills with their templates, the reviewer, the gate engine) and the repo-side
pieces that enforce it (path-scoped rules, the gate hook, the verification addendum). Install
with `node install.js --target <project> --packs cpp-cmake-gtest,controller-kernel` (the
kernel builds with CMake; the stack pack brings `build.js` and the build slots).

## Contents

| Path | Installed as | What |
|---|---|---|
| `rules/kernel-laws.md` | `.claude/rules/controller-kernel/` (path-scoped: `include/**`, `**/*_core/**`, `**/core/**`) | the L1-L12 checklist with the gate or test that checks each law; smells |
| `rules/qt-shell.md` | same (path-scoped: `qt/**`, `**/*shell*/**`, `**/adapter(s)/**`) | one thread, no re-entrancy, no blocking, timer service, output diff, adapters translate only |
| `rules/kernel-test-kit.md` | same (path-scoped: `tests/**`, `**/*_test.cpp`, `**/*_core/**`) | `KT_TEST` kit, what a row is, the standard test set (scenarios, invariants, sweep, stale probes, wire names), tester report lines |
| `skills/controller-kernel/` | `.claude/skills/` | the standard, condensed: terms, five contracts, block table, derived functions, laws, recipe, test kit, where code lives, smells |
| `skills/controller-design/` (+ `templates/`) | `.claude/skills/` | a new controller: 8-step recipe -> design doc (`design-doc.md`, `io-contract.md`, `scenario.md`) -> compilable code scaffold (`templates/code/*.tmpl`, placeholders `{{name}} {{Name}} {{ns}} {{NAME}}`) |
| `skills/controller-add-event/` | `.claude/skills/` | 12-step path for a new event, completion, timer key or command source |
| `skills/controller-add-block/` | `.claude/skills/` | block card first; reusable vs controller-local; invariants and tests |
| `skills/controller-change-rule/` | `.claude/skills/` | classify (Policy field / handler row / derived function), failing row first, when a decision is recorded |
| `skills/kernel-verify/` | `.claude/skills/` | addendum to the core `verification-loop`: Qt half, gate tool, laws diff review, extra report lines |
| `agents/controller-reviewer.md` | `.claude/agents/` | read-only reviewer (reviewer model): core reviewer contract plus the kernel checklist; use instead of `reviewer` for core, kernel, shell and design tasks |
| `commands/controller-review.md` | `.claude/commands/` | `/controller-review [scope]`: gate tool, then `controller-reviewer` |
| `tools/gate-check.js`, `tools/kit-env.js` | `.claude/tools/controller-kernel/` | the gate engine: CLI (`--all`, files, `--json`) and module |
| `hooks/kernel-gates.js` | `.claude/hooks/controller-kernel/` (PostToolUse `Edit\|Write\|MultiEdit`) | runs the gate engine on the edited file; errors block (exit 2), L9 warnings return as context; fails open |
| `hooks/test-kernel-gates.js` | same | `node .claude/hooks/controller-kernel/test-kernel-gates.js` |
| `hooks/settings.fragment.json` | merged into `.claude/settings.json` | wires the hook; read-only permissions for the gate tool and its test |

## Gates

| Gate | Severity | Where | Catches |
|---|---|---|---|
| `ASCII` | error | every file the kit's ASCII rule covers | a byte above 0x7F |
| `L2-purity` | error | pure core | Qt includes or types, clock, random, threads, mutex, filesystem, `getenv`, `fopen`, file streams |
| `L2-include` | error | pure core | an include that is not a standard header, a kernel header (`<kernelInclude>/...`) or a file of the own core directory; impure standard headers (`<thread>`, `<fstream>`, `<ctime>`, ...) |
| `L4-timer` | error | pure core | `QTimer`, `singleShot` |
| `L5-callout` | error | pure core | `emit`, `publish(` |
| `L10-blocking` | error | shell | `QEventLoop`, `BlockingQueuedConnection`, `.wait(`, `waitForFinished`, `processEvents` |
| `WARN-PRAGMA` | error | code and build files | `#pragma warning(disable`, `diagnostic ignored`, `/wd`, `-Wno-` |
| `L9-literal` | warning | pure core `.cpp` and non-policy headers | numeric literals other than 0 and 1 outside enum bodies, array sizes, preprocessor lines, `constexpr`, `static_assert` and `*Policy` structs |

"Pure core" is `include/<kernelInclude>/**` plus every directory whose name matches
`coreDirs`; "shell" is every directory matching `shellDirs`. Comments and string literals are
ignored. The scanner is a heuristic, not a compiler: the build and the tests decide.

## Config keys (`kit.config.json`)

```json
"packConfig": {
  "controller-kernel": {
    "kernelInclude": "ctrl_kernel",
    "coreDirs": ["core", "*_core"],
    "shellDirs": ["qt", "shell", "*_shell", "adapter", "adapters"],
    "policyFiles": ["*policy*"],
    "walkDirs": ["include", "examples", "qt", "tests", "src", "cmake"],
    "literalGate": "warning",
    "extraImpureHeaders": []
  }
}
```

`walkDirs` is what `--all` walks (plus top-level CMake files, `README.md` and `docs/`); add
every directory that holds a core. `literalGate: "off"` disables L9 for projects that keep
named constants in cores on purpose. The rule files' path globs are fixed; a project with
other directory names repeats the laws' paths in `.claude/project/rules.md`.

## Task classification rows (add to `.claude/project/task-classification.md`)

| Class | What qualifies | Tester RED | Implementer | Tester verify | Reviewer |
|---|---|---|---|---|---|
| `controller-design` | a new controller or a re-expressed one (`controller-design`) | no; the design doc is reviewed by `controller-reviewer` before any scaffold | yes, after the design is accepted; scaffold tests pass before content | required | `controller-reviewer`; ADR when the kernel's block set changes |
| `core-change` | event, block, rule or derived-function change in a core (`controller-add-event`, `controller-add-block`, `controller-change-rule`) | yes: the failing table row | yes | required (sweep, invariants, stale probes) | `controller-reviewer` |
| `kernel-contract` | a contract, a law, a kernel block's value set, the core traits header, a public target or a dependency | per `core-change` | yes | required | `controller-reviewer` plus an ADR before Gate 1 |

## Relationship to the core

The core `implementer` and `tester` do the work; the path-scoped rules and the skill the
Plan names carry the kernel-specific obligations (report lines, sweep, probes).
`controller-reviewer` replaces `reviewer` for the classes above; `kernel-verify` extends
`verification-loop`. Repo-documentation vocabulary (no `.claude`, agents or ids in tracked
docs) is the core rule `02-repo-hygiene.md` and, when installed, the `docs-spec-driven` gate;
this pack's gate does not duplicate it.

## Origin

Project-written (2026): the standard, the skills, the templates, the gate engine and the hook.
`kernel-verify` descends from the ECC `verification-loop` skill (MIT) through the core skill.
No third-party text is copied verbatim.
