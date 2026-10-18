# Inventory of `reference/claude2/` (project "ncr_picking")

All paths are relative to `C:\DGB\Project\setup-project\reference\claude2\`. Nothing under `reference/` was modified. `.claude\temp\` was not read. `*LICENSE*` files were not read (except the first lines of `ECC-LICENSE.txt`: MIT, (c) 2026 Affaan Mustafa). `skills/qt-cpp-review/references/*` was only skimmed.

Verified by running: `node hooks/test-guards.js` -> `failures: 0 / 87` (69 guard-bash + 18 guard-edit cases; it only writes to the OS temp dir). Also verified by direct runs: a commit message that merely quotes `Co-Authored-By:` is denied; `Remove-Item -Force .wt/slot1/file.txt` is denied as "recursive"; `Start-Process ncr_picking.exe`, `gh pr create --body "Generated with [Claude Code]..."` and `mv x.txt reference_source/y.txt` are all ALLOWED by guard-bash.

Diff vs `reference/claude1/` (shallow `diff -rq`): only `CLAUDE.md`, `settings.json`, `hooks/sync-memory.js` differ. claude1 has many extra items (controller/kernel agents and skills, hooks `commit-guard/format-cpp/guard-delete/kernel-gates/protect-tree`, `rules/delegation.md` ...). claude2 is the "ncr_picking" PM/work-package flavour; `guard-bash.js`, `guard-edit.js`, `test-guards.js`, `/review-wp`, `code-reviewer`, `wp-*` agents exist only here.

Project-name note: files say "ncr_picking", but the repo folder on disk is `computer-vision-app` (`C:/DGB/Project/computer-vision-app`, GitHub `gstorm-b/computer-vision-app`); the deploy machine's copy is `C:\DGB\Project\ncr_picking`. This explains the hard-coded `computer-vision-app` paths below.

---

## 1. Inventory table

| path | kind | purpose | model | hook event + matcher | origin |
|---|---|---|---|---|---|
| `CLAUDE.md` | claude.md | Entry point on the dev machine: role (PM, identity dev28), hard rules (git/authorship, machine/processes), agent+model policy, hook summary, memory location. Imports `@../docs/rules/contributor_guide.md` (NOT present). | - | - | project-written |
| `TOOLING.md` | doc | Inventory + history of `.claude/` (2 changes on 2026-10-14), origin of each item, settings notes, hook test count (87), list of ECC items NOT adopted. | - | - | project-written |
| `settings.json` | settings | Registers the 3 hooks only, absolute `C:/DGB/Project/computer-vision-app/.claude/hooks/...` paths, timeouts 10/10/15 s. | - | PreToolUse `Bash\|PowerShell`; PreToolUse `Edit\|Write\|MultiEdit\|NotebookEdit`; Stop (no matcher) | project-written |
| `settings.local.json` | settings | Permission allow-list: read-only git/shell cmds, `tasklist`, `Get-Process ncr_runtime,ncr_picking`, Read of Qt/build_packages/Program Files/user profile/project, Write/Edit of session temp dir, run-anything-with-"scratchpad"-in-the-command rules (bat/ps1/sh/py/node/cmd). | - | - | project-written |
| `ECC-LICENSE.txt` | doc | MIT licence for the ECC (affaan-m/ECC) files copied/adapted. | - | - | ECC |
| `agents/wp-implementer.md` | agent | Executes exactly one work package: touch-list discipline, own branch, one commit, 6-section evidence report. | sonnet (+`effort: xhigh`) | - | project-written |
| `agents/wp-reviewer.md` | agent | Fresh-context adversarial reviewer of plan artefacts (state tables, DRs, WP reports, code); read-only by prompt; ACCEPT/ACCEPT WITH CHANGES/REJECT. | sonnet (+`effort: xhigh`) | - | project-written |
| `agents/code-reviewer.md` | agent | Pre-merge reviewer of a WP's whole branch diff vs handoff/report/touch-list/DRs/charter; Approve/Warning/Block. | opus (+`effort: xhigh`) | - | project-written |
| `agents/cpp-reviewer.md` | agent | Read-only C++/Qt reviewer (memory, ownership, threads, errors, perf); Approve/Warning/Block. | sonnet | - | ECC `agents/cpp-reviewer.md`, adapted |
| `agents/silent-failure-hunter.md` | agent | Read-only hunter of swallowed errors / bad fallbacks / missing timeouts around PLC, camera SDK, sockets, OpenCV, project files. | sonnet | - | ECC, adapted |
| `agents/code-explorer.md` | agent | Traces execution paths/architecture of a feature before new work; read-only by tool list. | sonnet | - | ECC, copied unchanged |
| `commands/review-wp.md` | command | `/review-wp <WP-xx\|handoff> [branch] [base]`: resolves handoff/report/branch/base, invokes `code-reviewer` with `model: "opus"`. | opus (via call) | - | project-written |
| `hooks/guard-bash.js` | hook | Denies/asks on shell commands that break hard rules (AI trailer, personal email, global git config, force push, stage-all, kill of the two exes, deletes in protected areas, destructive git). | - | PreToolUse `Bash\|PowerShell` | project-written |
| `hooks/guard-edit.js` | hook | Denies edits to read-only/vendored/forbidden paths and non-ASCII in code files; asks for `3rdparty/`. | - | PreToolUse `Edit\|Write\|MultiEdit\|NotebookEdit` | project-written |
| `hooks/sync-memory.js` | hook | Mirrors memory `*.md` into `.claude/pm-agent-memory/` each turn (`--restore` reverses). | - | Stop | adapted from image_matching project's hook |
| `hooks/test-guards.js` | hook (test) | Table-driven test harness for the two guards (87 cases), run manually. | - | none (manual) | project-written |
| `rules/ascii-only.md` | rule | Code files (cpp,h,hpp,ui,qrc,pro,pri,prf,bat,cmd,ps1,py) must be pure ASCII incl. comments; path-scoped via `paths:` frontmatter. | - | - | project-written |
| `rules/cpp-patterns.md` | rule | RAII, explicit ownership (Qt parent XOR smart pointer), Rule of Zero/Five, value semantics, error idioms; C++17 only; paths cpp,h,pro,pri. | - | - | ECC `rules/cpp/patterns.md`, adapted |
| `rules/cpp-security.md` | rule | Memory safety, index/ROI range checks, external input untrusted (project files, PLC, camera, sockets), UB; paths cpp,h. | - | - | ECC `rules/cpp/security.md`, adapted |
| `skills/change-impact/SKILL.md` | skill | Evidence-based impact analysis before a change; compare finished diff vs WP touch-list. | - | - | ECC, adapted to WPs/qmake |
| `skills/cpp-coding-standards/SKILL.md` | skill | C++ Core Guidelines digest with a top "ncr_picking addendum (takes precedence)". `metadata.origin: ECC`. | - | - | ECC, copied + project addendum |
| `skills/qmake-msvc-build/SKILL.md` | skill | Build procedure (vcvars64, qmake before nmake/jom, umbrella `.pro`, worktree-slot flags), error triage table, report line format. | - | - | project-written |
| `skills/qttest-headless/SKILL.md` | skill | Writing/running QtTest suites headless: new project per test, minimal PATH, `-o results.txt,txt`, `-functions` shape check, serial runs. | - | - | project-written |
| `skills/qt-cpp-review/SKILL.md` | skill | Qt6 review: Phase 1 Python linter (60+ rules), Phase 2 six parallel agents, Phase 3 report; confidence >80. | (spawns general-purpose subagents; model unset) | - | Qt pack (TheQtCompanyRnD/agent-skills), kept as is |
| `skills/qt-cpp-review/README.md` | doc | Pack readme (install, platforms, files). | - | - | Qt pack |
| `skills/qt-cpp-review/platforms/windsurf.md` | doc | Compact rule variant for Windsurf (unused here). | - | - | Qt pack |
| `skills/qt-cpp-review/references/qt-review-checklist.md` | doc | Universal Qt6 review rules with IDs (skimmed). | - | - | Qt pack |
| `skills/qt-cpp-review/references/qt-framework-checklist.md` | doc | Extra rules for Qt framework/module code (skimmed). | - | - | Qt pack |
| `skills/qt-cpp-review/references/qt-deprecated-classes.md` | doc | Deprecated Qt/std classes -> replacements (skimmed). | - | - | Qt pack |
| `skills/qt-cpp-review/references/lint-scripts/qt_review_lint.py` | skill script | Data-driven single-pass Python linter (~685 lines, 33 KB), run in Phase 1; not read in depth. | - | - | Qt pack |
| `skills/qt-cpp-docs/SKILL.md` | skill | Generates standalone Markdown reference docs for Qt/C++ classes, main.cpp, utility headers into `doc/` next to sources. | - | - | Qt pack, kept as is |
| `skills/qt-cpp-docs/README.md` | doc | Pack readme. | - | - | Qt pack |
| `skills/qt-cpp-docs/LICENSE.txt`, `skills/qt-cpp-review/LICENSE.txt` | doc | Licences (not read). | - | - | Qt pack |
| `pm-agent-memory/MEMORY.md` | memory | Index of the 11 memory files (matches the files present). | - | - | project-written |
| `pm-agent-memory/README.md` | memory (mirror doc) | Explains the mirror, sync-memory usage, restore; never copied/overwritten by the hook. | - | - | project-written |
| `pm-agent-memory/pm-agent-memory-mirror.md` | memory (feedback) | Rule: keep a standby copy of memory in repo `.claude/pm-agent-memory/`; automated by Stop hook since 2026-10-14. | - | - | project-written |
| `pm-agent-memory/two-machine-git-topology-and-identities.md` | memory (project) | Dev (GitHub, dev28) vs deploy (local git, dev27, branch `master`); bundle exchange; sync tags; deploy-repo vs deploy-repo-backup. | - | - | project-written |
| `pm-agent-memory/dev-deploy-sync-workflow.md` | memory (project) | Bundle procedure (dev->deploy, deploy->dev), baselines/markers, handover notes, backups, rehearsal recipe, 3rdparty policy. | - | - | project-written |
| `pm-agent-memory/shared-working-conventions-with-deploy.md` | memory (feedback) | Model-policy history (Sonnet; Opus implementer superseded), skills, contract-first loop, WP and evidence rules, "ask owner about the cell". | - | - | project-written |
| `pm-agent-memory/phase-11-runs-on-dev-beside-phase-10.md` | memory (project) | Long running log of Phase 11 (build_packages, qpb, docking rewrite): rulings, WP merges, traps, SHAs. | - | - | project-written |
| `pm-agent-memory/phase-11-pm-may-run-the-plan-to-the-end.md` | memory (feedback) | Owner's autonomy grant to the PM for WPs not needing an owner decision, and when to still stop. | - | - | project-written |
| `pm-agent-memory/claude-tooling-ecc-2026-10-14.md` | memory (project) | Why/how `.claude/` was reshaped on 2026-10-14; what the next bundle note must say. | - | - | project-written |
| `pm-agent-memory/build-gotchas-not-in-repo-docs.md` | memory (reference) | 0-byte .obj/LNK1136, app_logger swallowing output, running app breaking suites, 0xC0000135 PATH, dev-vs-deploy toolchain table. | - | - | project-written |
| `pm-agent-memory/owner-bench-test-setup.md` | memory (project) | No MC hardware on dev; Basler + Modbus simulator bench; a bench run never closes a cell gate. | - | - | project-written |
| `pm-agent-memory/qt-creator-is-the-users-build-path.md` | memory (feedback) | Owner builds in Qt Creator, so machine paths go in `qmake/local_paths.pri`, not shell env vars. | - | - | project-written |
| `pm-agent-memory/phase-6-work-is-untracked.md` | memory (project) | Historical (outdated since 2026-08-23): Phase 6 files were untracked and once lost; lesson: check `git status`. | - | - | project-written |

Not present although referenced: `../docs/rules/contributor_guide.md` (imported by `CLAUDE.md` via `@../docs/rules/contributor_guide.md`; in the reference copy it would resolve to `reference/docs/rules/...`, which does not exist), `docs/rules/design_rules.md`, `build_and_verification.md`, `doc_comment_style.md`, `ui_design_rules.md`, `.wt/README.md`, `docs/plan/phase_*/...`, `docs/decisions/`.

---

## 2. Rules as atomic statements

Tag: [GENERIC] = would apply to any of the owner's projects (possibly with a different value); [PROJECT] = tied to this project.

### (a) Roles, delegation, models
1. Claude acts as PM and main coordinator on the dev machine (identity `dev28`); the deploy machine (`dev27`) runs its own agent. [PROJECT] (the PM/coordinator pattern itself is [GENERIC])
2. The PM writes handoffs, delegates, reviews, verifies, merges and keeps the plan records. [GENERIC]
3. The PM may issue, review and merge WPs without asking, unless an owner decision is needed: checkpoint (CP) rulings, freeze windows, push or bundle export, deletes outside the project / of retired trees, anything outside the charter scope or section 3 boundary, a stop rule firing, anything the deploy machine must do. (owner 2026-10-05) [GENERIC pattern, PROJECT items]
4. Packages blocked on an owner decision wait; say so instead of guessing. [GENERIC]
5. Sub-agents run on Sonnet (owner 2026-10-05, "Sonnet 5.5"), except `code-reviewer` on Opus (owner 2026-10-14). [GENERIC pattern, PROJECT values]
6. Pass `model` on every Agent call; the call's `model` overrides agent frontmatter. [GENERIC]
7. The model rule does not inherit: write into every brief that any agent it spawns must also use the stated model, at every level. [GENERIC]
8. Effort (`xhigh`) can only come from the agent definition file, never from the call. [GENERIC]
9. WP loop: `wp-implementer` (Sonnet) on a branch in a `.wt/` slot -> PM checks report and evidence -> `code-reviewer` (Opus, `/review-wp`) on the WP diff -> PM decides and merges. [GENERIC pattern]
10. The PM's decision is final; a reviewer verdict is input; the PM checks each finding against the code before acting. [GENERIC]
11. `wp-reviewer` reviews plan artefacts; `cpp-reviewer` and `silent-failure-hunter` do focused C++ passes; `code-explorer` traces code. [PROJECT]
12. An implementer must not start a reviewer agent (say so explicitly in each handoff; WP-05's implementer spawned one against the rule). [GENERIC]
13. Reviewer/explorer agents are read-only: never edit, create, delete, stage, commit, merge, push; do not build or run executables unless the caller asks. [GENERIC]
14. The PM reviews directly when no reviewer is used: open every changed file, re-run the checks, cross-check the touch-list, try a negative check where doubt remains. [GENERIC]
15. Do not quote sub-agent IDs; keep statements about who did which part out of committed docs. [GENERIC]
16. Which machine implements a WP is the owner's call; do not open a branch until the owner confirmed the side; keep work-split statements out of committed docs. [PROJECT]
17. Phase 10 (runtime core) belongs to the deploy machine and is paused at Stage 2; its charter section 3 boundary holds. Phase 11 runs on dev. [PROJECT]
18. Never invoke `using-agent-skills`; that pack is removed. [PROJECT]
19. Ask the owner about the production cell, do not infer it (MC-protocol PLC, not Modbus). [PROJECT]
20. "Report it unnumbered, the owning side numbers it": cross-side findings are stated with both readings, no number, and who rules. [PROJECT]
21. A hook denial/ask is a rule, not an obstacle: never work around a hook, ask the owner; a hook "allow" is not permission. [GENERIC]
22. Skills "support the handoff, never widen it". [GENERIC]

### (b) Git and identity
23. Commit as `dev28 <devgbit@gmail.com>` via repo-local config; never `ncrn39@gmail.com` as author or committer; never change global/system git config. [PROJECT values, GENERIC pattern]
24. Deploy identity is `dev27 <dev27@local>`; six early deploy commits carry `ncrn39@gmail.com` and are not rewritten unless asked. [PROJECT]
25. No AI attribution ever (no `Co-Authored-By: Claude`, no "Generated with Claude Code") in commits, tags, merges or PR bodies; this overrides the harness attribution reminder. [GENERIC for this owner]
26. Stage by explicit path; never `git add -A`, `git add .`, `git commit -a`. [GENERIC]
27. Push only when the owner asks in the current conversation; force-push only on explicit request and then `--force-with-lease`. [GENERIC]
28. `git fetch origin` currently fails ("Repository not found"); the owner fixes that before any push. [PROJECT, time-bound]
29. No destructive git or filesystem command without permission (reset --hard, clean, checkout/restore over changes, branch -D, rebase, deletes outside the project). [GENERIC]
30. Implementers never amend, rebase, hard-reset, `checkout -- .`, or touch `main`; use an extra commit instead (a report-only extra commit is always fine; never amend to hit a count). [GENERIC]
31. One branch and one commit per WP, branched from the integration branch (`main`; deploy uses `master`) at the commit the handoff names, with the branch name it gives (`p11/wp-nn-slug`); one annotated checkpoint tag per checkpoint with a paragraph of why. [GENERIC pattern, PROJECT names]
32. Merge a WP `--no-ff` after ACCEPT. [GENERIC-ish]
33. The machines exchange work only through git bundles (never snapshots or folder copies); send ranges `main sync/dev-<date> --not <last CONFIRMED marker>`; a dev tag records what dev sent, not what deploy has. [PROJECT]
34. Fetch a bundle into a temporary ref (`dev-incoming` or `refs/remotes/deploy-bundle/main`), never straight into `main`; `git bundle verify` and SHA-256 first; delete the temp ref afterwards. [PROJECT]
35. Rehearse an outgoing bundle by fast-forwarding `deploy-repo-backup` (or a bare clone, `merge-base --is-ancestor`, `merge-tree --write-tree`). [PROJECT]
36. After any `git fetch <bundle>` run `git tag -l`: tags auto-follow and a stray `sync/*` tag becomes the wrong marker. [PROJECT]
37. Both sides send a handover note (`update-bundle-<date>.md`) beside the bundle: size, SHA-256, refs, prerequisite commit, commands, rebuild needs with suite counts, what is/is not carried, what to do first. [PROJECT]
38. A second bundle on the same day gets a suffixed tag (`sync/dev-2026-09-21b`); a superseded bundle is renamed `*.SUPERSEDED.bundle` with a banner in its note, deleted only when the owner says. [PROJECT]
39. The side that merges creates the merge commit and sends it back so the other side only fast-forwards. [PROJECT]
40. Never rewrite history the other side may have fetched; rewrites happen before a bundle is sent. [GENERIC]
41. Do not edit docs/comments/notes during a merge; flag stale text instead. [GENERIC-ish]
42. Untracking commits travel in the same bundle as everything before them. [PROJECT]
43. `reference_source/deploy-repo` (ground truth of the deploy machine) changes only on an owner-requested deploy-side update; `deploy-repo-backup` only through bundle fetch + `merge --ff-only`, never re-copied. [PROJECT]
44. Dev-only safety refs (`backup/pre-rewrite-20260920`, `backup-*` tags) contain trailers; never push them. [PROJECT]
45. `3rdparty/`: only `3rdparty/qtpropertybrowser/` (+README) is tracked; every other package is local and ignored; a new prebuilt dependency gets a `.gitignore` rule; check `git ls-files -ci --exclude-standard` before a bundle. [PROJECT]
46. Clone third-party sources with `-c core.autocrlf=false` (dev has global autocrlf=true). [GENERIC]
47. `git checkout`/merge across commits that track `components/RobotKinematics` overwrites the hand-provisioned drop (happened 2026-10-04). [PROJECT]

### (c) Repo hygiene and docs policy
48. The repo never tracks `AGENT.md`, `AGENTS.md`, `CLAUDE.md`; `.claude/` is git-ignored; local agent instructions live in `.claude/CLAUDE.md`; module docs are `README.md`; the contributor guide is `docs/rules/contributor_guide.md` (`design_rules.md` 11.5). [GENERIC pattern]
49. Committed text is English; conversation with the owner is Vietnamese; copy the owner's Vietnamese quotes verbatim only where a handoff asks. [GENERIC for this owner]
50. Cite symbols (`Class::method`, constants, test names) and section headings in committed text; never line numbers. [GENERIC]
51. Every class, method and member gets a `///` Doxygen comment (`docs/rules/doc_comment_style.md`). [PROJECT]
52. Docs, module README, `uml/` and plan records change with the behaviour they describe. [GENERIC]
53. A contradiction of an Accepted decision record (DR) needs a new DR, not an edit. [GENERIC]
54. Never commit `product_release/`, `reference_source/`, build output, `qmake/local_paths.pri`, `*.pro.user`, `local-env-path.md`. [PROJECT]
55. No machine-specific paths or credentials in tracked files; machine paths live in untracked `qmake/local_paths.pri` (template `local_paths.pri.example`). [GENERIC]
56. No temporary code, injected negative checks, debug logs, machine paths or build output left in a diff. [GENERIC]
57. UI structure in `.ui`, styling in `.qss`, English text, no emoji. [PROJECT]
58. Copied ECC/third-party files name their source and licence in a comment; keep the licence file. [GENERIC]
59. Not adopted (conflict with project rules): Conventional Commits and PR flow, 80% coverage and TDD-first mandates, GoogleTest/CMake rules, auto-format hooks (no `.clang-format`), auto-invoked planners, every ECC hook, ECC `rules/common/*`. [PROJECT]
60. Keep `.claude/TOOLING.md` as the inventory; add a `test-guards.js` case for every guard rule added or changed. [GENERIC]
61. While an implementer works in the shared tree, park new PM docs in the scratchpad and never commit (HEAD is the implementer's branch). [GENERIC-ish]

### (d) Language and encoding
62. Code files are ASCII only, comments included: `.cpp .h .hpp .ui .qrc .pro .pri .prf .bat .cmd .ps1 .py`. Substitutes: `--`/`-`, `->`/`<-`/`=>`, `x`, `deg`, `+/-`, plain quotes, `...`, no box drawing, no emoji. [GENERIC rule, extension list Qt/Windows-specific]
63. A char the program must show goes in as an escape (`QChar(0x00B0)`, `u"\u00B0"`) or via translation files. [PROJECT/Qt]
64. When editing a line that has non-ASCII, make that line ASCII; no sweeping of the rest of a file unless the handoff says (backlog item 201). [PROJECT]
65. ASCII rule does not cover Markdown, `.ts`, `.qss`, `components/qpb/`, `components/RobotKinematics/`, `3rdparty/`. [PROJECT]
66. Every handoff repeats the ASCII rule. [GENERIC]
67. Hash file lists with `LC_ALL=C sort -z` (locale changes the hash). [PROJECT]

### (e) File and process safety
68. Never launch or kill `ncr_picking.exe` or `ncr_runtime.exe` (the owner may be using them); if a running shell blocks a link or test, stop and tell the owner. [PROJECT]
69. Never kill another project's processes (e.g. `mc_workbench_tests.exe`); kill only what this session started, by PID; kill-by-name asks first. [GENERIC]
70. Test suites run alone: check `tasklist` immediately before each run (no `cl`, `link`, `nmake`, `jom`, `*_test.exe`, in any project). Fixed ports 25101/25102 are used by `vision_output_device_test`. [GENERIC pattern, PROJECT names]
71. `reference_source/` is read-only (deny edit and delete). [PROJECT]
72. `components/RobotKinematics` is a hand-provisioned drop: replace as a whole, never edit. [PROJECT]
73. Edits under `3rdparty/` ask first (only when a WP says so). [PROJECT]
74. The memory mirror `.claude/pm-agent-memory/` is read-only (README excepted). [GENERIC pattern]
75. Worktree slots (`.wt/slot1..4`, rules in `.wt/README.md`): never delete recursively inside a slot (3rdparty folders are junctions into the main tree); remove each junction with `cmd /c rmdir <junction>` (no /s), then `git worktree remove`; RobotKinematics is copied, never junctioned; `QMAKE_PROJECT_DEPTH=0` as qmake argument; builds may run in parallel, suites may not; Release only (~0.7 GB per slot). [PROJECT]
76. Deletes outside the project, of an unresolved-variable path, or of local-only data git cannot restore (`.claude`, `3rdparty`, `.wt`, `product_release`, `qmake/local_paths.pri`, ...) ask first. [GENERIC pattern]
77. Do not change Windows environment variables without asking. [GENERIC]
78. Scratchpad permission (owner 2026-10-15): agents may create/edit/run `.bat .ps1 .sh .py` / `node` / `cmd /c` scripts in the session scratchpad without asking; guards still inspect every command. [GENERIC]

### (f) Memory
79. The real memory is `~/.claude/projects/c--DGB-Project-computer-vision-app/memory/`; edit only there. [PROJECT path, GENERIC rule]
80. The Stop hook mirrors memory `*.md` into `.claude/pm-agent-memory/` after every turn; `--restore` copies back on a new profile; the mirror's `README.md` is never touched; the mirror protects against profile loss, not working-tree loss (`.claude/` is git-ignored). [GENERIC]
81. If the hook errors or no Stop event occurs, run `node .claude/hooks/sync-memory.js` by hand. [GENERIC]
82. Memory file format: frontmatter `name`, `description`, `metadata` (`type: feedback|project|reference`, `originSessionId`, `modified`), body with **Why** / **How to apply**, `[[wikilinks]]`, `MEMORY.md` as one-line index; dated owner rulings; mark `SUPERSEDED`/`CURRENT`. [GENERIC]
83. The deploy agent keeps its own memory; snapshot at `reference_source/deploy-agent-memory/c--DGB-Project-ncr-picking/memory/` (dated 2026-09-18, its git notes are stale). [PROJECT]
84. Commit uncommitted work early; untracked work is invisible to git safety nets (Phase 6 lesson). [GENERIC]

### (g) C++ / Qt quality
85. C++17 only (`CONFIG += c++17`); C++20/23 items (concepts, ranges, `std::expected`) are reference only. [PROJECT]
86. RAII for every resource; release on all exit paths incl. exceptions. [GENERIC]
87. A `QObject` is owned by its Qt parent XOR one smart pointer, never both; `new X(parent)` is legitimate; raw pointer/`QPointer` = observer; `deleteLater()` for objects that may still get events; never `delete` a QObject from another thread. [GENERIC Qt]
88. `std::unique_ptr` by default, `shared_ptr` only for real sharing; Rule of Zero/Five. [GENERIC]
89. Naming follows the codebase: `PascalCase` classes, `camelCase` functions, `m_` members; do not rename to match guidelines. [PROJECT]
90. Errors: `std::optional` for absence; check every `bool`/status of Qt APIs; exceptions only for exceptional conditions, caught at the thread boundary; nothing (cv::Exception, SDK) may escape a worker thread; no `std::expected`. [GENERIC Qt/C++]
91. Threads: respect affinity; cross threads via queued signals / `invokeMethod`; never emit a signal while holding a mutex (CP.22); no `QThread::terminate()`; no nested `QEventLoop` re-entrancy; lambda connections need a context object; no thread destroyed without `wait()`. [GENERIC Qt]
92. Images: `cv::Mat` copies share data; a `QImage` over `cv::Mat`/SDK memory must not outlive it; clone at ownership boundaries, not by habit. [PROJECT-ish, OpenCV]
93. No `new/delete` for ownership except QObject-to-parent; no C arrays, malloc/free, strcpy/sprintf; avoid `reinterpret_cast` (justify). [GENERIC]
94. Range-check every index, size, ROI; clip `cv::Rect` to the image before `img(rect)`. [GENERIC/PROJECT]
95. External input (project JSON, database, PLC replies MC/Modbus, camera SDK data, sockets) is untrusted: validate type/range/length, fail loudly (log with context, fault, refuse to load), no silent fallback. [GENERIC principle, PROJECT sources]
96. No `QProcess`/`system()` with strings built from external input. [GENERIC]
97. Initialise every variable; no signed overflow; null-check `findChild`, `qobject_cast`, `dynamic_cast`, registry lookups. [GENERIC]
98. Never silence a diagnostic with `#pragma warning(disable)` / `/W0` without PM approval; `/fsanitize=address` only in a local Debug build, never committed without PM approval. [GENERIC]
99. Silent-failure targets: ignored `QFile::open`/`write`/`exec`/`fromJson` results; empty `catch`/`catch(...)` without log; unchecked `QModbusReply::error`/MC status; dangerous defaults (empty project, `0` for missing PLC value, default config replacing corrupt one); wrong log level; lost error propagation across threads; missing timeouts on device I/O/connect/grab/`QEventLoop`; unbounded queues/logs. [GENERIC Qt, PROJECT device vocabulary]
100. Reviewers report only findings >80% sure; zero findings is valid; mark "confirmed by reading" vs "suspected (needs a run)"; do not inflate severity. [GENERIC]
101. `qt-cpp-review` Qt checklists (model begin/end balance, roles, `Q_ASSERT` side effects, `QNetworkReply::deleteLater`, `(std::min)`, ...) apply on request ("for Qt depth"). [GENERIC Qt]
102. Do not flag Qt naming or Qt-parent `new` as defects; do not report a deliberate documented fallback (cite the DR). [PROJECT-ish]

### (h) Build and environment
103. Toolchain: qmake + MSVC (nmake/jom), Windows; no CMake/clang-tidy/cppcheck/CI. [PROJECT]
104. One `cmd.exe`: `call vcvars64.bat`, then `qmake.exe`; `cmake`/`dumpbin` are on PATH only after vcvars. [GENERIC Windows]
105. Always re-run `qmake` before `nmake`/`jom` (stale `Makefile.*` lies). [GENERIC qmake]
106. Build both shells through the umbrella `ncr_picking_all.pro` in one dir (`build\all\<config>`), never `ncr_picking.pro` alone (leaves `ncr_runtime.exe` stale); `CONFIG+=release|debug`, `CONFIG+=multicore` opt-in; executables in `build/bin/<config>`. [PROJECT]
107. Package paths come from untracked `qmake/local_paths.pri` (`ADS_ROOT`, `EIGEN_INCLUDE_DIR`, `COAL_ROOT`, `BOOST_ROOT`, `ASSIMP_ROOT`, OpenCV, Pylon, eBUS); fix the `.pri`, not the project file; never put `C:/build_packages` in a tracked file. [PROJECT]
108. Build config belongs in the qmake project (owner builds in Qt Creator), not in shell env vars. [PROJECT/GENERIC for Qt Creator users]
109. Dev: VS 18, Qt 6.11.1 `C:/Qt/6.11.1/msvc2022_64`, OpenCV 4.14 `C:/build_packages/opencv`, Pylon `PylonBase_v12`; deploy: VS2022, Qt 6.8.3, OpenCV `C:/opencv/build`, Pylon v10, packages in `C:/DGB/build_packages/_install/<name>`. Never copy build commands with paths between machines. [PROJECT]
110. ADS (qtadvanceddocking 5.1.1) is Qt-linked: each machine keeps its own build; never ship dev's ADS DLL to deploy. Eigen 3.4.0 chosen (`C:\build_packages\eigen-3.4.0`). [PROJECT]
111. In a worktree slot pass `QMAKE_PROJECT_DEPTH=0` as a qmake argument (env var does nothing), set `NCR_PICKING_ROOT`, check no generated `Makefile*` names a main-tree path. [PROJECT]
112. Build/test command text comes verbatim from `docs/rules/build_and_verification.md`. [PROJECT]
113. After an interrupted build delete 0-byte `.obj` (`find <build> -name '*.obj' -size 0`); LNK1136 means that, not a source error. [GENERIC MSVC]
114. Build-error triage (LNK1104 running exe; LNK2019 `staticMetaObject` = header missing from `HEADERS`; C1083 include path; LNK2038 Debug/Release mix -> `coald`; exit `0xC0000135` = missing DLL). Work from the first error; surgical fixes only; stop after 3 failed attempts / fix creates more errors / needs architectural change or file outside touch-list; confirm no 0-byte `.obj` afterwards. [GENERIC MSVC/qmake]
115. Write `.bat` with the Write tool, never a Git Bash heredoc; under `EnableDelayedExpansion` never put `!` in a literal; give `findstr` `< nul`. [GENERIC Windows]
116. New tests go in a new test project `tests/<name>/` (`QT += core testlib`, `CONFIG += console c++17 testcase`; `QTEST_MAIN` or `QTEST_GUILESS_MAIN`; slots `test_<behaviour_in_words>`); no real time/network/camera/PLC in unit tests; no `QTest::qWait` as sync (use `QSignalSpy::wait`/`QTRY_COMPARE`); hardware suites skip without hardware; crash tests in a child process. [GENERIC Qt test]
117. Run tests headless: `QT_QPA_PLATFORM=minimal` (`offscreen` for widget/dock suites); always `-o results.txt,txt` (app logger swallows stdout); exit code = number of failures; minimal PATH order: Qt bin, ADS bin, OpenCV bin, Pylon runtime, eBUS runtime, `<root>\build\bin\<config>`, System32. [GENERIC pattern, PROJECT paths]
118. Shape check before trusting a total: `<exe> -functions` count = number of `void test_` slots; total = functions + 2 (initTestCase/cleanupTestCase); e.g. 257 = 255 + 2 is correct, never "fix" it. [GENERIC QtTest]
119. A known intermittent test failing alone: re-run once, record both runs, don't count it; anything else moving from baseline is a stop-rule event; measure the baseline at the base commit if the handoff has none. [GENERIC]
120. A running `ncr_picking.exe` breaks `test_both_shells_take_the_same_instance_key` and `jai_camera_hardware_test`; the owner closes it, never kill it. [PROJECT]
121. Build report format: `[FIXED] <file> - <error code> - <cause>` per fix + `Build: <config> <dir> QMAKE_EXIT=<n> NMAKE_EXIT=<n> - <n> fixed, <n> files touched`. [GENERIC]

### (i) Workflow / pipeline
122. A handoff `docs/plan/phase_<n>/wp/WP-xx_<slug>.md` is the whole specification; do not widen or narrow it. [GENERIC]
123. Implementer reading order: contributor guide, handoff top to bottom, the "Read first" list in order (primary sources in full when told), `.wt/README.md` if bound to a slot, then project skills. [GENERIC pattern]
124. Touch-list: create/edit only files under "May edit/create"; if another file must change, stop and report; never "just fix it"; a file under "Must not touch" is a Block. [GENERIC]
125. Behaviour-neutral WPs: contract suite shows the same test count and 0 failures before/after; if a number moves, stop and report. [GENERIC]
126. Evidence not assertions: every claim backed by test id, count with `-functions` shape check, log line or file path; nothing marked verified without it. [GENERIC]
127. A negative check must name the test expected to go red and why it can see the change; show red, restore, confirm restore location; say whether commit+revert or inject+restore. A test counts red only if compiled, run and failed for the intended reason. [GENERIC]
128. Stop rules are real: on a stop condition write what you have into the report with a "STOPPED AT" marker and say so in the final message. [GENERIC]
129. No unrequested scope: no refactor/rename/cleanup/delete beyond the handoff; suspected defects go under "Findings out of scope", one line each. [GENERIC]
130. Verify a symbol exists before naming it in a handoff (`LOG_DEV_WARN` did not). [GENERIC]
131. A handoff carries the Accepted DR, a disjoint touch-list, acceptance criteria, stop rules, PM-verified facts, environment (base commit, branch, slot). [GENERIC]
132. Contract-first loop for runtime work: PQ card -> DR -> state/transition tables -> table tests -> pure core -> 3-ring verify. [PROJECT]
133. Report at `docs/plan/phase_<n>/reports/WP-xx_report.md` with exactly six sections in order (Changed files, Evidence, Negative checks, Deviations, Findings out of scope, Open questions); final reply <= 20 lines repeating changed-file list and headline evidence; a changed-but-unlisted file is a failed WP. [GENERIC]
134. Before merge: PM checks report, runs `/review-wp`, records verdict + decision in `reports/<WP-xx>_review.md`. [GENERIC pattern]
135. Reviewers re-derive report claims from the diff and mark each checked / contradicted / not checkable by reading; every acceptance criterion needs evidence in the report even if the code looks right. [GENERIC]
136. A new source/header/.ui/.qrc/test is registered in its module `.pri` (never a shell `.pro`) or its test `.pro`; resources at shell level (`qmake/app_common.pri`); dependency glue via `qmake/*_dependency.pri` + `local_paths.pri`. [PROJECT]
137. Each phase has charter (section 3 = boundary), README plan, request.md, `wp/`, `reports/`; before issuing a WP check its touch-list against the last deploy bundle; Phase 11 may edit only two named tests in the shared `tests/architecture_contract_test/main.cpp`, all other Phase 11 tests go in new projects. [PROJECT]
138. Checkpoint rulings and tags (`phase11-cp0`, `phase10-cp1`) are the owner's. Migrate Basler/JAI camera pages only inside an owner-announced freeze window. [PROJECT]
139. Change-impact before a cross-module/behaviour change: code, build registration, interfaces/data, tests, contracts/DRs, ownership boundary, docs; mark unproven items `unverified`. [GENERIC]

### (j) Project-domain specific
140. Production cell: MC-protocol PLC polled by the app; master writes `nActiveCamera`/`nActivePatternGroup` only on change. [PROJECT]
141. Bench (dev): Basler acA2500-14gm SN 21688213 at 192.168.0.197; Modbus TCP simulator `127.0.0.1:800` unit 1; project `build/Test-data/virtual-project-2.vproj`; log `build/bin/release/logs/app_log_<date>.txt`. A bench run never closes a gate defined on the cell (CP1 owner run, DR-0013/0014 Ring 2); record as bench evidence. [PROJECT]
142. The owner provokes faults on purpose (pulls cable, drops Modbus, `bErrorReset`); ask before calling an outage spurious; split a day's log at `Application starting` and check the `VIRTUAL device` warning. [PROJECT]
143. A Basler camera stays "connected" after a cable pull until a grab/connect touches it (backlog 76); app_log does not capture Qt warnings. [PROJECT]
144. Numbering: Phase 10 (deploy) owns DR-0016..0031; Phase 11 uses DR-0101+, backlog items from 201; a WP must not edit the `docs/decisions/README.md` index (PM adds rows). [PROJECT]
145. Docking: `deleteLater()` on a dock still registered in the ADS manager is a bug (DR-0101); DR-0024 removes the robot-check widget from vision-output pages. [PROJECT]
146. qpb 1.6.x is tracked source compiled into `ncr_shared` (glue outside the folder); RobotKinematics glue `qmake/robotkinematics_dependency.pri`; generated mesh JSON is not tracked, generated with voxel 40 / safety 0.4 per preset. [PROJECT]
147. Expected suite baselines at `c2849527`: contract 301/0 (299 functions), `mc_frame` 57, modbus 32, `vision_output` 14, `tcpip_client` 12, pose 4+1 skip, `property_browser` 6, `runtime_docking` 32. [PROJECT, time-bound]
148. Review finding ranking on a running cell: silent wrong result > hang > fault with wrong code > cosmetic. [PROJECT-ish]

---

## 3. Hooks in detail

### settings.json (registration)
- `PreToolUse` matcher `Bash|PowerShell` -> `node C:/DGB/Project/computer-vision-app/.claude/hooks/guard-bash.js`, timeout 10.
- `PreToolUse` matcher `Edit|Write|MultiEdit|NotebookEdit` -> `.../guard-edit.js`, timeout 10.
- `Stop` (no matcher) -> `.../sync-memory.js`, timeout 15.
- Absolute, machine+project-specific paths (not `$CLAUDE_PROJECT_DIR`). The same path is allow-listed in `settings.local.json` (`Bash(node C:/DGB/Project/computer-vision-app/.claude/hooks/*)`), with `Read(//c/DGB/Project/computer-vision-app/**)`, `Read(//c/Users/dgb07/**)`, `Write/Edit(//c/Users/dgb07/AppData/Local/Temp/claude/**)` also hard-coding user and project.

### Common protocol (guard-bash, guard-edit)
- Input: PreToolUse JSON on stdin (`tool_input.command` / `tool_input.file_path|notebook_path|path`, `cwd`).
- Output only for deny/ask: one JSON line on stdout `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny"|"ask","permissionDecisionReason":"[guard-bash|guard-edit] ..."}}`, then `process.exit(0)`. "allow" = no output at all (never emits explicit `allow`, so it does not override the normal permission flow).
- Exit code always 0. Fail-open: JSON parse failure or any exception -> allowed, note on stderr. First decision wins (`decide()` exits).

### hooks/guard-bash.js (Bash|PowerShell)
Decision method: `norm()` normalises paths (trim quotes, `\`->`/`, `~`, Git-Bash `/c/x` -> `c:/x`, lowercase, strip trailing `/`). `stripText` removes heredocs, PowerShell here-strings and quoted `-m/--message` text. `groups()` splits on newline, `;`, `&&`, `||`; `tokens()` splits on whitespace/pipe/`&`/parens keeping quoted strings whole. Per group it tracks `cd/Set-Location/sl/pushd` as a base dir, then runs `checkGit`, `checkKill`, `checkDelete`. Whole-command checks first: `checkCommitText`, `checkIdentity`. All regex/tokenizer based (no shell parser).

Denies:
- Commit text (any command with `git ... commit|merge|tag|notes`; also the content of a `-F/--file` file) containing `co-authored-by:` or `generated with [claude` (case-insensitive).
- `ncrn39@gmail.com` in a command that sets `GIT_AUTHOR_EMAIL=`/`GIT_COMMITTER_EMAIL=` or has `git ... commit|config|-c user.|--author`.
- `git config --global|--system` unless read-only (`--get`, `--get-all`, `--list`, `-l`, `--show-origin`).
- `git push --force|-f` without `--force-with-lease`; `git push ... +refspec`.
- `git add` with `-A --all -u --update . * :/`; `git commit` with `--all` or any short flag cluster containing `a` (`-a`, `-am`).
- A kill verb (`taskkill`, `Stop-Process`/`spps`, `pkill`, `killall`, `kill <arg>`, `.kill()`, `wmic ... delete`) in a group that mentions `ncr_picking` or `ncr_runtime`.
- Any delete verb (`rm rmdir rd del erase unlink shred Remove-Item ri Clear-Content`, `git rm`, `find -delete`/`-exec rm`, `[IO.File]::Delete`) whose path has a `reference_source` component.
- Recursive delete (`-r -R --recursive -recurse /s`, or any dash flag containing the letter r) under `<PROJECT>/.wt`.

Asks:
- Any other `git push` (every push asks).
- Destructive git: `reset --hard|--merge|--keep`, `clean`, `checkout` with `--`/`.`/`-f`/`--force`, `restore` (except plain `--staged`/`-S`; also `--worktree`/`-W`), `switch -f/--force/--discard-changes`, `branch -D` (and `-d -f` variants), `stash drop|clear`, `rebase`, `filter-branch|filter-repo`, `update-ref -d`, `tag -d|--delete`, `worktree remove --force`, `reflog expire|delete`, `gc --prune`, `commit --amend`.
- Kill by name (`/im`, `-name`, `pkill`, `killall`, `Get-Process <name>`, `Stop-Process` without `-Id`).
- Deletes: path with `$` or `%var%` (unless it mentions scratchpad/temp\claude); outside `PROJECT` (temp roots excepted); the project root; anything under LOCAL_ONLY.

Allows everything else (e.g. `git log --author=dev28`, `git checkout main`, `git branch -d`, `git rm --cached`, `kill <pid>`, `taskkill /PID`, deletes under temp roots).

Hard-coded values: `PROJECT` default `'C:/DGB/Project/computer-vision-app'` (override: env `CLAUDE_PROJECT_DIR`); `LOCAL_ONLY` = `components/robotkinematics`, `product_release`, `.claude`, `qmake/local_paths.pri`, `local-env-path.md`, `3rdparty`, `.wt`; process regex `ncr_(picking|runtime)`; email `ncrn39@gmail.com`; folder `reference_source`; `.wt` dir; message texts cite `dev28 <devgbit@gmail.com>`, `cmd /c rmdir`, `.wt/README.md`. Temp roots: `CLAUDE_SCRATCHPAD_DIR`, `TMP`, `TEMP`, `os.tmpdir()`, `~/AppData/Local/Temp`, `/tmp`.

Config knobs: only env vars `CLAUDE_PROJECT_DIR`, `CLAUDE_SCRATCHPAD_DIR` (+TMP/TEMP); everything else is source edits.

Known weaknesses / gaps (those marked * were confirmed by running the hook):
- Only kills are checked for `ncr_*`; "never launch" is not enforced* (header says "killing", deny text says "launch or kill").
- Identity: only a literal deny of one email; no positive check that author = dev28; `git config user.email x` (local) allowed.
- AI-attribution check covers `git commit|merge|tag|notes` only; `gh pr create --body "Generated with [Claude Code]..."` is allowed*. A commit message that merely quotes `Co-Authored-By:` is denied* (the check scans the raw command, not the stripped body).
- Non-delete mutations are unguarded: `mv x reference_source/y` allowed*, `cp`/`copy` overwrite, `>`/`>>` redirects, `sed -i`, `robocopy /MIR`, `xcopy`, `Move-Item`, `Set-Content` into `reference_source/`, `components/RobotKinematics`, the memory mirror (only the Edit/Write tools are guarded for those).
- `-Force` is read as a recursive flag (`-[a-z]*r[a-z]*` matches "Force"): `Remove-Item -Force .wt/slot1/file.txt` is denied as recursive*.
- Only the first delete verb per group is analysed; verbs used as data (`grep rm .claude`) can give false asks; nested shells (`bash -c '...'`, `cmd /c "rd /s ..."`) are single quoted tokens and may escape detection.
- `git checkout <branch>` is allowed although it can overwrite ignored hand-provisioned files (happened 2026-10-04); `git merge`, `git pull`, `git stash` (push), `git reset --soft/--mixed`, `git worktree remove` (no --force), `git branch -m` are not guarded; `git push --delete` only asks (like every push).
- `taskkill /PID <n>` is allowed for any PID; deletes anywhere under any temp root are allowed.
- Fail-open by design (a bug silently disables the guard; only stderr). PROJECT default is dev-specific; with another `CLAUDE_PROJECT_DIR` (e.g. a slot) the `.wt`/LOCAL_ONLY logic is relative to that.

### hooks/guard-edit.js (Edit|Write|MultiEdit|NotebookEdit)
Target = `file_path || notebook_path || path`, `\`->`/`, lowercased. Checks in order:
1. DENY path component `reference_source/` (anywhere).
2. DENY `components/robotkinematics/`.
3. DENY a file named `agent.md|agents.md|claude.md` not under a `.claude/` directory (any depth).
4. DENY `.claude/pm-agent-memory/` except `readme.md`.
5. ASK `3rdparty/` (returns before the ASCII check).
6. For extensions `cpp|h|hpp|ui|qrc|pro|pri|prf|bat|cmd|ps1|py` (excluding `components/qpb|robotkinematics`): scan `new_string`, `content`, each `edits[].new_string` for the first non-ASCII char; DENY with U+XXXX, the offending line (<=120 chars) and substitution hints.
Hard-coded: all path fragments, `design_rules.md` sections 11.5/16.2, `README.md "Provision RobotKinematics"`, `CODE_EXT` (duplicated in `rules/ascii-only.md`). No config knobs, no env vars.
Weaknesses: only covers the editing tools (Bash writes bypass it); `NotebookEdit.new_source` not scanned; the `agent.md`/`claude.md` name deny is global (would hit unrelated projects if used user-wide); other code extensions (`.cc .cxx .inl .js .json`) unscanned; fail-open; the file itself contains `§` (non-ASCII, harmless for .js).

### hooks/sync-memory.js (Stop)
- Default: copy memory `*.md` -> `<root>/.claude/pm-agent-memory/`; `--restore`: reverse.
- Root: `CLAUDE_PROJECT_DIR` or two levels above the script. Memory dir: `CLAUDE_MEMORY_DIR` if set, else `~/.claude/projects/<slug>/memory`, slug = `path.resolve(root)` with every non-alphanumeric -> `-`, lowercased, matched case-insensitively against existing folders (so it is project-agnostic).
- Only top-level `*.md` (no subfolders/other types); `readme.md` (any case) skipped both ways. Safety: source must contain `MEMORY.md`, else nothing copied/deleted. Copies only byte-different files; deletes destination `.md` files absent in the source (also in the memory dir when `--restore`!).
- Does not read stdin; errors only to stderr; `process.exitCode = 0`; no JSON output; logs only when something changed or on restore.
- Weaknesses: `--restore` can delete memory files missing from an older mirror; one-way overwrite, no merge/timestamp logic; memory-side `README.md` never mirrored; the mirror sits in git-ignored `.claude/`.

### hooks/test-guards.js
- Plain Node script, run manually `node .claude/hooks/test-guards.js`; exit 1 if any failure. Makes a temp dir (`mkdtempSync(tmpdir/guard-test-)`) with `bad_msg.txt` (contains Co-Authored-By) and `good_msg.txt` for the `-F` cases; removes it at the end.
- Table of `[hook, command-string-or-tool_input-object, cwd, expected]`. For each case: `spawnSync('node', [hook.js])` with stdin `{tool_input, cwd}` and env `CLAUDE_PROJECT_DIR=P`; empty stdout = `allow`, else parse `permissionDecision`; prints `ok`/`FAIL` lines (+stderr), ends `failures: N / total`.
- 87 cases = 69 bash + 18 edit; run result 0 failures. Bash cases: allowed read/stage-by-path/plain commit, stage-all, `commit -a`, amend, AI trailer (inline, heredoc, `-F` file), personal email via `-c`, global config deny/read allow, push ask / force deny / `+ref` deny, destructive git asks, safe git allows, kill ncr deny / other ask / by-PID allow, rm in project / `reference_source` / `.wt` / local-only / outside-project / temp / unresolved variable, `find -delete`, text-that-mentions-commands allowed. Edit cases: reference_source, RobotKinematics, AGENTS/CLAUDE.md, memory mirror, 3rdparty ask, non-ASCII in `.cpp/.h/.pri/.ps1` (new_string/content/edits), ASCII-fix allowed, `.md/.qss/.ts/qpb` allowed.
- Hard-coded: `P = 'C:\\DGB\\Project\\computer-vision-app'` (also inside a Remove-Item path and the memory path `C:\\Users\\dgb07\\.claude\\projects\\c--DGB-Project-computer-vision-app\\memory\\MEMORY.md`), project folders (`build/all/pm-old`, `tests/architecture_contract_test/...`, `C:/build_packages`, `product_release/bundle-to-deploy`, `sync/dev-2026-10-05`, `mc_workbench_tests.exe`). Does not test sync-memory.js or NotebookEdit.

---

## 4. Agents, commands and skills in detail

### Agents

**wp-implementer** - model `sonnet`, `effort: xhigh`, NO `tools:` line (inherits all tools incl. Agent/Edit/Bash). Role: execute one WP exactly as written.
- Must: read in order (contributor guide, handoff, "Read first", `.wt/README.md` if slot, skills `qmake-msvc-build`, `qttest-headless`, `change-impact`, `cpp-coding-standards`); stay on touch-list; own branch from `main` at the named commit; commit only there; stage by path; revert/re-apply for negative checks; evidence-based report; English committed text, no line numbers; honour stop rules; log out-of-scope findings; verbatim build/test commands (`qmake` before `nmake`, 0-byte .obj check, `QT_QPA_PLATFORM=minimal|offscreen`, `-o results.txt,txt`, `-functions`); `tasklist` before each suite run; any agent it starts uses the PM's model and gets the rules.
- Must not: change git config, add Co-Authored-By, amend/rebase/hard-reset/`checkout -- .`, touch `main`, launch/kill the exes, refactor/rename/delete beyond the handoff, start a reviewer agent.
- Output: `docs/plan/phase_<n>/reports/WP-xx_report.md` with six sections (Changed files; Evidence; Negative checks; Deviations; Findings out of scope; Open questions) + <=20-line reply with changed-file list and headline evidence. No verdict vocabulary; uses a `STOPPED AT` marker.

**wp-reviewer** - `sonnet`, `effort: xhigh`, NO `tools:` line (not mechanically read-only despite the text). Reviews one named artefact (state/transition table, decision record, WP report + files, code change) with a per-artefact checklist (table completeness/duplicates, DR quoted not paraphrased, report vs touch-list/negative checks/shape check, behaviour-neutral, Doxygen, no machine paths, lifetime/threads/errors/external input/ownership idiom). Must: be read-only including git (log/show/diff/status only), report only, rank by consequence, say what was not checked. Output: (1) verdict `ACCEPT / ACCEPT WITH CHANGES / REJECT` + one line; (2) findings (location, scenario, confirmation steps); (3) not checked; (4) <=3 questions; < 60 lines; also write to a PM-named path if given.

**code-reviewer** - `opus`, `effort: xhigh`, `tools: Read, Grep, Glob, Bash`. Input: handoff path, branch/range, base commit, report path. Reads handoff, contributor guide + module READMEs, report, full diff (`git diff --stat`, then file by file, `git grep` callers), DRs and charter section 3. Checks: scope/boundary (every `git diff --name-status` path on touch-list; Must-not-touch = Block; no temp code/AGENT.md/CLAUDE.md/build output), acceptance + evidence (each criterion mapped; `-functions` count = `void test_` slots, total = functions + 2; negative checks), build registration (`.pri`), C++/Qt correctness (>80% sure only), docs/records (Accepted-DR contradiction = Block). Must not: edit/create/move/delete, stage/commit/merge/push/tag/reset/checkout/switch, touch `.wt/` slot state, build/run exes unless asked, quote agent IDs; sub-agents must be `sonnet`. Severity: Block / Warning (MEDIUM only) / Approve. Output template:
`## Code review: WP-xx (<branch>, base <sha>)` / `Verdict: Approve | Warning | Block` / Findings `[BLOCK|HIGH|MEDIUM] path:line - what. Scenario. Fix. (confirmed by reading | suspected)` / Report claims (checked | contradicted | not checkable by reading) / Scope (files outside touch-list) / Not checked.

**cpp-reviewer** - `sonnet`, `tools: Read, Grep, Glob, Bash`. Generic C++/Qt reviewer with embedded project facts (Qt 6, C++17, qmake/MSVC, no CMake/clang-tidy; Qt naming; Qt-parent ownership fine; rules of record; DR conflict). Gets the diff via `git diff <base>..HEAD -- '*.cpp' '*.h'`. Priorities: CRITICAL memory/lifetime, CRITICAL security/external input, HIGH Qt threading, HIGH error handling, MEDIUM performance, MEDIUM best practice (const, explicit, override, enum class, Doxygen `///`). >80% confidence only. Output: `## C++/Qt review: <scope>`, `Verdict: Approve | Warning | Block` (Approve = no CRITICAL/HIGH; Warning = MEDIUM only; Block = any CRITICAL/HIGH), numbered findings `[CRITICAL|HIGH|MEDIUM] file:line`, Checked and fine, Not checked.

**silent-failure-hunter** - `sonnet`, `tools: Read, Grep, Glob, Bash`. Hunt targets: swallowed errors, dangerous fallbacks, inadequate logging, lost propagation, missing bounds/timeouts (PLC MC/Modbus, Basler Pylon, JAI eBUS, OpenCV, JSON, DB). Do not report documented deliberate fallbacks (cite the DR). Output: numbered `[HIGH|MEDIUM|LOW] file:line` findings with Path / Impact / Fix / Evidence, then "Checked and fine" and "Not checked". No Approve/Block verdict.

**code-explorer** - `sonnet`, `tools: Read, Grep, Glob` (the only truly read-only one; no Bash). ECC original incl. a generic "Prompt Defense Baseline" block. Process: entry points, execution path, architecture layers, patterns, dependencies. Output: `## Exploration: [Feature]` with Entry Points, Execution Flow, Architecture Insights, Key Files table, Dependencies, Recommendations. No verdict.

Verdict vocabularies differ: wp-reviewer ACCEPT/ACCEPT WITH CHANGES/REJECT; code-reviewer + cpp-reviewer Approve/Warning/Block; silent-failure-hunter none; PM memory logs "ACCEPT".

### Command /review-wp
`commands/review-wp.md` (frontmatter `description`, `argument-hint: <WP-xx | handoff path> [branch] [base]`). Steps: (1) resolve from `$ARGUMENTS`: handoff `docs/plan/phase_*/wp/<WP-xx>_*.md` (ask if several), report `docs/plan/phase_*/reports/<WP-xx>_report.md`, branch (named, else the one the plan README/report names), base (named, else `git merge-base main <branch>`); (2) invoke Agent with `subagent_type: "code-reviewer"` and `model: "opus"` (the one exception to the Sonnet rule); prompt gives the four inputs + active charter path + any area for depth, and does NOT paste the diff; (3) on return the PM verifies each finding against the code, decides merge / return with confirmed findings / record a deviation, and records verdict + decision in `reports/<WP-xx>_review.md`.

### Skills

- **change-impact** - trigger: before cross-module or behaviour changes, when writing/checking a touch-list, at the end of every WP. Does: seven-question evidence checklist before the change (code via `git grep`/includes; qmake `.pri` registration; interfaces/data: signals, Q_PROPERTY, JSON schema, DB, PLC map, protocol; tests and which must go red; contracts/DRs; ownership boundary/freeze windows; docs), then a post-change check (`git diff --name-status <base>..HEAD` vs touch-list, tests with totals + shape check + negative check, docs updated, no temp code). Unproven items marked `unverified`. Portable concept; wording bound to WPs, `.pri`, DRs, charter section 3, two-machine boundary. Inputs: base commit, touch-list, `docs/decisions`, `docs/domains`.
- **cpp-coding-standards** - trigger: writing/reviewing C++. Content: ECC Core Guidelines digest (P, I, F, C, R, ES, E, Con, CP, T, SL, Enum, SF/NL, Per) + checklist; top-of-file addendum "ncr_picking (takes precedence)" (C++17, Qt ownership, naming, errors, threads, images, `///` comments, rules of record). Portable core with a swappable addendum.
- **qmake-msvc-build** - trigger: every build/rebuild/failing build of the shells, `ncr_shared`, test projects, incl. `.wt` slots. Sections: toolchain (vcvars64, qmake, `local_paths.pri` variables), build (qmake first, umbrella `.pro`, slot flags, fresh dir, never kill exe), failure table + fix rules (surgical, never silence diagnostics, stop after 3 attempts), build report format. Project-bound (umbrella `.pro`, names, versions) with generic MSVC/qmake nuggets. Inputs: `build_and_verification.md`, handoff paths, `local_paths.pri`.
- **qttest-headless** - trigger: any WP that adds/changes/runs a test suite (named suites listed). Sections: writing tests, running (tasklist, platform, minimal PATH, results file, shape check), interpreting (Totals line, flaky policy, baselines). Project-bound names (suites, ports 25101/25102, DLL list), generic QtTest practice. Inputs: `build_and_verification.md`, handoff baselines.
- **qt-cpp-review** (Qt pack v2.0, `argument-hint: [framework]`) - trigger: user asks to review/check/audit Qt6 C++ or "before committing". Scope detection (diff vs codebase by wording). Phase 1: `python3 references/lint-scripts/qt_review_lint.py <files>` (Python 3.6+; relative path not anchored to the skill dir). Phase 2: six parallel read-only agents (Model Contracts, Ownership & Lifecycle, Thread Safety, API/Naming/C++ correctness, Error Handling & Validation, Performance & Quality); confidence >80 = finding, 60-79 = investigation target (max 10). Phase 3: consolidated report with L-/D-/I- ids. "framework" mode only suggested, never auto-enabled. Fully portable; sets no model for its six agents; read-only.
- **qt-cpp-docs** (Qt pack v1.0) - trigger: "document this class / main.cpp / write docs for my C++". Pre-flight: look for existing docs in `doc/` next to the sources and ask (AskUserQuestion) update / skip / fresh / cancel; then 16-section class structure, entry-point and free-function structures; no code fences except the usage example; header is truth; writes `<ClassName>.md` + `doc/index.md` for multiple files; internal quality check never in output; ends with the footer "AI assistance has been used to create this output." Portable.

