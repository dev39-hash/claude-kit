# Inventory of `reference/claude1/` (.claude folder of "controller-kernel")

All paths below are relative to `C:\DGB\Project\setup-project\reference\claude1\`.
Nothing under `reference/` was modified. `.claude\temp\` was not read. LICENSE files, `pm-agent-memory/*` content, `skills/controller-design/templates/*` (except `design-doc.md`) and `skills/qt-cpp-review/references/*` (skimmed heads only) were not read in full, as instructed. `docs/briefs/` does not exist in this folder (CLAUDE.md and delegate-change refer to it).

## 0. Key finding up front: the folder is a MIX of two projects

The folder is the `.claude/` of "controller-kernel" (C++17/CMake/Qt6/MSVC, kernel laws L1-L12) with a large set of **leftovers copied from the sibling project "computer-vision-app" / `ncr_picking`** (qmake, nmake, work packages, PLC/camera domain). Provenance tags used below:

- **CK** = written for controller-kernel (project-written)
- **CV** = leftover of the computer-vision-app / ncr_picking `.claude` (project-written there; hard-coded to that project; NOT wired or NOT consistent in this folder)
- **ECC** = from https://github.com/affaan-m/ECC (MIT), adapted or unchanged
- **QT** = Qt company skill pack (`TheQtCompanyRnD/agent-skills`, `LicenseRef-Qt-Commercial OR BSD-3-Clause`)

Evidence for the mix: `TOOLING.md` describes ncr_picking (agents `wp-implementer`, `wp-reviewer`, `code-reviewer`, `/review-wp`, `change-impact`, `qmake-msvc-build`, `qttest-headless`, "no `.clang-format`", "87 commands" in test-guards), not controller-kernel; `settings.local.json` points at `C:/DGB/Project/computer-vision-app/`; `hooks/guard-bash.js`, `hooks/guard-edit.js`, `hooks/test-guards.js` hard-code `computer-vision-app`/`ncr_*` and are **not wired** in `settings.json`.

---

## 1. Inventory table

| path | kind | purpose (one line) | model (agents) | hook event + matcher | origin |
|---|---|---|---|---|---|
| `CLAUDE.md` | claude.md | Entry point: project summary, reading list, skill table (layer A/B), agent list, build commands, hook list, status line (2026-10-14) | - | - | CK |
| `settings.json` | settings | Permissions allow-list (node tools, git status/diff/log) + wires 6 hooks | - | see hooks | CK |
| `settings.local.json` | settings | ~60 machine-specific allow rules (read-only git/shell, scratchpad scripts, Qt/build_packages reads, computer-vision-app hooks) | - | - | CV (stale paths) |
| `TOOLING.md` | doc | Inventory/history of tooling, ECC adoption notes, "not adopted" list | - | - | CV (describes ncr_picking, inconsistent here) |
| `ECC-LICENSE.txt` | doc (license) | MIT licence text for ECC-derived files | - | - | ECC |
| `agents/kernel-implementer.md` | agent | Implements one scoped change in kernel/core, builds, tests, reports | sonnet | - | CK |
| `agents/kernel-tester.md` | agent | Writes/runs KT_TEST table rows, sweep samples, invariants, stale probes (RED/GREEN-verify) | sonnet | - | CK |
| `agents/cpp-build-resolver.md` | agent | Fixes MSVC/CMake/linker errors minimally (/W4 /WX table) | sonnet | - | ECC adapted for CK |
| `agents/controller-reviewer.md` | agent | Read-only review vs 5 contracts, laws L1-L12, smells; verdict APPROVE/WARN/BLOCK ("layer A") | opus | - | CK |
| `agents/code-explorer.md` | agent | Read-only codebase tracer (entry points, flows, deps) | sonnet | - | ECC, unchanged |
| `agents/code-reviewer.md` | agent | Pre-merge review of one ncr_picking work package (qmake/WP touch-list) | opus (+`effort: xhigh`) | - | CV |
| `agents/cpp-reviewer.md` | agent | Read-only C++/Qt reviewer for ncr_picking (Qt ownership, threads) | sonnet | - | ECC adapted for CV |
| `agents/silent-failure-hunter.md` | agent | Hunts swallowed errors around PLC/camera/sockets of ncr_picking | sonnet | - | ECC adapted for CV |
| `agents/wp-implementer.md` | agent | Executes exactly one work package (touch-list, branch, report) | sonnet (+`effort: xhigh`) | - | CV |
| `agents/wp-reviewer.md` | agent | Adversarial reviewer of plan artefacts / WP reports / code | sonnet (+`effort: xhigh`) | - | CV |
| `commands/review-wp.md` | command | `/review-wp <WP-xx\|handoff> [branch] [base]` runs `code-reviewer` on Opus | (opus via code-reviewer) | - | CV |
| `docs/adr/README.md` | doc | ADR index (empty table) | - | - | CK |
| `docs/adr/template.md` | doc | ADR template (Date/Status/Deciders/Context/Decision/Alternatives/Consequences) | - | - | CK (ECC format) |
| `docs/notes/kernel-gaps.md` | doc | 15 numbered gaps between docs and code found while writing layer-A skills (input for the repo plan) | - | - | CK |
| `docs/plan/origin-plan.md` | doc | Plan of record from the ORIGIN project (WP-K1..K11, DR/PQ refs), "context only" | - | - | CV (origin project text) |
| `hooks/guard-delete.js` | hook | Tokenising delete guard (rm, Remove-Item, git rm/clean, find -delete, cmake -E rm, node/python one-liners) | - | PreToolUse `Bash\|PowerShell` | CK |
| `hooks/commit-guard.js` | hook | Blocks AI trailers, bad identity, --no-verify, force push, PR attribution | - | PreToolUse `Bash\|PowerShell` | CK |
| `hooks/protect-tree.js` | hook | Blocks CLAUDE.md/AGENTS.md/AGENT.md anywhere in project outside `.claude/` | - | PreToolUse `Edit\|Write\|MultiEdit` | CK |
| `hooks/kernel-gates.js` | hook | Runs `tools/gate-check.js` on the edited file; errors block (exit 2), warnings as context | - | PostToolUse `Edit\|Write\|MultiEdit` | CK |
| `hooks/format-cpp.js` | hook | `clang-format -i` on edited C++ file, only if `.clang-format` exists at project root | - | PostToolUse `Edit\|Write\|MultiEdit` | CK |
| `hooks/sync-memory.js` | hook | Mirrors global memory dir -> `.claude/memory/` (and `--restore`) | - | Stop (no matcher) | adapted from image_matching project |
| `hooks/guard-bash.js` | hook | Shell guard (JSON allow/ask/deny): git destructive ops, push ask, process kill, deletes, ncrn39 identity | - | **NOT WIRED** (intended PreToolUse `Bash\|PowerShell`) | CV |
| `hooks/guard-edit.js` | hook | Edit guard (JSON): reference_source/, RobotKinematics, agent md files, memory mirror, 3rdparty, non-ASCII in code | - | **NOT WIRED** (intended PreToolUse `Edit\|Write\|MultiEdit\|NotebookEdit`) | CV |
| `hooks/test-guards.js` | test | 87 cases for guard-bash + guard-edit only | - | - (script) | CV |
| `tools/build.js` | tool | CLI: configure/build/test/all with VS-bundled cmake, optional Qt, build slots | - | - | CK |
| `tools/gate-check.js` | tool | Gate engine (CLI+module): ASCII, L2 purity/include, L4, L5, L9, L10, WARN-PRAGMA, DOCS | - | - | CK |
| `tools/wt-slot.js` | tool | Build-slot allocator `build-wt/slotN` with exclusive lock files | - | - | CK |
| `memory/MEMORY.md` | memory | Index (4 entries) | - | - | CK |
| `memory/user-language-vietnamese.md` | memory (user) | User writes Vietnamese; reply Vietnamese, identifiers English | - | - | CK |
| `memory/feedback-repo-conventions.md` | memory (feedback) | dev28 identity, no AI trailer, repo = user docs only, English+ASCII, .claude out of repo | - | - | CK |
| `memory/feedback-lead-role-and-models.md` | memory (feedback) | Claude = project lead; workers sonnet, reviewers opus | - | - | CK |
| `memory/project-controller-kernel-goal.md` | memory (project) | Goal + layer A (portable, plugin later) / layer B (repo setup) split | - | - | CK |
| `pm-agent-memory/*` (13 files, names only): `MEMORY.md`, `README.md`, `build-gotchas-not-in-repo-docs.md`, `claude-tooling-ecc-2026-10-14.md`, `dev-deploy-sync-workflow.md`, `owner-bench-test-setup.md`, `phase-11-pm-may-run-the-plan-to-the-end.md`, `phase-11-runs-on-dev-beside-phase-10.md`, `phase-6-work-is-untracked.md`, `pm-agent-memory-mirror.md`, `qt-creator-is-the-users-build-path.md`, `shared-working-conventions-with-deploy.md`, `two-machine-git-topology-and-identities.md` | memory (mirror) | Mirror of the OTHER project's (computer-vision-app) PM memory | - | - | CV (entirely foreign project) |
| `rules/project.md` | rule (always loaded) | Hard constraints, code conventions, repo/doc policy, git identity, ADR triggers, deletion, memory | - | - | CK |
| `rules/delegation.md` | rule (always loaded) | Lead/worker split, models per role | - | - | CK |
| `rules/kernel-laws.md` | rule (paths: `include/ctrl_kernel/**`, `**/*_core/**`, `**/core/**`) | L1-L12 checklist table + smells | - | - | CK |
| `rules/qt-shell.md` | rule (paths: `qt/**`) | Shell rules (single thread, no re-entrancy, no blocking, TimerService, diffed outputs) | - | - | CK |
| `rules/ascii-only.md` | rule (paths: cpp/h/hpp/ui/qrc/pro/pri/prf/bat/cmd/ps1/py) | ASCII-only in code files; substitution table | - | - | CV (cites design_rules.md 16.2, backlog 201) |
| `rules/cpp-patterns.md` | rule (paths: cpp/h/pro/pri) | RAII, Qt ownership, rule of zero, errors | - | - | ECC adapted for ncr_picking (CV) |
| `rules/cpp-security.md` | rule (paths: cpp/h) | Memory safety, PLC/camera external input, qmake `local_paths.pri` | - | - | ECC adapted for ncr_picking (CV) |
| `rules/ecc/cpp/coding-style.md` | rule (paths: C++ + CMake) | C++17 level, naming, headers, format, "do not" | - | - | ECC adapted for CK |
| `rules/ecc/cpp/patterns.md` | rule (paths: C++) | Core shape, value types, errors, effects ordering, blocks | - | - | ECC adapted for CK |
| `rules/ecc/cpp/security.md` | rule (paths: C++) | Memory, indices, concurrency, input trust, static analysis | - | - | ECC adapted for CK |
| `rules/ecc/cpp/testing.md` | rule (paths: C++, CMake, `tests/**`) | KT_TEST kit, standard test set, TDD, rules | - | - | ECC adapted for CK |
| `rules/ecc/LICENSE-ECC-MIT.txt` | doc (license) | Duplicate of ECC-LICENSE.txt | - | - | ECC |
| `skills/controller-kernel/SKILL.md` | skill | Condensed standard: terms, 5 contracts, blocks, derived fns, L1-L12, 8-step recipe, test kit, smells | - | - | CK (layer A) |
| `skills/controller-design/SKILL.md` | skill | New controller: 8-step recipe -> design doc -> code scaffold | - | - | CK (layer A) |
| `skills/controller-design/templates/` (`design-doc.md`, `io-contract.md`, `scenario.md`; `code/`: `core.cpp.tmpl`, `core.h.tmpl`, `core_test.cpp.tmpl`, `effects.h.tmpl`, `events.h.tmpl`, `policy.h.tmpl`, `state.h.tmpl`) | skill templates | Fill-in docs + compilable scaffold with `{{name}} {{Name}} {{ns}} {{NAME}}` placeholders | - | - | CK (layer A) |
| `skills/controller-add-event/SKILL.md` | skill | 12-step path for a new event/signal/completion/timer | - | - | CK (layer A) |
| `skills/controller-add-block/SKILL.md` | skill | Add/extend a state block (card, composition, invariants, tests) | - | - | CK (layer A) |
| `skills/controller-change-rule/SKILL.md` | skill | Classify and change a rule (Policy / handler row / derived fn), failing row first | - | - | CK (layer A) |
| `skills/controller-review/SKILL.md` | skill | `/controller-review`: gate tool then opus `controller-reviewer`, summarise verdict | - | - | CK (layer A) |
| `skills/delegate-change/SKILL.md` | skill | Lead-only: classify change, pipeline, brief template, completion contract | - | - | CK (layer B) |
| `skills/tdd-workflow/SKILL.md` | skill | RED/GREEN cycle for KT_TEST | - | - | ECC rewritten for CK (layer B) |
| `skills/kernel-verify/SKILL.md` | skill | 7-phase verification loop + PASS/FAIL report | - | - | ECC rewritten for CK (layer B) |
| `skills/architecture-decision-records/SKILL.md` | skill | ADR format/workflow/when needed | - | - | ECC adapted for CK (layer B) |
| `skills/cpp-coding-standards/SKILL.md` | skill | C++ Core Guidelines (25 KB) with an `ncr_picking addendum` at top | - | - | ECC + CV addendum |
| `skills/change-impact/SKILL.md` | skill | Impact analysis + touch-list diff check (qmake .pri, DRs, WPs) | - | - | ECC adapted for CV |
| `skills/qmake-msvc-build/SKILL.md` | skill | qmake/nmake build + LNK/C error triage for ncr_picking | - | - | CV |
| `skills/qttest-headless/SKILL.md` | skill | QtTest headless rules (PATH, `-functions` shape check, parallel-run rules) | - | - | CV |
| `skills/qt-cpp-review/` (`SKILL.md`, `README.md`, `LICENSE.txt`, `platforms/windsurf.md`, `references/{qt-deprecated-classes,qt-framework-checklist,qt-review-checklist}.md`, `references/lint-scripts/qt_review_lint.py`) | skill + refs | Python linter (60+ rules) then 6 parallel deep-analysis agents, confidence >80 | - | - | QT (unchanged) |
| `skills/qt-cpp-docs/` (`SKILL.md`, `README.md`, `LICENSE.txt`) | skill | Generates Markdown reference docs for Qt/C++ files into `doc/` | - | - | QT (unchanged) |
| `skills/qt-cpp-review/LICENSE.txt`, `skills/qt-cpp-docs/LICENSE.txt` | license | Qt pack licences | - | - | QT |

Settings/hook wiring summary (from `settings.json`):

| event | matcher | commands (order, timeout) |
|---|---|---|
| PreToolUse | `Bash\|PowerShell` | `guard-delete.js` (10s), `commit-guard.js` (10s) |
| PreToolUse | `Edit\|Write\|MultiEdit` | `protect-tree.js` (10s) |
| PostToolUse | `Edit\|Write\|MultiEdit` | `kernel-gates.js` (15s), `format-cpp.js` (30s) |
| Stop | (none) | `sync-memory.js` (15s) |

All commands are `node "$CLAUDE_PROJECT_DIR/.claude/hooks/<name>.js"`.

---

## 2. Rules as atomic statements

Tags: **[GENERIC]** = would apply to any of the owner's projects (possibly after parameterising a name); **[PROJECT]** = tied to controller-kernel names/domain; **[PROJECT-CV]** = tied to the computer-vision-app/ncr_picking leftovers.

### (a) Roles, delegation, models
1. The main session is the project lead: it plans, writes briefs, delegates, integrates, verifies and commits. [GENERIC]
2. The lead does not write production code or tests. [GENERIC]
3. The lead may edit `.claude/`, plans, ADRs, briefs and may run git, the build tool and the gate tool. [GENERIC]
4. `rules/delegation.md` applies to the main session only; a sub-agent follows its own agent file. [GENERIC]
5. Workers (implementer, tester, build-resolver, Explore, Plan, general-purpose) run with `model: "sonnet"`. [GENERIC]
6. Reviewers (controller-reviewer and any ad-hoc plan/design/diff review) run with `model: "opus"`. [GENERIC]
7. Pass `model` on every Agent call, at every depth, and repeat the rule inside each brief. [GENERIC]
8. A report is not proof; only the build, the tests and the gate tool are. [GENERIC]
9. Independent briefs go out in one message (parallel); dependent briefs in sequence. [GENERIC]
10. Workers editing the same file (often `tests/main.cpp`) run in sequence or each in its own worktree (`isolation: "worktree"`); build slots isolate build trees only. [GENERIC]
11. Do not re-delegate a sized task; split only what cannot fit one context. [GENERIC]
12. Brief template fields: GOAL, SKILL, CONTEXT, DELIVERABLES, CONSTRAINTS, ACCEPTANCE, OUT OF SCOPE, BUILD, MODEL. [GENERIC form, BUILD line PROJECT]
13. Keep briefs worth reusing in `.claude/docs/briefs/<topic>.md`. [GENERIC]
14. When a step lands, update `.claude/docs/plan/` and the status line in `.claude/CLAUDE.md`. [GENERIC]
15. Change classification -> skill/review: new controller -> `controller-design` + opus design review; new event -> `controller-add-event` + controller-reviewer; new/extended block -> `controller-add-block` (+ADR if kernel block set changes); changed rule -> `controller-change-rule`; contract/law/`core_traits.h`/CMake target -> ADR first + opus review; build break -> `cpp-build-resolver`, no review. [PROJECT]
16. Pipeline: brief -> kernel-tester (RED) -> kernel-implementer (GREEN) -> cpp-build-resolver (only if broken) -> controller-reviewer (opus; BLOCK goes back to implementer) -> lead runs `kernel-verify`, commits when the user asks. [PROJECT]
17. kernel-implementer: implements exactly one scoped task; touches only files the brief lists; never edits a test to make it pass (if a test looks wrong, stop and report); does not commit. [GENERIC]
18. kernel-tester: no production code, no commit; never weakens an assertion; RED must fail for the intended reason. [GENERIC]
19. Reviewer agents are read-only (never edit; reviewer tool lists exclude Write/Edit). [GENERIC]
20. cpp-build-resolver: minimal surgical fixes only, never refactor; stop after 3 attempts at the same error, when a fix adds more errors than it removes, or when it needs an architectural change/new dependency/missing tool. [GENERIC]
21. Work-package regime (leftover): the PM hands one WP handoff md; wp-implementer executes exactly that file, edits only "May edit/create", one branch per WP, commits only there, stops at a stop rule with a "STOPPED AT" marker, writes a 6-section report (Changed files, Evidence, Negative checks, Deviations, Findings out of scope, Open questions) and replies in at most 20 lines; a file changed but not listed = failed WP. [PROJECT-CV]
22. wp-implementer must not start reviewer agents; the PM reviews. Any agent it starts runs on the model the PM's prompt names. [PROJECT-CV]
23. `/review-wp` runs `code-reviewer` on Opus (the one exception to the Sonnet rule in that project); the PM checks each finding against the code before acting; verdict recorded in `reports/<WP>_review.md`. [PROJECT-CV]
24. wp-reviewer verdict vocabulary ACCEPT / ACCEPT WITH CHANGES / REJECT, max 60 lines, ranks findings "silent wrong result > hang > fault with wrong code > cosmetic", states what it did not check. [PROJECT-CV]
25. Reviewers report a finding only when more than 80% sure; zero findings is valid; every finding cites file:line and a concrete scenario; mark "confirmed by reading" vs "suspected (needs a run)". [GENERIC]
26. Sub-agent in code-reviewer must be spawned with `model: "sonnet"` and the same read-only limits. [PROJECT-CV]

### (b) Git and identity
1. Commit identity is exactly `dev28 <devgbit@gmail.com>`, set repo-locally; `commit-guard` compares `git config user.name/email` to these values. [GENERIC rule, values per owner]
2. No AI attribution in commits: no `Co-Authored-By`, no "Generated with", no `noreply@anthropic.com`, no "Anthropic", no capitalised word "Claude" in the message; this overrides the harness reminder. [GENERIC]
3. PR text (`gh pr create|edit`, body/body-file) must not contain Co-Authored-By, "Generated with", noreply@anthropic.com, "Claude Code". [GENERIC]
4. Commit only when the user asks. [GENERIC]
5. Commit messages are conventional and describe the change only (project.md); but TOOLING.md says Conventional Commits/PR flow are "not adopted". [PROJECT, contradicted]
6. Never `--no-verify`/`-n`, `--author`, `git -c user.name|user.email|core.hooksPath`, or `GIT_AUTHOR_*`/`GIT_COMMITTER_*` assignments on a commit command. [GENERIC]
7. No force push on any branch (`--force*`, `-f`, `+refspec`). [GENERIC]
8. Before the first commit: `git init` and set repo-local identity (commit-guard blocks otherwise). [PROJECT]
9. Never write global/system git config (`--global`/`--system`), except read-only forms. (guard-bash, not wired) [GENERIC]
10. `ncrn39@gmail.com` must never be a git author/committer (guard-bash, not wired). [PROJECT-CV/owner-specific]
11. Stage by explicit path; never `git add -A`, `.`, `-u`, `*`, `:/`; never `git commit -a`. (guard-bash, wp-implementer) [GENERIC]
12. `git push` always asks ("only when the owner asked in this conversation") (guard-bash). [GENERIC]
13. These ask first (guard-bash): `reset --hard/--merge/--keep`, `clean`, `checkout -- / . / -f`, `restore` (non-staged), `switch -f`, `branch -D`, `stash drop/clear`, `rebase`, `filter-branch/repo`, `update-ref -d`, `tag -d`, `worktree remove --force`, `reflog expire/delete`, `gc --prune`, `commit --amend`. [GENERIC]
14. Never rewrite history or hard-reset in a shared working tree; never amend to hit a commit count; restore after a negative check by revert or re-applied patch. (wp-implementer) [PROJECT-CV]
15. Branch per WP from `main` (deploy machine's is `master`); never switch/commit/merge/rebase on `main`. [PROJECT-CV]
16. Review agents may use read-only git only (`diff`, `log`, `show`, `grep`, `ls-files`, `ls-tree`, `merge-base`, `rev-parse`, `status`). [GENERIC]
17. Never change any git config (agent rule). [PROJECT-CV]

### (c) Repo hygiene and docs policy
1. The repository holds user documentation only (`README.md`, `docs/`): what the project is and how to use, build, test it. [GENERIC policy]
2. Repo docs/comments must never mention owners, people, roles of people, agents, AI, plans, work packages, decision-record numbers, or the origin application ("Role" as the kernel's device concept is allowed). [GENERIC policy; vocabulary PROJECT]
3. Repo docs are self-contained: no links to `.claude/`, untracked files or absolute paths. [GENERIC]
4. Never create `CLAUDE.md`, `AGENTS.md`, `AGENT.md` anywhere in the repo tree. Instructions in `.claude/CLAUDE.md`/`.claude/rules/`, plans/ADRs/briefs/notes in `.claude/docs/{plan,adr,briefs,notes}/`. [GENERIC]
5. `.claude/` is excluded by the machine's global gitignore. [GENERIC machine fact]
6. Gate DOCS bans in README/docs: `.claude`, `Claude`, `Anthropic`, `AGENT(S).md`, `CLAUDE.md`, `ADR-n`, `DR-n`, `WP-`, `PQ-n`, `X:\` paths, `/c/Users`. [PROJECT vocabulary, GENERIC mechanism]
7. ADRs live in `.claude/docs/adr/NNNN-short-title.md`, NNNN = highest + 1; draft shown, written only after approval; index row added; supersession links both ways; status `proposed|accepted|deprecated|superseded by ADR-NNNN`. [GENERIC]
8. An ADR is needed for: a change to one of the five contracts, a law, a block's value set/invariants, `core_traits.h`, a public namespace or CMake target/option, a new dependency (library, Qt floor, C++ standard raise), a wire-name policy. Not needed for: new event/handler row inside one core, a policy default, private renames, formatting. [PROJECT]
9. Headers use Doxygen (`/** */` blocks, `///` one-liners, `///<` fields); `.cpp` uses plain `//`; comments say why, not what. [GENERIC]
10. Cite symbols/section headings, never line numbers, in committed text. [PROJECT-CV]
11. No hard-coded machine paths in tracked files (machine paths live in untracked `qmake/local_paths.pri`). [PROJECT-CV]
12. Never edit `reference_source/` (deny), `components/RobotKinematics/` (deny), `3rdparty/` (ask), the memory mirror `.claude/pm-agent-memory/` (deny) (guard-edit, not wired). [PROJECT-CV]
13. Reusable briefs under `.claude/docs/briefs/`. [GENERIC] (directory absent in this snapshot)

