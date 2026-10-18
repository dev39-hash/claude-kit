# controller-kernel (Claude Code instructions, not part of the repo)

A C++17 kernel for controllers that coordinate several asynchronous devices for one external
master: a pure decision core `step(Event) -> Effects` over an explicit `State`, an effect
executor, and a thin Qt shell. It is the standard shape for every controller in the user's
projects; changing logic or adding an event must stay a table row plus a test.

This file is `.claude/CLAUDE.md` on purpose: the repo tree holds user documentation only and
`.claude/` is excluded by the machine's global gitignore.

## Read these first

- `.claude/rules/project.md` - constraints, repo/doc policy, git identity (always loaded)
- `.claude/rules/delegation.md` - lead/worker split and models (always loaded)
- `docs/controller_kernel.md` - contracts, blocks, laws L1-L12 (section 6), recipe
  (section 7), test kit (section 9), smells (section 12); condensed in the
  `controller-kernel` skill
- `docs/localization_example.md` - the worked example
- Path-scoped rules load by themselves: `kernel-laws.md` (kernel and `*_core/`),
  `qt-shell.md` (`qt/`), `ecc/cpp/*` (any C++ file and `tests/`)
- Open items: `.claude/docs/notes/kernel-gaps.md`; decisions: `.claude/docs/adr/`

## Skills

| Layer | Skill | Use for |
|---|---|---|
| A (portable, plugin later) | `controller-kernel` | the condensed standard: laws, blocks, recipe, smells |
| A | `controller-design` | a new controller: recipe -> design doc -> code scaffold |
| A | `controller-add-event` | a new event, input signal, completion or command source |
| A | `controller-add-block` | a new or extended state block |
| A | `controller-change-rule` | a changed rule, threshold or master-visible output |
| A | `controller-review` | `/controller-review`: opus review of the current change |
| B (this repo) | `delegate-change` | lead: classify a change, write briefs, run the pipeline |
| B | `tdd-workflow` | failing KT_TEST row first |
| B | `kernel-verify` | build + tests + gates + law review before commit |
| B | `architecture-decision-records` | contract/law/block/API changes |

Agents: `kernel-implementer`, `kernel-tester`, `cpp-build-resolver` (sonnet),
`controller-reviewer` (opus, layer A).

## Build (Windows host: MSVC via Visual Studio 18, Qt 6.11.1, node)

```bash
node .claude/tools/build.js all                 # configure if needed, build Debug, ctest
node .claude/tools/build.js all --qt            # the Qt half, in build-qt/
node .claude/tools/build.js all --slot <tag>    # parallel agents: a build-wt slot
node .claude/tools/gate-check.js --all          # ASCII, purity, timers, blocking, docs policy
```

`build.js` finds `cmake`/`ctest` inside the VS install; they are not on PATH.

## Hooks (`.claude/settings.json`)

Pre: `guard-delete.js` (deletes outside the project, `.git/`, `.claude/memory/`),
`commit-guard.js` (identity dev28, no AI trailer, no `--no-verify`, no force push),
`protect-tree.js` (no CLAUDE.md/AGENTS.md in the tree). Post: `kernel-gates.js` (gate errors
block, L9 warnings as context), `format-cpp.js` (only with a `.clang-format`). Stop:
`sync-memory.js`. Hooks give early feedback; the build and the tests are the source of truth.

## Status (2026-10-14)

Kernel, example core, Qt half and 19 tests build clean with MSVC 19.51 `/W4 /WX` and Qt 6.11;
repo docs cleaned to user-only; `.claude/` reviewed and fixed. Not a git repo yet: before the
first commit run `git init` and set the repo-local identity (commit-guard blocks otherwise).
Next: write the repo plan in `.claude/docs/plan/` from `kernel-gaps.md` (generic test
harness, sweep coverage check, L12 string tests, include rules as a CMake test, executor
harness, a second controller as proof).