Rules' `paths:` frontmatter makes them load only for matching files (ascii-only: 12 globs; cpp-patterns: cpp,h,pro,pri; cpp-security: cpp,h).

---

## 5. The work-package (WP) workflow

Defined across `CLAUDE.md` (Agents and models), `agents/wp-implementer.md`, `agents/wp-reviewer.md`, `agents/code-reviewer.md`, `commands/review-wp.md`, skills `change-impact`, `qttest-headless`, `qmake-msvc-build`, and memory (`shared-working-conventions-with-deploy`, `phase-11-*`). The handoff template and plan docs are NOT in claude2 (they live in the repo under `docs/plan/phase_<n>/`), so the handoff format below is reconstructed from what agents/skills/memory expect.

1. Plan layout (tracked repo docs): `docs/plan/phase_<n>/README.md` (plan, register of branches/findings), `charter.md` (section 3 = footprint/boundary), `request.md` (owner rulings quoted verbatim), `wp/WP-xx_<slug>.md` (handoffs), `reports/WP-xx_report.md`, `reports/WP-xx_review.md`, plus `docs/decisions/` (DR-xxxx, Proposed/Accepted).
2. Handoff (PM-written and committed first; implementer gets the issuing commit's SHA): complete specification - goal, "Read first" list (and whether to read in full), Environment (base commit on `main`, branch name e.g. `p11/wp-nn-slug`, worktree slot `.wt/slotN` named in section 9), touch-list with "May edit/create" and "Must not touch" (disjoint from concurrent WPs), acceptance criteria, stop rules, required evidence / negative checks, expected baselines, PM-verified facts, Accepted DR, ASCII-only reminder; the PM's prompt repeats model, "no reviewer agent", and the hard rules.
3. Before issuing: PM checks the touch-list against the last deploy bundle and charter section 3 (freeze windows, Phase 10 footprint); `change-impact` proves the touch-list; owner has confirmed which side implements.
4. Execution: `wp-implementer` (Sonnet) in a `.wt/slotN` worktree (3rdparty trees shared by junction in the early slots; RobotKinematics copied; `prepare_slot.ps1`; builds parallel, suites serial, Release only) on its own branch, one commit (+ optional report-only commit), staging by path, no amend/rebase/reset. Uses `qmake-msvc-build`, `qttest-headless`. Behaviour-neutral WPs keep identical test counts. Stop rules -> `STOPPED AT`.
5. Report: `reports/WP-xx_report.md`, six sections in fixed order (Changed files, Evidence, Negative checks, Deviations, Findings out of scope, Open questions); final reply <= 20 lines. Evidence = test ids, counts with `-functions` shape check (total = functions + 2), log lines, file paths; a negative check names the test expected red and why it can see the change, shows red, restores, confirms the restore location.
6. PM review: opens every listed file, re-runs checks, cross-checks touch-list (changed-but-unlisted file = failed WP), tries a negative check on doubt. Then `/review-wp` -> `code-reviewer` (Opus) on the whole diff; PM verifies each finding in code. Optional: `wp-reviewer` (plan artefacts; ACCEPT / ACCEPT WITH CHANGES / REJECT), `cpp-reviewer`, `silent-failure-hunter`. (In some periods the PM reviewed directly with no reviewer: owner rulings 2026-10-04/05.)
7. Decision: Approve/ACCEPT -> PM merges `--no-ff` into `main`; or returns the package with confirmed findings; or records a deviation. Verdict + decision go into `reports/<WP-xx>_review.md`; a merge-record commit updates README/request.md. Implementers never merge or touch `main`. Merge order is planned around shared files (e.g. `common_deps.pri`).
8. Owner gates (PM must stop and ask): checkpoint rulings, freeze windows, push/bundle export, deletion of retired trees / outside project, firing stop rules, scope outside charter, anything for the deploy machine.
9. After merges: re-run all suites on `main` against baselines; slot cleanup via `cmd /c rmdir` of junctions, then `git worktree remove`; sync to the other machine only by bundle + handover note.
10. Tags: annotated checkpoint tags (`phase11-cp0`, `phase10-cp1`), sync tags `sync/dev-<date>`, `sync/deploy-<date>`.

---

## 6. Parameterization candidates

| value | where it appears | notes |
|---|---|---|
| Project dir `C:/DGB/Project/computer-vision-app` | `settings.json` (3 hook commands); `settings.local.json` (hooks path, Read); `guard-bash.js` `PROJECT` default; `test-guards.js` `P` (+2 strings); `CLAUDE.md` memory slug | use `$CLAUDE_PROJECT_DIR` / relative; folder name disagrees with project name "ncr_picking" |
| Windows user `dgb07` | `settings.local.json` (`//c/Users/dgb07/**`), `test-guards.js` memory path | |
| Memory dir slug `c--DGB-Project-computer-vision-app` | `CLAUDE.md`, `pm-agent-memory/README.md`, memory files, `test-guards.js` | `sync-memory.js` derives it; `CLAUDE_MEMORY_DIR` override |
| Mirror folder `.claude/pm-agent-memory/`, keep-file `readme.md`, required `MEMORY.md` | `sync-memory.js`, `guard-edit.js` regex, `CLAUDE.md`, README | |
| Dev identity `dev28 <devgbit@gmail.com>`; deploy identity `dev27 <dev27@local>` | `CLAUDE.md`, `guard-bash.js` message, `wp-implementer.md`, memory | |
| Denied personal email `ncrn39@gmail.com` | `guard-bash.js` `checkIdentity`, `test-guards.js`, `CLAUDE.md` | same address as the user's account email |
| Attribution patterns `co-authored-by:` / `generated with [claude` | `guard-bash.js` `checkCommitText` | add `gh pr` coverage |
| Protected paths: `reference_source/`, `components/RobotKinematics/`, `3rdparty/`, `.wt/`, `product_release`, `qmake/local_paths.pri`, `local-env-path.md`, `.claude`, `components/qpb` | `guard-bash.js` (`LOCAL_ONLY`, reference_source, .wt), `guard-edit.js`, `CLAUDE.md`, `rules/ascii-only.md` | |
| Forbidden agent-doc filenames `AGENT.md|AGENTS.md|CLAUDE.md` outside `.claude/` | `guard-edit.js`, `CLAUDE.md`, `TOOLING.md`, agents | |
| Process names `ncr_picking.exe`, `ncr_runtime.exe`; other project's `mc_workbench_tests.exe`; build tools `cl link nmake jom *_test.exe` | `guard-bash.js` regex, `CLAUDE.md`, agents, skills, `settings.local.json` (`Get-Process ncr_runtime,ncr_picking`) | |
| Fixed test ports 25101/25102 | `CLAUDE.md`, `wp-implementer.md`, `qttest-headless` | |
| ASCII-only extension list `cpp h hpp ui qrc pro pri prf bat cmd ps1 py`; exemptions `components/qpb`, `RobotKinematics`, `3rdparty`, `.md .ts .qss` | `guard-edit.js` `CODE_EXT`, `rules/ascii-only.md` `paths:` | keep both in sync (single source) |
| Hook timeouts 10/10/15 s | `settings.json` | |
| Sonnet/Opus policy; `effort: xhigh` | `CLAUDE.md`, agent frontmatter, `review-wp.md`, `code-reviewer.md` | |
| Branch names `main` (dev) / `master` (deploy); WP branch pattern `p11/wp-nn-slug`; tags `sync/dev-<date>`, `sync/deploy-<date>`, `phase11-cp0`; temp branch `dev-incoming`; folders `product_release/bundle-to-deploy|bundle-from-deploy`; `reference_source/deploy-repo`, `deploy-repo-backup`, `deploy-agent-memory` | memory, `CLAUDE.md`, agents, `review-wp.md` | |
| Doc paths: `docs/rules/contributor_guide.md`, `design_rules.md` (11.5, 16.2), `build_and_verification.md`, `doc_comment_style.md`, `ui_design_rules.md`, `docs/plan/phase_*/{wp,reports}`, `docs/decisions/`, `docs/domains/`, `uml/`, `.wt/README.md` | agents, skills, command, hook messages | |
| Machine roles + toolchains: VS 18 vs VS2022, Qt 6.11.1 vs 6.8.3 (`C:/Qt/6.11.1/msvc2022_64`), OpenCV 4.14 paths, Pylon v12/v10, `C:/build_packages`, `C:/DGB/build_packages/_install` | `qmake-msvc-build`, memory, `settings.local.json` (`Read(//c/Qt/**)`, `//c/build_packages/**`, `//c/Program Files/**`) | |
| `qmake/local_paths.pri` variables `ADS_ROOT EIGEN_INCLUDE_DIR COAL_ROOT BOOST_ROOT ASSIMP_ROOT` + OpenCV/Pylon/eBUS; `NCR_PICKING_ROOT`; `QMAKE_PROJECT_DEPTH=0`; umbrella `ncr_picking_all.pro`; build dirs `build\all\<config>`, `build/bin/<config>` | skills, agents, memory | |
| Test conventions: `QT_QPA_PLATFORM=minimal|offscreen`, `-o results.txt,txt`, `-functions`, total = functions + 2, suite names, minimal PATH order | `qttest-headless`, `wp-implementer.md` | |
| Scratchpad permission patterns (`*scratchpad*`, ~30 entries) | `settings.local.json` | generic, but matched anywhere in the command |
| Temp-root allowances (`CLAUDE_SCRATCHPAD_DIR`, TMP, TEMP, `~/AppData/Local/Temp`, `/tmp`) | `guard-bash.js` | |
| Phase boundary / charter section 3 / numbering (DR-0101+, backlog 201+, deploy DR-0016..0031) | `CLAUDE.md`, agents, memory | |
| Domain vocabulary (PLC MC/Modbus, Basler Pylon, JAI eBUS, OpenCV, vision-output sockets, `cv::Mat`, `QImage`, ROI, robot cell) | `cpp-security.md`, `cpp-reviewer.md`, `silent-failure-hunter.md`, `wp-reviewer.md` | |
| Language policy: committed text English, owner conversation Vietnamese | `CLAUDE.md`, `wp-implementer.md`, memory | |
| Guard policy sets: destructive-git list, kill-by-name regexes, delete verbs | `guard-bash.js` | candidates for a policy table |
| Owner-gates list (what the PM must ask about) | memory `phase-11-pm-may-run...`, `CLAUDE.md` | |
| Remote `gstorm-b/computer-vision-app` (origin, currently broken) | memory | |

---

## 7. Issues spotted

1. **Missing import**: `CLAUDE.md` imports `@../docs/rules/contributor_guide.md`; in this reference copy that resolves to `reference/docs/rules/contributor_guide.md`, which does not exist (the real file is in the project repo under `docs/rules/`). Also absent: `design_rules.md`, `build_and_verification.md`, `doc_comment_style.md`, `.wt/README.md`, plan/DR docs referenced by agents, skills and hooks.
2. **Hard-coded machine/project paths**: `settings.json` (3 absolute hook paths), `settings.local.json`, `guard-bash.js` default `PROJECT`, `test-guards.js` `P`, memory slug in `CLAUDE.md`. Folder name `computer-vision-app` disagrees with the project name "ncr_picking" (deploy path `C:\DGB\Project\ncr_picking`, deploy memory slug `c--DGB-Project-ncr-picking`).
3. **Rule vs enforcement gap**: CLAUDE.md and agents say "never launch or kill" the two exes; `guard-bash.js` blocks only kills (verified: `Start-Process ncr_picking.exe` is allowed); header comment says "killing", deny text says "launch or kill".
4. **Stale numbers**: memory `claude-tooling-ecc-2026-10-14.md` says the guard test has 78 cases; `TOOLING.md` and the file say 87 (verified 69+18).
5. **Memory files are layered and partly contradictory**: `shared-working-conventions-with-deploy.md` stacks SUPERSEDED/CURRENT rulings (Opus implementer -> Sonnet), still tells to invoke `using-agent-skills` (removed) and ends with "Mirror every memory edit into the repo as pm-agent-memory-mirror requires" (now automatic). `phase-11-pm-may-run...` has `modified: 2026-10-04` but quotes an owner statement dated 2026-10-05 and says both "run the Opus implementer" and "Sonnet 5.5 implementer". `two-machine-git-topology...` says dev is "linked to GitHub" while `CLAUDE.md`/Phase 11 memory say `git fetch origin` fails ("Repository not found"). Memory frontmatter is inconsistent (some files lack `metadata`/`originSessionId`).
6. **Agent tool lines inconsistent**: `wp-reviewer` is described as read-only but has no `tools:` restriction (inherits Edit/Write/Bash/Agent); `wp-implementer` can spawn agents and one did (WP-05) despite the "no reviewer" rule - enforced by prompt only. `cpp-reviewer`, `code-reviewer`, `silent-failure-hunter` list `Bash`, so "read only" is by prompt (plus hooks). `code-explorer` is the only truly read-only agent.
7. **Verdict vocabularies differ** (ACCEPT/ACCEPT WITH CHANGES/REJECT vs Approve/Warning/Block vs none).
8. **Line-number tension**: reviewers must give `file:line` evidence, while implementer rules forbid line numbers in committed text; reviews are then committed as `reports/<WP>_review.md` / merge records. Memory notes themselves cite `file:line` (e.g. `robot_kinematic_picking_checker.cpp:236`).
9. **Qt pack vs project policy**: `qt-cpp-review` launches six parallel "general-purpose" subagents without a model (conflicts with "pass the model on every Agent call" unless the PM adds it); `qt-cpp-docs` footer "AI assistance has been used to create this output." plus its `doc/` output location conflict with the no-AI-attribution stance and the project's docs layout (`docs/`, module `README.md`, Doxygen `///`); it also uses interactive `AskUserQuestion`.
10. **`cpp-coding-standards`**: the "unchanged" body keeps C++20 concepts, `underscore_style` naming (NL.10), trailing-underscore members, and a closing checklist item "Templates are constrained with concepts (T.10)", contradicting the C++17 / `m_` camelCase addendum (addendum is declared to win).
11. **Broken refs in the Qt pack**: `qt-deprecated-classes.md` mentions a non-existent `lint-deprecated.sh` (the real tool is `qt_review_lint.py`); `qt-cpp-review/SKILL.md` runs `references/lint-scripts/...` with a path not anchored to the skill folder; README claims 460 lines (actual 462).
12. **Hook bugs/quirks** (section 3 has the full list): `-Force` read as recursive; commit message quoting "Co-Authored-By:" denied; `gh pr create --body` attribution not guarded; no guard on `mv/cp/>/sed -i/robocopy` into protected dirs; `git checkout <branch>` allowed though it can overwrite ignored hand-provisioned files (happened 2026-10-04); `sync-memory --restore` deletes memory `.md` files absent from the mirror; fail-open on any exception; `agent.md`/`claude.md` filename deny is global; `guard-edit.js` contains non-ASCII `§`.
13. **Permissions risk** (`settings.local.json`): `Read(//c/Users/dgb07/**)` opens the whole user profile; `Bash(node *scratchpad*)`, `python *scratchpad*`, `bash *scratchpad*`, `powershell *scratchpad*` match the word anywhere in the command (any command mentioning "scratchpad" is pre-approved); `Bash(find *)`, `awk *`, `sed -n *` can still write/execute (`find -exec`/`-delete`, awk `system()`); also pre-approves `node .../hooks/*` (incl. `test-guards.js`). The guard hooks are the only mitigation.
14. **Time-bound facts mixed with timeless rules**: baseline SHAs, suite counts at `c2849527`, "`git fetch origin` currently fails", Phase 10 paused, machine versions - in `CLAUDE.md`, skills and memory; they will rot.
15. **Harness attribution conflict**: this project's `CLAUDE.md` forbids `Co-Authored-By`/"Generated with Claude Code" and says it overrides the harness reminder; the hook enforces it for commits only (not PR bodies). A generic starter kit must state who wins (the session that produced this report itself received a harness reminder asking for the opposite).
16. **Duplication / drift risk**: ASCII extension list in `guard-edit.js` and `rules/ascii-only.md`; "tasklist before each suite run" in `CLAUDE.md`, `wp-implementer.md`, `qttest-headless`; the Sonnet rule in `CLAUDE.md`, `review-wp.md`, `code-reviewer.md`, memory (4+ places).
17. **Vendored third-party code**: `qt_review_lint.py` (33 KB, executed automatically by the skill) was not audited; ECC `code-explorer` carries a generic "Prompt Defense Baseline" block.
18. **Legacy compatibility text** worth dropping in a starter kit: `wp-implementer.md`/`wp-reviewer.md` mention `AGENT.md`/`AGENTS.md` renames from 2026-10-14.