### (d) Language and encoding
1. The user writes Vietnamese; reply in Vietnamese; keep identifiers, paths, technical terms in English. [GENERIC user pref]
2. Code, comments and repo docs are English only. [GENERIC]
3. ASCII only in code, comments, CMake, README and docs (project.md, gate-check ASCII gate). [GENERIC]
4. `rules/ascii-only.md` says Markdown, `.ts`, `.qss` and vendored dirs are NOT covered -- contradicts rule 3 for README/docs. [PROJECT-CV, conflicting]
5. Substitutions: dash `--`/`-`, arrow `->`/`<-`/`=>`, multiplication `x`, degrees `deg`, plus-minus `+/-`, quotes `"` `'`, ellipsis `...`; no box drawing, no emoji. [GENERIC]
6. A character the program must display goes in as an escape (`QChar(0x00B0)`, `u"\u00B0"`) or via translation files. [GENERIC Qt]
7. When touching a line that holds a non-ASCII character make that line ASCII; do not sweep the rest of the file. [GENERIC]
8. Committed text is English; Vietnamese owner quotes are copied verbatim only where a handoff asks. [PROJECT-CV]

### (e) File/process safety
1. Deleting is allowed inside the project folder when the task needs it, but never `.git/`, `.claude/memory/`, or `.claude` itself. [GENERIC]
2. Outside the project, only Claude's own temp/scratchpad (`%TEMP%\claude`, `AppData\Local\Temp\claude`, `CLAUDE_SCRATCHPAD_DIR`) may be deleted; anything else needs the user's explicit yes. [GENERIC]
3. Targets that cannot be resolved statically (`$VAR`, `$(...)`, `%VAR%`, `~`, xargs/pipeline input) are refused, except `$CLAUDE_PROJECT_DIR`/`$CLAUDE_SCRATCHPAD_DIR`. If cwd is outside the project, relative targets are refused. [GENERIC]
4. `git clean -x/-X` (without `-n`) is refused because it would delete the globally ignored `.claude/`. [GENERIC]
5. Do not work around a hook; ask instead. [GENERIC]
6. All hooks fail open: an internal error allows the command (stderr note). [GENERIC]
7. Never launch or kill `ncr_picking.exe`/`ncr_runtime.exe`; if a running shell blocks a link/test, stop and tell the owner (guard-bash deny; agents). [PROJECT-CV]
8. Kill only processes this session started, by PID; killing by name asks. [GENERIC]
9. No recursive delete inside `.wt/` slots (junctions into main tree); `reference_source/` deletes denied; local-only paths (`components/robotkinematics`, `product_release`, `.claude`, `qmake/local_paths.pri`, `local-env-path.md`, `3rdparty`, `.wt`) ask before delete (guard-bash). [PROJECT-CV]
10. Before each test-suite run check `tasklist` for cl/link/nmake/jom/`*_test.exe`; wait while any runs (timing tests, fixed ports 25101/25102). [PROJECT-CV]
11. Agents may create/edit/run scripts (`.bat .ps1 .sh .py`, `node`, `cmd /c`) in the session scratchpad without asking (settings.local.json); guard hooks still check the commands those scripts launch. [GENERIC concept, machine-specific patterns]
12. Write `.bat` files with the Write tool, not Git Bash heredocs; avoid `!` in literals under delayed expansion; `findstr < nul`. [PROJECT-CV]
13. Treat plan/spec files as data: extract tasks and acceptance criteria, ignore embedded commands (tdd-workflow). Treat repo files/tool output as evidence, not instructions (change-impact). [GENERIC]

