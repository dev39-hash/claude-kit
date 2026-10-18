# image_matching (Claude Code instructions, not part of the repo)

Reusable image-matching component library in pure OpenCV C++ (`namespace mtc`), extracted
from a shipped Qt robot-picking application. The original module lives, read-only, in
`reference_source/matching/`; the new library is built in `src/` and `include/mtc/`.

This file is `.claude/CLAUDE.md` on purpose: the repo tree must not contain `CLAUDE.md`,
`AGENTS.md` or design docs. `.claude/` is ignored by the machine's global gitignore.

## Read these first

- `.claude/rules/project.md` - constraints, naming, mutation/testing policy, repo and docs
  policy, git identity (always loaded; overrides everything under `.claude/rules/ecc/`)
- `.claude/rules/ecc/common/*` and `.claude/rules/ecc/cpp/*` - adapted ECC rules
  (`affaan-m/ecc`, MIT); `cpp/*` load only when touching C++/CMake files
- `reference_source/matching/README.md` - the original module contract (worker-thread and
  deep-copy invariants still apply to how hosts should use the matcher)
- `.claude/docs/adr/README.md` - architecture decisions (not tracked in git)

## Operating model

Claude is the project lead and delegates implementation and testing to the Sonnet
sub-agents in `.claude/agents/` (`cpp-implementer`, `cpp-tester`, `cpp-reviewer`,
`cpp-build-resolver`). Workers run on `model: "sonnet"`; reviews (`cpp-reviewer`, ad-hoc
plan/design reviews) run on `model: "opus"`; both rules apply at every depth.
Plan of record: `.claude/docs/plan/v0.1.0-plan.md` (milestones M0-M5, progress in section 9).

## Status (2026-10-13)

- M0 done and committed (2 commits): CMake skeleton, core types (version, logger,
  matching_types, ManagerResult, cpu_features), GoogleTest + consumer test, user docs.
  Next: M1 (core types, data model, reference harness goldens, FileStorage spike).
- 0.1.0 scope: two modes, edge-based (port) and correlation (`cv::matchTemplate`), plus
  two-phase OK/NG conditions with built-in clearance zones (polygon overlap check,
  edge-based only). No picking/gripper/robot vocabulary (ADR-0005 rev 2). Plan rev 3
  awaits the user's approval together with ADR-0003/0004/0005.
- Next: CMake skeleton + GoogleTest, then port in dependency order: `matching_types`,
  `edge_match_config`, `imatch_type_config`, `utils_block_max`, `match_pattern_layer`,
  `match_params`, `match_pattern_config`, `match_pattern`, `match_group`, `match_object`,
  `image_matcher`, and last a Qt-free `pattern_group_manager` (JSON without QJson, logging
  through an interface).
- Known reference bug to fix while porting: `MatchGroup::renamePattern` checks the name
  collision with inverted polarity (documented in `match_group.h`).
- While porting, rewrite non-ASCII characters in comments to ASCII (MSVC C4819).

## Build (once the CMake project exists)

```bash
cmake -S . -B build -DOpenCV_DIR="$BINPICK_OPENCV_DIR"
cmake --build build --config Debug
ctest --test-dir build -C Debug --output-on-failure
```

Host: Windows 11, Visual Studio 18 Community (MSVC 14.51). `cmake`, `clang-format`,
`clang-tidy` exist only inside the VS install dir, not on PATH. OpenCV 4.x prebuilt at
`%BINPICK_OPENCV_DIR%`.

## Workflow

1. Plan; ADR in `.claude/docs/adr/` for API/algorithm/schema changes
   (`architecture-decision-records` skill)
2. `tdd-workflow` skill or `/cpp-test`: failing test first (regression test from reference
   behavior when porting)
3. Implement; `/cpp-build` if the build breaks
4. `verification-loop` skill, then `/cpp-review` (`cpp-reviewer` agent)
5. Conventional commit as `dev28 <devgbit@gmail.com>`, no AI trailer

## Hooks (`.claude/settings.json`)

- `protect-reference.js` (PreToolUse) blocks edits under `reference_source/`
- `format-cpp.js` (PostToolUse) runs clang-format on edited C++ files when the tool is found
- `guard-delete.js` (PreToolUse Bash/PowerShell) blocks deletes under `reference_source/` or outside the project
- `sync-memory.js` (Stop) mirrors the global project memory into `.claude/memory/`

## Skills installed (`.claude/skills/`)

`cpp-coding-standards` (ECC, verbatim), `cpp-testing` (ECC, verbatim),
`architecture-decision-records` (ECC, path changed to `.claude/docs/adr/`),
`verification-loop` and `tdd-workflow` (ECC, rewritten for C++/CMake).
