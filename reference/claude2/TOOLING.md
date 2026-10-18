# Claude tooling in this project (local, not tracked by git)

Entry point: `.claude/CLAUDE.md` (role, hard rules, model policy, hooks). This file is the inventory.

History:

- 2026-10-14, first change (owner decision): the addyosmani "agent-skills" pack, its commands and four
  agents, and the QML skills were removed; a few ECC files were hand-copied and adapted. The owner
  later deleted the retired copies and the ui-ux-pro-max clone.
- 2026-10-14, second change (owner decision, after comparing with the image_matching project's
  `.claude`): `CLAUDE.md` added; the tracked `AGENT.md`/`AGENTS.md` files replaced by
  `docs/rules/contributor_guide.md` and module `README.md` files (repo commit `6d6ebd1a`); three
  project hooks written; `settings.local.json` cleaned; the `code-reviewer` agent (Opus) and the
  `/review-wp` command added.

| Kind | Name | Origin |
|---|---|---|
| agent | `wp-implementer` | project (work-package implementer, Sonnet) |
| agent | `wp-reviewer` | project (adversarial reviewer of plan artefacts, Sonnet) |
| agent | `code-reviewer` | project (pre-merge WP review of the whole diff, **Opus**) |
| agent | `cpp-reviewer` | ECC `agents/cpp-reviewer.md`, adapted to Qt/qmake/MSVC (Sonnet) |
| agent | `silent-failure-hunter` | ECC, adapted to C++/Qt/PLC/camera (Sonnet) |
| agent | `code-explorer` | ECC, unchanged |
| command | `/review-wp` | project: runs `code-reviewer` on Opus for one WP |
| skill | `change-impact` | ECC, adapted to work packages and touch-lists |
| skill | `cpp-coding-standards` | ECC, unchanged, plus an ncr_picking addendum that takes precedence |
| skill | `qmake-msvc-build` | project |
| skill | `qttest-headless` | project |
| skill | `qt-cpp-review`, `qt-cpp-docs` | Qt skill pack (kept) |
| rule | `rules/cpp-patterns.md`, `rules/cpp-security.md` | ECC `rules/cpp/*`, adapted; load for `.cpp`/`.h` |
| rule | `rules/ascii-only.md` | project (owner 2026-10-14, `design_rules.md` §16.2); code files and scripts; `guard-edit.js` enforces it |
| hook | `hooks/guard-bash.js` | project; PreToolUse Bash/PowerShell; see `CLAUDE.md` |
| hook | `hooks/guard-edit.js` | project; PreToolUse Edit/Write/MultiEdit/NotebookEdit |
| hook | `hooks/sync-memory.js` | adapted from image_matching; Stop; memory -> `pm-agent-memory/` |

Settings: `settings.json` holds the hooks only. `settings.local.json` holds a short list of read-only
permissions, and (owner, 2026-10-15) lets agents create, edit and run scripts in the session
scratchpad (`.bat`, `.ps1`, `.sh`, `.py`, `node`, `cmd /c`) without asking. The guard hooks still
check every command those scripts are started with. The previous 72-entry list (one-off commands, other machines' paths, and a `Bash(.*)`
entry, a regex-style pattern rather than the documented wildcard form, which at best allowed every command) was replaced on 2026-10-14.

Hook tests: `node .claude/hooks/test-guards.js` runs 87 commands and paths against both guards with
the expected allow/ask/deny (exit 0 when all pass). Add a case for every rule you add or change.

ECC: https://github.com/affaan-m/ECC, MIT licence (`ECC-LICENSE.txt`). Each copied file names its
source in a comment.

Not adopted, because they conflict with project rules:

- Conventional Commits and the PR flow;
- 80 % coverage and TDD-first mandates;
- GoogleTest and CMake rules;
- auto-format hooks (`format-cpp`: the repository has no `.clang-format`) and auto-invoked planners;
- every ECC hook; ECC `rules/common/*`.