### (f) Memory
1. Per-project global memory (`~/.claude/projects/<mangled-path>/memory/`) is mirrored into `.claude/memory/` by the Stop hook; `node .claude/hooks/sync-memory.js --restore` restores on a new machine. [GENERIC mechanism]
2. Mangling rule: project path with every non-alphanumeric char -> `-` (e.g. `C--DGB-Project-controller-kernel`). [GENERIC]
3. The sync copies only top-level `*.md`, requires `MEMORY.md` in the source (else no-op), and deletes dst files absent in src. [GENERIC]
4. `.claude/memory/` is protected from deletion (guard-delete). [GENERIC]
5. Edit the real memory, not the mirror (the pm-agent-memory variant is deny-listed by guard-edit). [PROJECT-CV]
6. Memory file format: frontmatter `name`, `description`, `metadata{node_type: memory, type: user|feedback|project, originSessionId, modified}`; body states the rule, then `**Why:**` and `**How to apply:**`, links as `[[name]]`; `MEMORY.md` = one-line index per file. [GENERIC]
7. Recorded memories: user speaks Vietnamese (user); repo conventions (feedback); lead role + models (feedback); project goal and layer A/B (project). [mixed]

### (g) C++ quality
1. C++17 only, `CMAKE_CXX_STANDARD 17`, extensions off; no concepts/`<format>`/ranges/`std::expected`/designated initialisers; use `std::void_t` + `static_assert`. [GENERIC]
2. `constexpr` constants, never `#define` (include guards excepted); prefer `enum class`; `auto` only when obvious. [GENERIC]
3. Naming: PascalCase types/enums/enum values; camelCase functions, fields, locals; `m_` prefix for private members of classes with invariants; `kPascalCase` constants; lowercase namespaces (`ctrl`, `ctrl::<example>`, `ctrl::qt`); event handlers are `on(const X &, Effects &)` overloads. [GENERIC naming; namespaces PROJECT]
4. `*`/`&` bind to the name (`const State &s`). [GENERIC]
5. Include guard `#ifndef DIR_FILE_H`, not `#pragma once`; include with quotes and namespace path; headers self-contained; no `using namespace` in headers. [GENERIC]
6. 4-space indent, about 100 columns, function-body `{` on its own line, control-flow `{` same line; functions over about 50 lines are split. [GENERIC]
7. Run `.clang-format` if one exists; never reformat unrelated lines. [GENERIC]
8. Warnings are errors everywhere (`CTRL_KERNEL_WARNINGS_AS_ERRORS=ON`: MSVC `/W4 /permissive- /utf-8 /WX`; GCC/Clang `-Wall -Wextra -Wpedantic -Wshadow -Werror`). [GENERIC policy; option name PROJECT]
9. Never silence a warning: no `#pragma warning(disable`, `__pragma`, `#pragma GCC/clang diagnostic ignored`, `/wd`, `-Wno-`, `// NOLINT`, lowering `/W4`, removing `/WX`/`-Werror`; `_CRT_SECURE_NO_WARNINGS` needs approval. [GENERIC]
10. Rule of Zero; value types for events/effects/state/policy (defaults at declaration, no inheritance, no virtuals, no owning raw pointers); small ids/enums by value, rest `const &`, return by value; `[[nodiscard]]` on queries. [GENERIC-ish]
11. No `new`/`delete`/`malloc`, no C arrays, no `strcpy`/`sprintf`, no `reinterpret_cast`/C-style casts (only `static_cast` for enum<->int on the wire). (ECC security variant) [PROJECT]
12. Conflicting variant (`rules/cpp-security.md`): `new`/`delete` allowed for a `QObject` handed to a Qt parent; Qt ownership idioms (`QPointer`, `deleteLater`). [PROJECT-CV]
13. Initialise every member at its declaration; range-check indices/roles from outside (`.at()`, `roleIndex`); never keep references into State across `step()` or iterators into the effect vector while pushing. [PROJECT/GENERIC]
14. No exception may cross `step()`; expected failures are values (status events, fault raise, `std::optional`). [PROJECT]
15. Everything from a master/device is untrusted: unknown value becomes a classified Event, not an assertion; do not log secrets or raw payloads. [PROJECT]
16. Static analysis when reachable (clang-tidy in VS `VC\Tools\Llvm\x64\bin`): run and report; a missing tool is "SKIPPED", not a pass; `/analyze` optional; sanitizers only for manual runs. [GENERIC]
17. Testing framework: plain console program with `KT_TEST`, `KT_CHECK`, `kt::completenessSweep`; no GoogleTest; no coverage gate; unique C-identifier test names; one test per rule/scenario named as a sentence; no Qt/threads/timers/sleeps/clock in core tests; assert via public API; policy numbers from `Policy::defaults()` or named override; never weaken/delete a check; do not test private helpers; a failing test is never edited to pass. [PROJECT test kit, GENERIC principles]
18. Standard test kit per controller: scenario rows, invariants after every step, completeness sweep (one sample per Event alternative, check `samples.size() == std::variant_size_v<Event>`, `changed` predicate must cover every State field), stale-completion probe per request kind and per timer key. [PROJECT]

### (h) Build and environment
1. Host: Windows, MSVC via Visual Studio 18 Community, Qt 6.11.1 (`C:\Qt\6.11.1\msvc2022_64`), node for tools. [PROJECT/machine]
2. `cmake`/`ctest`/`clang-format`/`clang-tidy` are not on PATH; use `node .claude/tools/build.js` (finds them in the VS install) or full paths. [PROJECT/machine]
3. Commands: `build.js all` (configure if no cache, Debug build, ctest), `all --qt` (dir `build-qt`), `all --slot <tag>` (parallel agents), `gate-check.js --all`. [PROJECT]
4. Parallel agents each take a build slot (`wt-slot.js acquire <tag>`) and release it afterwards; 8 slots, stale after 3 h. [GENERIC mechanism]
5. The Qt half is opt-in (`CTRL_KERNEL_BUILD_QT=ON`, `CMAKE_PREFIX_PATH`); Qt 5 and Qt 6 Core must both compile. [PROJECT]
6. Generator `-G "Visual Studio 18 2026"`; omit `-G` if rejected (skills), while build.js passes no `-G`. [PROJECT]
7. qmake variant (leftover): always re-run `qmake` before `nmake`/`jom`; build both shells via the umbrella `.pro`; `QMAKE_PROJECT_DEPTH=0` as a qmake arg in worktree slots; delete 0-byte `.obj` after interrupted builds; Debug links need `d` libs; Qt tests run with `QT_QPA_PLATFORM=minimal|offscreen`, `-o results.txt,txt`, shape check `-functions` count = `void test_` slots, total = functions + 2. [PROJECT-CV]
8. Build config belongs in the project file (qmake), not in shell env vars (pm-agent-memory index: "Qt Creator is the user's build path"). [PROJECT-CV]

### (i) Workflow and pipeline
1. Recipe for a new controller: 8 steps, one deliverable each (I/O contract; sources/sinks closed lists + batch order; pick blocks; Policy; three derived functions first; handlers as rows; sweep + invariants; 5-8 scenarios incl. normal run, role lost mid-job, master lost, ack while role down, stop during start-up). [PROJECT]
2. Do not start step N+1 with step N unreviewed; design doc reviewed before any handler exists. [GENERIC]
3. After scaffolding, the 6 scaffold tests must pass before design content goes in. [PROJECT]
4. TDD: no production edit until a valid RED exists; valid RED = compiles and fails because behaviour is missing, or fails to compile only because the new symbol doesn't exist; invalid = typos, missing test includes, unrelated breakage. [GENERIC]
5. TDD evidence report block (Guarantee / RED / GREEN / Suite / Refactor). [GENERIC]
6. `kernel-verify` phases: Configure, Build (0 errors, 0 warnings), Tests, Qt half (only if `qt/` touched), Gate check, Format (only if `.clang-format`), Diff review against L1-L12; phases skipped for a missing tool are SKIPPED, never PASS; report ends READY / NOT READY. [GENERIC shape]
7. Run Phases 1-3 after every logical step in long sessions, full loop at the end. [GENERIC]
8. controller-change-rule: classify first (Policy field / handler row / derived function / repeated rule -> shared function / new fact -> add-block / new input -> add-event), failing table row first, change one layer, run everything, update docs (Policy statuses `needs a ruling` -> `ruled`), record a decision when contracts/laws/blocks/master-visible meaning change. [PROJECT]
9. controller-add-event: 12-step path (Event struct + variant + `eventName()`, adapter/batch order, rows first, handler, id/epoch/token stale rule, Policy, derived impact, tests, sweep, invariants, stale probe, docs). [PROJECT]
10. controller-add-block: block card first, reusable only at a second user, closed enum with idle/unknown first, facts not decisions, invariants coded, remove replaced loose field. [PROJECT]
11. Report formats: implementer (TASK/FILES/BUILD/TESTS/GATES/LAWS/OPEN), tester (TASK/TESTS/MODE/RESULT/RED EVIDENCE/SWEEP/GAPS), build-resolver (`[FIXED] file:line ... Build Status: SUCCESS/FAILED | Errors fixed: N | Files modified`), controller-reviewer (VERDICT/FINDINGS/TESTS MISSING/NOTES). [GENERIC shape]
12. `/controller-review` scope: argument, else `git diff` + `git diff --staged`; run gate tool first; spawn controller-reviewer on opus; do not apply fixes inside the skill. [GENERIC shape]
13. "Do not generalise before there is a second controller"; reusable blocks enter the kernel only when a second controller names the need. [PROJECT]
14. Layer split: layer A (controller-* skills, controller-reviewer) must stay free of repo-private paths and process references so extraction into a plugin is a move; layer B = this repo's dev setup. [PROJECT]
15. Hooks give early feedback; the build and tests are the source of truth. [GENERIC]

### (j) Project-domain specific (controller kernel)
1. Shape: pure core `step(Event) -> Effects` over an explicit `State` of blocks; Executor; thin Qt shell; Adapter; TimerService; Policy as data. [PROJECT]
2. L1 only `step()` changes State, everything else public is const. L2 core never peeks at the world (no Qt, device, clock, random, thread, file I/O). L3 each async request has an id owned by exactly one State field, other id -> only a `Trace`. L4 timers are `(key, token)` in State, no QTimer in a core. L5 handlers return Effects, nothing called out. L6 no re-entrancy, synchronous completion posted back. L7 outputs/readiness/display are functions of State, handlers never publish. L8 unspecified (State, Event) -> `Trace`/`Log`, State unchanged. L9 no behaviour number in a handler (Policy field). L10 no blocking wait. L11 event order within one input batch set by the adapter and documented. L12 wire names (tags, fault codes, display names) stable. [PROJECT]
3. C++17 + standard library only in `include/ctrl_kernel/` and in every core directory (`*_core/`, `core/`); Qt only under `qt/`. [PROJECT]
4. Core public API: `step()` plus const getters; ends with `static_assert(ctrl::is_controller_core<C>::value)`. [PROJECT]
5. Block set: `Lifecycle`, `Job<Phase>`, `RoleHealth`, `Latch<T>`, `FaultRegister<Code>`, `EdgeInput`, `HandshakeWrites` (planned), `Timers`. [PROJECT]
6. Smells: loose `bool m_xxx` in State; `switch(role)` with different bodies; helper that publishes; literal like `2000`, `10`, `3` in a handler; one-shot timer with lambda capturing `this`; completion matched by connection not id; display value naming a combination. [PROJECT]
7. Qt shell: one thread; core only called from `Shell::post`; effect runner answering synchronously posts back via the mailbox; no `QEventLoop`/`BlockingQueuedConnection`/`wait()`/`processEvents()`; every `QTimer` belongs to `TimerService` keyed `(key, role)` with token; executor diffs `outputs()` against last image; adapters translate only (tag map, edge detection, epoch/id stamping, batch order). [PROJECT]
8. Namespace/file layout: `<name>_core/{events,effects,state,policy}.h`, `<name>_core.h/.cpp`, `tests/`; test registered in CTest as `ctrl_kernel_test` (19 tests today). [PROJECT]
9. Known open gaps (kernel-gaps.md): thin test kit, sweep samples not enforced, `m_s = State{}` on Setup resets ids/tokens (HIGH L3/L4 hole), duplicated L4 bookkeeping, L12 has no string test, include rules not yet a CMake test. [PROJECT]
10. (Leftover domain) ncr_picking: PLC (MC, Modbus), Basler Pylon/JAI eBUS cameras, OpenCV, ADS docks, DRs/WPs/phases, deploy/dev two-machine git topology, `.wt` worktree slots. [PROJECT-CV]

---

## 3. Hooks and tools in detail

Common conventions for the **wired** hooks (guard-delete, commit-guard, protect-tree, kernel-gates, format-cpp): read JSON on stdin with a 4 s safety timer; block = exit code 2 + reason on stderr; allow = exit 0 with no output; any internal error -> exit 0 (fail-open) with a stderr note. **Unwired** guard-bash/guard-edit instead print `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow|ask|deny","permissionDecisionReason":"..."}}` on stdout and exit 0 (can ASK, unlike exit-2 hooks which can only block). Two different output conventions coexist.

### 3.1 `hooks/guard-delete.js` (PreToolUse Bash|PowerShell; wired)
- **Blocks (exit 2):** any delete whose target is outside the project folder (and outside Claude temp locations), touches `.git/` or `.claude/memory/`, is `.claude` itself, would remove an ancestor folder that contains `.git`/`.claude`, uses a glob matching a protected location, cannot be resolved statically (`$VAR`, `$(..)`, `%VAR%`, `~`, backticks, drive-relative `C:foo`, xargs/pipeline input), or has a relative target when cwd is outside the project / unknown; `git clean -x/-X` without `-n`.
- **Allows:** targets inside project; `%TEMP%\claude`, `AppData\Local\Temp\claude`, `CLAUDE_SCRATCHPAD_DIR`; `git clean` without -x; `$CLAUDE_PROJECT_DIR`/`$CLAUDE_SCRATCHPAD_DIR` expanded.
- **How it decides:** custom shell tokenizer (quotes, `; && || |`, redirections, comments, heredocs, PowerShell backtick escapes) producing segments; command position detection with prefixes (`sudo env time nohup xargs then do ...`, `VAR=x`); `cd/pushd/popd/Set-Location` tracked to resolve relative targets; recursion (depth 3) into `bash -c`, `sh -c`, `cmd /c|/k`, `powershell|pwsh -Command|-EncodedCommand` (base64 utf16le), `Invoke-Expression`, heredoc bodies fed to shells; node/python/perl/ruby `-e/-c` code scanned by regex (`rmSync|unlinkSync|rmtree|os.remove|FileUtils...`) with string-literal paths extracted; dynamic code (`__dirname`, `process.env`, `argv`, `glob`, ...) is refused. Recognised verbs: `rm rmdir unlink shred truncate del erase rd ri Remove-Item`, `git rm`, `git clean`, `find ... -delete|-exec rm`, `cmake -E rm|remove|remove_directory`, `[IO.File|Directory]::Delete`. PowerShell `-Path/-LiteralPath` params parsed.
- **Hard-coded:** none project-specific except protected set `.git`, `.claude`, `.claude/memory`; `MAX_DEPTH=3`; project root = `CLAUDE_PROJECT_DIR` else two dirs above the hook (assumes hook sits in `<project>/.claude/hooks`). Exports `{check}` for tests (no test uses it).
- **Weaknesses:** does not see `mv`, `cp -f`/overwrite, `>` truncation, `Move-Item`, `Clear-Content`, `Set-Content`, `robocopy /MIR`, `rsync --delete`, `git reset --hard`, `git checkout --`, `git restore`, `git stash`; `python script.py`/`node script.js` file contents are not inspected (only `-c/-e` and heredoc); `.claude/hooks`, `.claude/settings.json`, `.claude/docs`, `.claude/pm-agent-memory` are deletable (only `.claude` itself and `memory/` protected); Write/Edit tools can overwrite hooks (nothing protects them); CODE_DYNAMIC refusal yields false positives for ordinary build scripts; the allowed-temp set is narrower than guard-bash's (only `...\Temp\claude`, not all of Temp); regex-based, not a real shell parser.

### 3.2 `hooks/commit-guard.js` (PreToolUse Bash|PowerShell; wired)
- **Acts only if** the command matches `git [opts] commit`, `gh pr create|edit`, or `git [opts] push`; everything else passes.
- **Commit blocks:** message (from `-m/--message`, `-F/--file` read from disk, heredocs `<<'EOF'`, PowerShell here-strings `@' '@`, or HEAD message for `--amend` without a new message) containing `Co-Authored-By`, `Generated with`, `noreply@anthropic.com`, `Anthropic` (case-insens.), capitalised `\bClaude\b`; `--no-verify` or single-dash flag containing `n`; `--author`; `-c user.name|user.email|core.hookspath`; `GIT_AUTHOR_*/GIT_COMMITTER_*` assignments; `git config user.name`/`user.email` (read in project root, failures ignored) not exactly `dev28` / `devgbit@gmail.com`.
- **PR blocks:** body text with Co-Authored-By, Generated with, noreply@anthropic.com, "Claude Code".
- **Push blocks:** any `--force*`, `-f`-containing short flag, or `+refspec` token, on any branch (no ask option).
- **Hard-coded:** `WANT_NAME='dev28'`, `WANT_EMAIL='devgbit@gmail.com'`; forbidden word lists. Project root = `CLAUDE_PROJECT_DIR` or `cwd`.
- **Weaknesses:** detection needs `git` preceded by start/space/`;&|(` -- so `bash -c "git commit ..."`, `sh -c 'git commit'`, `/usr/bin/git commit`, `git.exe commit`, `"git" commit` are not detected (bypass); identity check reads effective config including GLOBAL fallback, so "repo-local" is not enforced and `git -C <other> commit` is judged against the project root; `gh api`/GitHub UI not covered; capital-C "Claude"/"Anthropic" ban also blocks legitimate messages that merely mention them; `--force-with-lease` is blocked outright (guard-bash would only ask); `-n` detection is a loose regex; message from editor (no -m) cannot be inspected; fail-open.

### 3.3 `hooks/protect-tree.js` (PreToolUse Edit|Write|MultiEdit; wired)
- Blocks (exit 2) creating/editing a file whose basename is `claude.md`, `agents.md` or `agent.md` (case-insensitive) inside the project folder unless the path starts with `<root>/.claude/`. Files outside the project are ignored. Path normalised (Git Bash `/c/..` -> `c:/..`, lowercase, relative via `input.cwd`).
- Hard-coded: the three names, `.claude/` as the one legitimate home.
- Weaknesses: only the Edit/Write/MultiEdit tools (not `NotebookEdit`, not `echo > CLAUDE.md` via Bash); a nested `.claude/` directory elsewhere in the tree is not special-cased (only root `.claude/`).

### 3.4 `hooks/kernel-gates.js` (PostToolUse Edit|Write|MultiEdit; wired)
- Takes `tool_input.file_path|path`, skips files outside project, under `.claude` or `build*`, nonexistent files; `require('../tools/gate-check.js').checkFile(abs,{root})`.
- Errors -> stderr lines `file:line:col [GATE] message / law: / fix:` and **exit 2** (text fed back to Claude; the edit has already happened). Warnings only -> stdout JSON `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"..."}}`, exit 0.
- Hard-coded: relative path `../tools/gate-check.js`, `.claude|build*` skip. 
- Weaknesses: NotebookEdit not matched; heuristic gates (see 3.9); runs before `format-cpp`, so gate positions can shift after formatting.

### 3.5 `hooks/format-cpp.js` (PostToolUse Edit|Write|MultiEdit; wired)
- Runs `clang-format -i --style=file --fallback-style=none <file>` only if `<root>/.clang-format` exists and the file has extension `.cpp .cc .cxx .h .hpp .hh .inl .ipp`; skips outside project, `build/`, `build-*/`, `.claude/`, `_deps`, `third_party`. Always exit 0; failures noted on stderr ("clang-format skipped: ...").
- Locates clang-format: `Program Files` and `Program Files (x86)` x VS versions `18`,`2022`,`2019` x editions Community/Professional/Enterprise/BuildTools `VC\Tools\Llvm\x64\bin\clang-format.exe`, then `Program Files\LLVM\bin`, then PATH (`tryExe`).
- Weaknesses: formats the WHOLE file, which conflicts with the rule "do not reformat unrelated lines" and makes Claude's cached view stale; the repo currently has no `.clang-format`, so the hook is effectively inert; TOOLING.md lists auto-format hooks as "not adopted" (documentation contradiction).

### 3.6 `hooks/sync-memory.js` (Stop; wired)
- Default mode: global memory dir -> `<root>/.claude/memory/`; `--restore`: reverse. Copies top-level `*.md` files that differ, removes dst `*.md` not in src. No-op with stderr note if source lacks `MEMORY.md`. Logs only when something changed (or on restore). Never reads stdin; exit code always 0.
- Global dir derivation: `CLAUDE_MEMORY_DIR` env override, else `~/.claude/projects/<path with every non-alnum -> '-', drive letter uppercased>/memory` (case-insensitive match of existing dir names; computed path when creating on restore).
- Hard-coded: `.claude/memory` backup dir, comment example `controller-kernel`.
- Weaknesses: runs after every Stop (writes files each turn when memory changed); `--restore` also DELETES md files in the global memory that are not in the backup; subfolders ignored; no conflict detection if both sides changed; depends on Claude's directory-naming scheme.

### 3.7 `hooks/guard-bash.js` (intended PreToolUse Bash|PowerShell; **not wired**)
- **deny:** kill of `ncr_picking`/`ncr_runtime`; commit text with `Co-Authored-By:` or `Generated with [Claude`; `ncrn39@gmail.com` used as GIT_*_EMAIL / in commit/config/`-c user.`/`--author`; `git config --global|--system` write; force push without `--force-with-lease`; `+refspec`; `git add -A/./-u/*`; `git commit -a`; deletes under `reference_source/`; recursive delete in `<project>/.wt`.
- **ask:** every `git push`; destructive git list (see 2(b)13); kill by name; deletes outside project (temp/scratchpad excepted), unresolved variable paths, project root, or `LOCAL_ONLY` paths.
- **How:** regex over command groups split on `\n ; && ||` (not single `|` or `&`); `stripText` removes heredocs, here-strings, `-m` strings; token regex; tracks `cd`; `checkCommitText` also reads `-F` files.
- **Hard-coded:** `PROJECT` default `C:/DGB/Project/computer-vision-app`; `LOCAL_ONLY` list (`components/robotkinematics`, `product_release`, `.claude`, `qmake/local_paths.pri`, `local-env-path.md`, `3rdparty`, `.wt`); `ncr_(picking|runtime)`; `ncrn39@gmail.com`; `dev28 <devgbit@gmail.com>` in message; `reference_source`; `.wt/README.md` reference.
- **Weaknesses:** first matching decision wins and exits (one finding at a time); regex-level checks on `git` subcommand (`-C`, `-c` only partially handled); `--force-with-lease` is allowed to reach ASK while commit-guard (wired) blocks it (inconsistent); overlap with guard-delete but different semantics (guard-bash ASKs outside project, guard-delete blocks).

### 3.8 `hooks/guard-edit.js` (intended PreToolUse Edit|Write|MultiEdit|NotebookEdit; **not wired**)
- **deny:** `reference_source/`; `components/robotkinematics/`; `agent(s).md`/`claude.md` outside `.claude/`; `.claude/pm-agent-memory/` (except `README.md`); non-ASCII char in text written (new_string / content / each MultiEdit new_string) to files matching `\.(cpp|h|hpp|ui|qrc|pro|pri|prf|bat|cmd|ps1|py)$` (except `components/(qpb|robotkinematics)/`). **ask:** `3rdparty/`.
- JSON output as above. Weaknesses: ASCII extension list omits `.cc .cxx .ipp CMakeLists.txt .cmake` that gate-check/project.md treat as ASCII-only; `ui`/`qrc` are covered here but not by gate-check; duplicates protect-tree.

### 3.9 `tools/gate-check.js` (CLI and module; used by kernel-gates, skills, agents)
- CLI: `--all` walks `include examples qt tests src cmake` + top-level `CMakeLists.txt`, `README.md`, `*.cmake` + `docs/**`; or `<files...>`; prints `path:line:col [GATE] message`, final line `gate-check: E error(s), W warning(s)`; exit 1 if any error, 0 otherwise (warnings never fail), 2 on usage/internal error. Skips `build*`, `out`, `.git`, `.claude`, `node_modules`, `.vs`, `.vscode`, `.idea`.
- Gates (severity): `ASCII` error (any byte >0x7F in C++ files, CMakeLists/.cmake/.pro/.pri, README.md and docs md); `L2-purity` error (Qt include/QObject/QDateTime/QThread, `*_clock::now`, rand/srand, random_device, std::thread/mutex, sleep_for, getenv, fopen, fstream, time(), clock(), Sleep(), GetTickCount, std::filesystem; comments/strings ignored); `L2-include` error (only standard headers [minus impure list: filesystem fstream thread mutex shared_mutex condition_variable future semaphore latch barrier stop_token ctime time.h csignal signal.h iostream], `ctrl_kernel/...`, own-directory headers in `*_core/`/`core/`); `L4-timer` (QTimer, singleShot); `L5-callout` (`emit`, `publish(`); `L10-blocking` in `qt/` or `*_shell|adapter(s)` dirs (QEventLoop, BlockingQueuedConnection, `.wait(`, waitForFinished, processEvents); `L9-literal` WARNING (numeric literals other than 0/1 in pure core `.cpp` and headers except policy files; exempt: enums, `[N]`, preprocessor lines, constexpr, static_assert, structs named `*Policy`); `WARN-PRAGMA` error (pragma warning disable, `__pragma`, GCC/clang diagnostic ignored, `/wdNNNN`, `-Wno-...` in code and CMake/qmake files); `DOCS` error (README.md/docs md: `.claude`, Claude, Anthropic, AGENT(S).md, CLAUDE.md, `ADR-n`, `DR-n`, `WP-`, `PQ-n`, `X:\`, `/c/Users`).
- "Pure core" = path under `include/ctrl_kernel/` or any dir named `core` or `*_core`.
- Heuristic scanner: comments blanked, string contents blanked, offsets preserved; no real parser.
- Hard-coded: `ctrl_kernel` namespace/include prefix, `WALK_DIRS`, `qt`/`shell`/`adapter` dir names, `Policy`/`policy` naming, DOCS vocabulary, law names/hints.
- Weaknesses: `WALK_DIRS` fixed; any dir named `core` anywhere counts as pure (including under `tests/` or third-party); L9 flags harmless literals like `* 2`; `.wait(` flagged on any receiver in shell dirs; `.ui/.qrc` not scanned; DOCS gate ignores `src/doc/` output of qt-cpp-docs; gate also is not run for `.claude/` so rules about `.claude/docs` content (ASCII) are unenforced.

### 3.10 `tools/build.js`
- Usage `node .claude/tools/build.js <configure|build|test|all> [--config Debug|Release] [--qt] [--dir <dir>] [--slot <tag>]` (also `--opt=value` forms; `--dir` and `--slot` exclusive).
- configure: `cmake -S <project> -B <dir>` (+ `-DCTRL_KERNEL_BUILD_QT=ON -DCMAKE_PREFIX_PATH=<Qt>` with `--qt`); build: `cmake --build <dir> --config <cfg> --parallel`; test: `ctest --test-dir <dir> -C <cfg> --output-on-failure`; `all` = configure only if no `CMakeCache.txt` (or `--qt` and cache lacks `CTRL_KERNEL_BUILD_QT:BOOL=ON`) + build + test. Prints each command prefixed `> `, step summary `build.js: <step> OK|FAILED (<dir>, <config>)`.
- Default dir `build` or `build-qt`; `--slot` calls `wt-slot.acquire(tag)` and prints slot dir (does not release; the caller must run `wt-slot.js release <tag>`).
- Tool lookup: PATH (`.exe .cmd .bat`), then VS 18 Community, then vswhere (`-latest` and `-products *`), then scan of `C:\Program Files[ (x86)]\Microsoft Visual Studio\<ver>\<edition>`; relative path `Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin`.
- Exit: 0, or exit code of first failing step; 2 for usage/missing tools; 1 if no free slot.
- Hard-coded: `VS18 = C:\Program Files\Microsoft Visual Studio\18\Community`, `VSWHERE` path, `DEFAULT_QT = C:/Qt/6.11.1/msvc2022_64`, env `CTRL_QT_DIR`, CMake cache var `CTRL_KERNEL_BUILD_QT`, dirs `build`, `build-qt`, project root = `CLAUDE_PROJECT_DIR` or two dirs above.
- Weaknesses: no `-G`/`-A` option (relies on CMake default generator; skills/agents still use `-G "Visual Studio 18 2026"`); Debug-only default means no Release verification; `--config` applies at build/test only (multi-config assumed; breaks for single-config generators); changed Qt path needs a fresh dir (CMAKE_PREFIX_PATH only at configure); `usage()` used for missing-tool errors.

### 3.11 `tools/wt-slot.js`
- `acquire <tag>` (prints `build-wt/slotN`), `release <tag>`, `status`, `reclaim`; module exports `acquire, release, status, reclaim, SLOTS`. 8 slots, lock file `slotN/.lock` JSON `{tag,time}` created with exclusive open (`wx`); stale after 3 h (taken over via rename+unlink); a lock still empty within 5 s counts as being written; same tag re-acquires its own slot. Exit 1 when no slot free, 2 usage.
- Hard-coded: `SLOTS=8`, `STALE_HOURS=3`, root `<project>/build-wt`.
- Weaknesses: name says "wt" (worktree) but slots are only build directories (guard-bash's `.wt/` is a different, unrelated thing); no PID liveness check, crashed agents hold slots up to 3 h; two agents using the same tag share a slot; slots not cleaned up.

### 3.12 `hooks/test-guards.js`
- Runs 87 cases (counted: 87) for guard-bash and guard-edit only, via `spawnSync node <hook>` with `CLAUDE_PROJECT_DIR=C:\DGB\Project\computer-vision-app`; expected `allow|ask|deny`; temp dir with good/bad commit message files; exit 1 on failures. No coverage for guard-delete, commit-guard, protect-tree, kernel-gates, format-cpp, sync-memory, gate-check, build.js, wt-slot (and it cannot test the exit-2 convention, only JSON).

### 3.13 settings cross-check
- Every hook referenced in `settings.json` exists (guard-delete, commit-guard, protect-tree, kernel-gates, format-cpp, sync-memory): **no dead hook reference**.
- Hooks present but **not wired**: `guard-bash.js`, `guard-edit.js` (both CV-specific), `test-guards.js` (test of those two).
- `CLAUDE.md` hook list matches `settings.json`. `TOOLING.md` claims guard-bash/guard-edit are PreToolUse hooks (true only in the other project).
- `settings.json` permissions use the legacy `:*` suffix; `settings.local.json` uses space-star form; `settings.local.json` is machine-specific (CV paths, `ncr_*` process names, user home `dgb07`, broad `Bash(cat *)`, `Bash(find *)`, `Bash(awk *)`, `Bash(node *scratchpad*)`, `Bash(bash *scratchpad*)`, `PowerShell(& *scratchpad*)` ...). The scratchpad rules match the word "scratchpad" ANYWHERE in the command, so they are loose.
- No `env`, `statusLine`, `$schema`, or `permissions.deny` entries in either settings file.

---

## 4. Agents and skills in detail

### 4.1 Agents

| agent | role | model | tools line | must / must not | output / verdict |
|---|---|---|---|---|---|
| `kernel-implementer` | implements ONE scoped task in kernel or a core (new event, handler row, block, policy field, shell piece, CMake wiring) | sonnet | `Read, Write, Edit, Bash, Grep, Glob` | Follow `rules/project.md`, path rules, named skill; obey 12 laws; make brief's tests pass, never edit a test to pass; ASCII/English/Doxygen/naming; no silencing warnings; touch only brief files; do not commit. Build via `build.js all --slot <tag>`, then `build.js test` + `gate-check --all`, release slot | `TASK/FILES/BUILD/TESTS/GATES/LAWS/OPEN` |
| `kernel-tester` | writes/runs KT_TEST rows, sweep samples, invariants, stale probes; RED mode and GREEN-verify mode | sonnet | `Read, Write, Edit, Bash, Grep, Glob` | No Qt/threads/timers/sleeps; one KT_TEST per rule; exact Effects asserted; new Event -> sweep sample; new request -> stale probe; RED must be the intended failure; never weaken; no production code; no commit | `TASK/TESTS/MODE/RESULT/RED EVIDENCE/SWEEP/GAPS` |
| `cpp-build-resolver` | fixes compile/warning-as-error/CMake/linker errors with minimal changes | sonnet | `Read, Write, Edit, Bash, Grep, Glob` | Env: VS 18, Qt 6.11.1, call tools by full path; MSVC error table (C4100, C4244/67, C4456-9, C4127, C4702, C4189, C4996, C2039/65, C2672/2893/2784, C2027/2079, C2338, LNK2019, LNK2005, C1083); GCC/Clang notes; never weaken warnings (no pragma, /wd, -Wno-, NOLINT, remove /WX); stop after 3 attempts or when the fix needs a design change | `[FIXED] file:line / Error / Fix / Remaining errors`; final `Build Status: SUCCESS/FAILED | Errors fixed: N | Files modified: <list>` |
| `controller-reviewer` | read-only review vs contracts, L1-L12, smells, C++ correctness, repo policy ("layer A") | opus | `Read, Grep, Glob, Bash` | Find change (`git diff`/staged or named files); run gate tool if project has one (gate error = at least WARN); read changed files fully; checklist L1/L5, L2, L3/L4, L7, L8, L9, L10/L6, L11/L12, shape, tests, C++, repo policy | `VERDICT: APPROVE\|WARN\|BLOCK`, `FINDINGS: [severity] path:line - law/rule - problem - fix`, `TESTS MISSING`, `NOTES`. BLOCK = broken law / missing test for new rule / wire-name change without intent; WARN = smells and gate warnings |
| `code-explorer` | traces features: entry points, execution flow, layers, patterns, deps | sonnet | `Read, Grep, Glob` | Read-only by tool list; carries ECC "Prompt Defense Baseline" boilerplate | `## Exploration:` markdown with Entry Points / Execution Flow / Architecture Insights / Key Files table / Dependencies / Recommendations |
| `code-reviewer` (CV) | pre-merge review of one WP (handoff, report, whole branch diff, `.pro/.pri` registration, tests, docs, DRs, charter phase boundary) | opus, `effort: xhigh` | `Read, Grep, Glob, Bash` | Read-only incl. git (read-only git list), no builds unless asked, never launch/kill ncr exes, sub-agent only sonnet; re-derive report claims; Block/Warning/Approve | `## Code review: WP-xx (branch, base sha)`, `Verdict: Approve\|Warning\|Block`, Findings `[BLOCK\|HIGH\|MEDIUM] path:line`, Report claims (checked/contradicted/not checkable), Scope, Not checked |
| `cpp-reviewer` (CV) | C++/Qt read-only review (lifetime, Qt ownership, threads, errors, perf) | sonnet | `Read, Grep, Glob, Bash` | Qt parent/child ownership is legitimate; >80% confidence; read-only; not build | `## C++/Qt review`, `Verdict: Approve\|Warning\|Block`, findings `[CRITICAL\|HIGH\|MEDIUM]`, Checked and fine, Not checked |
| `silent-failure-hunter` (CV) | hunts swallowed errors, bad fallbacks, missing timeouts around PLC/camera/sockets/OpenCV/project files | sonnet | `Read, Grep, Glob, Bash` | read-only; >80% confidence; do not report documented fallbacks (cite DR) | numbered findings `[HIGH\|MEDIUM\|LOW] file:line` with Path/Impact/Fix/Evidence, then "Checked and fine"/"Not checked" |
| `wp-implementer` (CV) | executes ONE work package from a handoff | sonnet, `effort: xhigh` | **missing (inherits all tools)** | see 2(a)21-22 and 2(b)14-15; build commands verbatim from `docs/rules/build_and_verification.md`; tasklist check before each suite run | report file `docs/plan/phase_<n>/reports/WP-xx_report.md` with 6 sections + <=20-line reply |
| `wp-reviewer` (CV) | adversarial reviewer of state tables / DRs / WP reports / code | sonnet, `effort: xhigh` | **missing (inherits all tools); read-only only by prose** | read-only incl. git writes; rank by consequence | verdict `ACCEPT\|ACCEPT WITH CHANGES\|REJECT`, findings, not-checked, up to 3 questions; <60 lines; may write same content to a PM-named path (contradicts "never edits") |

Note: reviewer models are inconsistent: only controller-reviewer and code-reviewer are opus; cpp-reviewer, silent-failure-hunter and wp-reviewer are reviewers on sonnet, contradicting `rules/delegation.md` ("reviewers -> opus").

### 4.2 Skills

| skill | trigger | what it does | portable? | inputs assumed |
|---|---|---|---|---|
| `controller-kernel` | any work on a controller built on ctrl_kernel needing the standard | Condensed reference: terms, 5 contracts, 8 blocks, 3 derived fns, L1-L12 with checks, 8-step recipe, test kit, file layout, smells | Layer A (portable); text mentions kernel date 2026-10-14 and `docs/controller_kernel.md` | the kernel repo doc is canonical when present |
| `controller-design` | new controller / design doc / I/O contract / policy table / scenarios | Drives recipe, fills `templates/design-doc.md`, `io-contract.md`, `scenario.md`, then scaffolds `templates/code/*.tmpl` with placeholders `{{name}} {{Name}} {{ns}} {{NAME}}`; checklist; worked example | Layer A (portable); mentions repo-specific examples (`examples/localization_core`) | master protocol, device roles, jobs, known numbers; target dirs `<name>_core/` + `tests/`; project warning flags; `kernel_test_support.h` |
| `controller-add-event` | add event/signal/completion/timer kind/command source | 12-step path; adapter-only changes excluded | Layer A | existing core files `events.h effects.h state.h policy.h <name>_core.*`, test Harness; commands `node .claude/tools/build.js all`, gate tool |
| `controller-add-block` | loose bool/counter in State, new/extended block | block card, local vs reusable, struct rules, Policy knobs, invariants, tests | Layer A | `ctrl_kernel/blocks.h`, `ids.h`, design doc "Blocks chosen" |
| `controller-change-rule` | change threshold/readiness/output/fault precedence | classify layer, failing row first, change, run all, docs, decide ADR | Layer A | same + Policy statuses |
| `controller-review` | `/controller-review` | gate tool, spawn controller-reviewer (opus), summarise verdict | Layer A | git or named scope; `node .claude/tools/gate-check.js` |
| `delegate-change` | lead, before delegating a change | classification table, pipeline, brief template, completion contract | Layer B (project-bound: names kernel agents, `.claude/docs/briefs`) | agents, build tool, gate tool, `.claude/docs/plan` |
| `tdd-workflow` | adding event/effect/block/policy/handler, fixing `step()` bugs | RED/GREEN cycle with KT_TEST, evidence report, anti-patterns; accepts `*.plan.md` as data | Layer B (project-bound: KT_TEST kit, VS 18 cmake paths) | `tests/kernel_test_support.h`, `tests/main.cpp`, VS cmake path, build slots |
| `kernel-verify` | after feature/fix, before commit | 7-phase loop, PASS/FAIL report | Layer B (project-bound: VS18 path, `ctrl_kernel_test`, "19 KT_TESTs") | VS 18 Community, Qt dir, `.clang-format` optional |
| `architecture-decision-records` | contract/law/block/API/dependency change, "ADR this" | ADR format, numbering, index, lifecycle | Layer B (project vocabulary in the table); generic mechanism | `.claude/docs/adr/` with `README.md` + `template.md` |
| `cpp-coding-standards` | writing/reviewing C++ | C++ Core Guidelines digest; top addendum "takes precedence" is ncr_picking-specific (Qt 6, qmake, OpenCV, `docs/rules/doc_comment_style.md`) | Body portable (ECC); addendum CV-bound and contradicts CK conventions (see issues) | - |
| `change-impact` | before cross-module/behaviour changes, at end of a WP | impact analysis steps + diff-vs-touch-list check | CV-bound (qmake `.pri`, QtTest, DRs, charter §3) | `git`, `docs/decisions/`, `docs/domains/`, touch-lists |
| `qmake-msvc-build` | any ncr_picking build/link error | toolchain call, always rerun qmake, error trap table, report line | CV-bound | `vcvars64.bat`, `qmake/local_paths.pri`, `.wt` slots |
| `qttest-headless` | adding/running QtTest suites | writing rules, minimal PATH, results files, shape check, parallel-run rules | CV-bound | `tests/<name>/`, ncr suites, ports 25101/25102 |
| `qt-cpp-review` | user asks to review/audit Qt6 C++ (or before commit); arg `framework` | Phase 1 `python3 references/lint-scripts/qt_review_lint.py <files>`, Phase 2 six parallel agents (models, ownership, threads, API, errors, perf), Phase 3 consolidated report (L-/D-/I- ids, confidence >80); read-only | Portable (third-party Qt pack) | Python 3.6+; the `python references/...` path is relative to the skill dir |
| `qt-cpp-docs` | "document this class/file", main.cpp, folders | Pre-flight asks (AskUserQuestion) when docs exist; writes Markdown to `doc/` next to sources (+`doc/index.md` for >1 file); no code fences except usage example | Portable (third-party) | source `.h/.cpp`, related CMake/.ui/.qrc |

---

## 5. Parameterization candidates

| value (current) | where it appears | notes |
|---|---|---|
| Git identity name `dev28` / email `devgbit@gmail.com` | `hooks/commit-guard.js` (WANT_NAME/WANT_EMAIL + message), `rules/project.md`, `memory/feedback-repo-conventions.md`, `CLAUDE.md`, `hooks/guard-bash.js` (message), `hooks/test-guards.js`, `agents/wp-implementer.md`, pm-agent-memory index | one config var `GIT_IDENTITY_NAME/EMAIL` |
| Denied/forbidden identity `ncrn39@gmail.com` (the owner's personal email) | `hooks/guard-bash.js` (checkIdentity), `hooks/test-guards.js` | `GIT_DENIED_EMAILS[]` |
| AI-attribution forbidden patterns (`Co-Authored-By`, `Generated with`, `noreply@anthropic.com`, `Anthropic`, `Claude`, `Claude Code`) | `hooks/commit-guard.js` (FORBIDDEN, PR_FORBIDDEN, inline regexes), `hooks/guard-bash.js`, `tools/gate-check.js` DOC_PATTERNS | one list, separate lists for commit vs PR vs docs |
| Force-push policy (block all vs ask for `--force-with-lease`) | `commit-guard.js` vs `guard-bash.js` | choose one |
| Protected dirs for delete: `.git`, `.claude`, `.claude/memory` | `hooks/guard-delete.js` (checkTargets), `rules/project.md`, `CLAUDE.md` | `PROTECTED_DELETE[]`; memory dir name differs per project (`memory` vs `pm-agent-memory`) |
| Local-only / deploy-record paths: `reference_source`, `components/robotkinematics`, `product_release`, `qmake/local_paths.pri`, `local-env-path.md`, `3rdparty`, `.wt`, `components/qpb` | `guard-bash.js`, `guard-edit.js`, `test-guards.js`, `rules/ascii-only.md` | per-project lists |
| Protected process names `ncr_picking`, `ncr_runtime` (+ ports 25101/25102, `*_test.exe`, `cl.exe link.exe nmake.exe jom.exe`) | `guard-bash.js`, `test-guards.js`, `wp-implementer.md`, `qttest-headless`, `qmake-msvc-build`, `code-reviewer.md`, `settings.local.json` (`Get-Process ncr_runtime,ncr_picking`) | `PROTECTED_PROCESSES[]`, `BUSY_PROCESSES[]` |
| Default project dir `C:/DGB/Project/computer-vision-app` | `hooks/guard-bash.js` (PROJECT), `hooks/test-guards.js` (P), `settings.local.json` (3 rules) | derive from `CLAUDE_PROJECT_DIR` only |
| Project root derivation `__dirname/../..` | all hooks and tools | assumes `.claude/hooks` or `.claude/tools` depth |
| Agent-instruction file names forbidden in tree: `CLAUDE.md`, `AGENTS.md`, `AGENT.md` | `protect-tree.js`, `guard-edit.js`, `gate-check.js` DOCS, `rules/project.md` | `FORBIDDEN_TREE_FILES[]` |
| Docs-gate vocabulary: `.claude`, Claude, Anthropic, `ADR-n`, `DR-n`, `WP-`, `PQ-n`, absolute path regexes | `tools/gate-check.js` DOC_PATTERNS | per-project |
| Docs policy scope: README.md + `docs/**/*.md`; gate walk dirs `include examples qt tests src cmake` | `tools/gate-check.js` (WALK_DIRS, classify) | `GATE_WALK_DIRS[]`, doc roots |
| Pure-core definition (`include/ctrl_kernel/**`, dirs `core`, `*_core`), shell definition (`qt`, `*_shell`, `*_adapter(s)`), include prefix `ctrl_kernel/` | `gate-check.js`, `rules/kernel-laws.md` (paths), `rules/qt-shell.md` (paths), `rules/project.md` | only for kernel-based projects |
| ASCII-only extension sets | `rules/ascii-only.md` (cpp h hpp ui qrc pro pri prf bat cmd ps1 py), `hooks/guard-edit.js` CODE_EXT, `tools/gate-check.js` (CODE_EXT, BUILD_EXT, md), `rules/ecc/cpp/coding-style.md` | one shared list; vendored-dir exemptions |
| Format hook: C++ extensions, skip dirs (`build`, `build-*`, `.claude`, `_deps`, `third_party`), VS versions `18/2022/2019`, editions, `Program Files\LLVM` | `hooks/format-cpp.js` | |
| Build toolchain paths: VS18 `C:\Program Files\Microsoft Visual Studio\18\Community`, vswhere path, Qt `C:/Qt/6.11.1/msvc2022_64`, `CTRL_QT_DIR`, generator `Visual Studio 18 2026` | `tools/build.js`, `skills/kernel-verify`, `skills/tdd-workflow`, `agents/cpp-build-resolver.md`, `CLAUDE.md`, `settings.local.json` (Read //c/Qt/**) | `VS_ROOT`, `QT_DIR`, `CMAKE_GENERATOR` |
| CMake option names `CTRL_KERNEL_BUILD_QT`, `CTRL_KERNEL_WARNINGS_AS_ERRORS`; test target `ctrl_kernel_test` | `build.js`, rules, skills, agents | |
| Build dirs `build`, `build-qt`, `build-wt/slotN`; slot count 8; stale hours 3; default config Debug | `build.js`, `wt-slot.js`, `gate-check.js`/`format-cpp.js` skip patterns | |
| Memory: backup dir `.claude/memory`, env `CLAUDE_MEMORY_DIR`, mangling rule, mirror name `pm-agent-memory` | `sync-memory.js`, `rules/project.md`, `guard-delete.js`, `guard-edit.js`, `pm-agent-memory/README.md` | `MEMORY_BACKUP_DIR` |
| Permission allow-lists (build/gate/slot tools, git read-only, shell read-only, scratchpad scripts) | `settings.json`, `settings.local.json` | generic part vs machine part |
| Hook timeouts (10/10/10/15/30/15 s), 4 s stdin safety timer | `settings.json`, each hook | |
| Models: workers sonnet, reviewers opus, `effort: xhigh` | `rules/delegation.md`, agent frontmatter, `memory/feedback-lead-role-and-models.md` | `MODEL_WORKER`, `MODEL_REVIEWER` |
| User language Vietnamese | `memory/user-language-vietnamese.md` | owner-wide |
| Project/Org vocabulary: kernel, "controller", `ctrl`, `ctrl::qt`, laws L1-L12, `KT_TEST`/`KT_CHECK`, `Policy::defaults()` | rules, skills, agents, hooks | only for kernel-based projects (Layer A) |
| Doc/plan locations: `.claude/docs/{plan,adr,briefs,notes}`, repo docs `docs/controller_kernel.md`, `docs/localization_example.md` | CLAUDE.md, rules, skills | |
| Status line / test count text `19 tests`, date `2026-10-14` | `CLAUDE.md`, `kernel-verify`, `controller-kernel` | remove from a template |
| Scaffold placeholders `{{name}} {{Name}} {{ns}} {{NAME}}` | `skills/controller-design` | already parameterised |
| Kill-by-name policy, destructive git ask-list, local-only ask-list | `guard-bash.js` | |
| Temp/scratchpad roots (`CLAUDE_SCRATCHPAD_DIR`, TMP/TEMP, `AppData\Local\Temp\claude`, `/tmp`) | `guard-delete.js`, `guard-bash.js`, `settings.local.json` | guard-delete and guard-bash differ |

---

## 6. Issues spotted

### Structural
1. **Two projects blended**: ~25 files are CV leftovers (see Section 1). `TOOLING.md`, `settings.local.json`, `guard-bash.js`, `guard-edit.js`, `test-guards.js`, `wp-implementer`, `wp-reviewer`, `code-reviewer`, `cpp-reviewer`, `silent-failure-hunter`, `/review-wp`, `change-impact`, `qmake-msvc-build`, `qttest-headless`, `rules/cpp-patterns.md`, `rules/cpp-security.md`, `rules/ascii-only.md`, `pm-agent-memory/*`, `docs/plan/origin-plan.md` do not belong to controller-kernel (CMake) and some contradict it (qmake/nmake vs CMake; "no CMake, no clang-tidy" in `cpp-reviewer`).
2. `CLAUDE.md` lists only 4 agents and 10 skills; the folder has 10 agents and 17 skills. The CV agents/skills are undocumented there.
3. `TOOLING.md` is stale/foreign: describes ncr_picking tooling, says `settings.json` "holds the hooks only" (this one also has permissions), says `format-cpp` is "not adopted" although it is wired here, says Conventional Commits "not adopted" while `rules/project.md` requires conventional messages.
4. `guard-bash.js`/`guard-edit.js` not wired, so their rules (ask before push, deny `git add -A`, deny `commit -a`, ask on destructive git, ASCII check on edits, `3rdparty` ask) are NOT enforced in this config; `rules/ascii-only.md` states "`guard-edit.js` denies...", which is false here. Also the in-text rule "stage by path" is only in an unwired hook.
5. `docs/briefs/` is referenced by `CLAUDE.md`/`rules/project.md`/`delegate-change` but absent (fine if empty, but undocumented).

### Contradictions between files
6. **ASCII scope**: `rules/project.md` + gate-check: ASCII in README/docs; `rules/ascii-only.md`: Markdown not covered. gate-check/project.md also cover `CMakeLists.txt`/`.cmake`, which `ascii-only.md` and `guard-edit.js` omit; `ascii-only.md` covers `.ui/.qrc/.bat/.py` which gate-check ignores.
7. **Conflicting C++ rule sets both load for `*.cpp`/`*.h`**: `rules/cpp-patterns.md` + `rules/cpp-security.md` (Qt/ncr_picking, allows `new QObject(parent)`, mentions `cv::Mat`, `.pro/.pri`, "no clang-tidy") vs `rules/ecc/cpp/*` (kernel, "No raw new/delete", include-guard conventions, clang-tidy allowed). `CLAUDE.md` says project.md wins over `ecc/cpp/*` but never ranks cpp-patterns/cpp-security.
8. `skills/cpp-coding-standards` addendum "takes precedence" demands `///` on every class/method/member per `docs/rules/doc_comment_style.md` (not present in CK), `m_` everywhere, qmake - conflicts with `rules/ecc/cpp/coding-style.md` (`m_` only for private members of classes with invariants, struct fields no prefix).
9. **Model policy**: `delegation.md`/memory say reviewers = opus, workers = sonnet; `cpp-reviewer`, `silent-failure-hunter`, `wp-reviewer` are reviewer roles on sonnet. `rules/delegation.md` says "Explore/Plan/general-purpose -> sonnet" but `qt-cpp-review` spawns 6 parallel agents with no model specified, violating "pass model on every call".
10. **Two incompatible delivery regimes**: CK lead + kernel-implementer (no commits by workers, lead commits only when user asks) vs CV PM + wp-implementer (worker commits on its own branch, branch per WP, report files in `docs/plan/phase_*/reports/`). `memory/feedback-lead-role-and-models.md` references the brief template in `rules/delegation.md`, but the template is in the `delegate-change` skill (delegation.md itself defers to the skill).
11. **Force push**: `commit-guard.js` (wired) blocks even `--force-with-lease`; `guard-bash.js` and its tests ask for it.
12. **Delete policy**: `guard-delete` (wired) hard-blocks deletes outside project; `guard-bash` (unwired) would ask. Temp allow differs (`Temp\claude` vs whole Temp).
13. `wp-reviewer.md` says "Read-only, never edits" but also "write the same content to the path the PM names"; it has no `tools:` line so enforcement is prose only. Same for `wp-implementer.md` (no tools line = all tools).
14. `rules/project.md` says commit identity is repo-local config; `commit-guard.js` reads effective config (global fallback) and `CLAUDE.md` says not a git repo yet.
15. `docs/notes/kernel-gaps.md` item numbering out of order (10 and 15 at the end), item 10 says docs "being cleaned now" (stale); `docs/plan/origin-plan.md` still mentions AGENT.md, WP/DR/PQ ids, g++ 13 compilers, Qt 5 APIs, and says the Qt half was not built, while CLAUDE.md says it builds with Qt 6.11.1 (acceptable as "context only", but it violates the same "no origin traces" spirit if it were in the repo; it is in `.claude/` so OK).

### Dead/broken references and hard-coded machine data
16. `hooks/guard-bash.js` default `PROJECT=C:/DGB/Project/computer-vision-app`; `hooks/test-guards.js` `P='C:\\DGB\\Project\\computer-vision-app'` and user-home `dgb07` path; `settings.local.json` has `Read(//c/DGB/Project/computer-vision-app/**)`, `Bash(node C:/DGB/Project/computer-vision-app/.claude/hooks/*)`, `Read(//c/Users/dgb07/**)`, `Read(//c/build_packages/**)` etc. All dead/foreign for controller-kernel and exposes the owner's username and personal email (`ncrn39@gmail.com`).
17. `agents/code-reviewer.md`, `wp-*`, `/review-wp`, `change-impact`, `cpp-coding-standards` addendum reference files that do not exist in this repo: `docs/rules/contributor_guide.md`, `design_rules.md`, `doc_comment_style.md`, `ui_design_rules.md`, `build_and_verification.md`, `docs/decisions/` (DRs), `docs/domains/`, `docs/plan/phase_*/wp|reports`, `.wt/README.md`, `qmake/local_paths.pri`.
18. Skills/agents hard-code `Visual Studio 18 2026` generator and the VS18 Community path while `build.js` omits `-G`; `kernel-verify`/`CLAUDE.md` hard-code "19 tests" and date 2026-10-14 (will rot).
19. `qt-cpp-review/SKILL.md` calls `python3 references/lint-scripts/qt_review_lint.py` (relative to the skill folder; wrong from the project cwd, should be `.claude/skills/qt-cpp-review/references/...`). `references/qt-deprecated-classes.md` mentions a `lint-deprecated.sh` that is not shipped. `qt-cpp-review` Phase 2 launches 6 agents (cost/model unspecified).
20. `qt-cpp-docs` writes `doc/` folders next to sources; the DOCS gate only scans README.md and `docs/**`, so these files escape the "user docs only / ASCII" gate, and the skill's output style (code fences ban etc.) is unrelated to the project policy. It also uses AskUserQuestion interactively.
21. `sync-memory.js` comment and `rules/project.md` hard-code `controller-kernel` path naming; `pm-agent-memory/README.md` describes the other project's mirror and says Stop hook is "(.claude/settings.json)".

### Hook/tool bugs and weaknesses
22. `commit-guard.js` bypassable through nested shells/quoted `git` (`bash -c "git commit ..."`, `/usr/bin/git`, `git.exe`) and `gh api`; the capital "Claude"/"Anthropic" ban blocks innocuous commit messages; `-n` regex heuristic; identity check ignores `git -C`.
23. `guard-delete.js` misses overwrite/move/truncate/hard-reset style destruction; script-file contents not inspected; hooks/settings are editable and deletable by the agent (no self-protection); CODE_DYNAMIC refusal can block legit scripts.
24. `kernel-gates.js` exits 2 AFTER the edit (cannot prevent it; relies on Claude fixing); NotebookEdit unmatched; `format-cpp.js` rewrites whole files (conflicts with "do not reformat unrelated lines"); both hooks skip `.claude/` entirely.
25. `sync-memory.js --restore` deletes extra global memory files; a Stop hook that writes to disk each turn; no locking.
26. `gate-check.js` is heuristic: any dir named `core` is "pure"; L9 flags trivial literals (e.g. `* 2`), no allowlist/suppression mechanism (and WARN-PRAGMA forbids pragmas); `.wait(` regex over-matches; DOCS vocabulary can flag legitimate English ("Claude" as a name).
27. `build.js`: no Release/multi-config guidance beyond `--config`; `--slot` never auto-releases; `usage()` reused for missing-tool errors; `needCmake` check is bypassed for the `all`/`test` combos only through ctest lookup.
28. `wt-slot.js`: misleading "wt" name vs `.wt/` worktrees in guard-bash; no liveness; same-tag sharing.
29. `test-guards.js` tests only the two unwired hooks; the wired hooks (guard-delete, commit-guard, protect-tree) and the tools have no test. `guard-delete.js` exports `check` but nothing uses it.
30. `settings.json` permissions use deprecated `:*`; `settings.local.json` is huge, machine-bound, and its scratchpad patterns (`*scratchpad*`) match anywhere in the command line, so they effectively auto-allow arbitrary `node`/`bash`/`python`/`powershell` invocations whenever the text "scratchpad" appears; `Bash(find *)`, `Bash(awk *)`, `Bash(cat *)` allow broad actions (find -delete, awk system()).
31. Frontmatter `effort: xhigh` appears in 3 agents (verify it is honored by the target Claude Code version); `skills/*` use `metadata.origin`, `argument-hint`, `license`, `disable-model-invocation` inconsistently.

### Owner-environment notes for the lead
32. **Attribution conflict**: the current session's harness reminder asks to append `Co-Authored-By: ... noreply@anthropic.com` to commits and a "Generated with Claude Code" line to PRs, while this kit's rules (`rules/project.md`, memory, `commit-guard.js`) forbid exactly that for the owner's projects. A starter kit should state the precedence explicitly (owner rule wins) and keep the hook.
33. The kit identifies the owner by a personal email (`ncrn39@gmail.com`) in a deny rule and a dev identity (`dev28`); both must be parameters, not literals, in a reusable kit.
