# Inventory of reference/claude4 (.claude/ of NichirinLaserMark)

Source folder: `C:\DGB\Project\setup-project\reference\claude4\` (49 files, ~228 KB; `memory/project-status.md` alone is 82 KB). All paths below are relative to that folder. There is no CLAUDE.md; `memory/MEMORY.md` + `memory/*` and `rules/*` (auto-loaded) play that role. Nothing under `reference/` was modified; `.claude\temp\` was not read.

Origin facts stated in the files: `memory/ecc-local-harness.md` says a cherry-picked subset of **ECC 2.2.3** (agents, commands, rules, skills) was installed on 2026-10-07 and rewritten for Qt 5.15/qmake/MSVC 32-bit. ECC source is kept outside the repo (`C:\DGB\build_packages\harness-tools\ECC-2.2.3`). No ECC hook was taken because every ECC hook is `node -e` and the owner forbids Node. The two PowerShell hooks are project-written. The whole `.claude/` is local-only (ignored through `.git/info/exclude`).

---

## 1. Inventory table

| path | kind | purpose (one line) | model | hook event + matcher | origin |
|---|---|---|---|---|---|
| settings.json | settings | Registers the 2 hooks (absolute paths to the project's `.claude/hooks`, `powershell -NoProfile -ExecutionPolicy Bypass -File`, timeout 10 s each). No permissions/env/model keys. | - | declares PreToolUse `PowerShell\|Bash` and PostToolUse `Write\|Edit` | project-written |
| hooks/guard-shell.ps1 | hook | Blocks `git push` / `git remote add\|set-url`, and blocks writing source files (.cpp .h .hpp .ui .pro .pri .qrc .qss .ts) via Set-Content/Add-Content/Out-File or `>` redirection. | - | PreToolUse, matcher `PowerShell\|Bash` | project-written |
| hooks/sync-memory.ps1 | hook | Mirrors any file written in the user-level memory folder to the repo backup memory folder, and vice versa (byte copy). Never blocks. | - | PostToolUse, matcher `Write\|Edit` | project-written |
| agents/code-architect.md | agent | Designs a feature blueprint (files, interfaces, data flow, build order) fitting existing patterns. | sonnet | - | ECC, adapted (project constraints block added) |
| agents/code-explorer.md | agent | Read-only tracing of existing features: entry points, execution flow, layers, deps. | sonnet | - | ECC, adapted (module map, "where to start") |
| agents/cpp-build-resolver.md | agent | Fixes qmake/MSVC/moc/link errors with minimal edits, 32-bit toolchain recipe. | sonnet | - | ECC, rewritten for Qt/MSVC |
| agents/cpp-reviewer.md | agent | C++/Qt reviewer (lifetime, error propagation, threading, project rules); report-only. | sonnet | - | ECC, rewritten |
| agents/planner.md | agent | Planning specialist; produces a plan, respects docs-structure (spec delta, no quoting requests). | sonnet | - | ECC, adapted |
| agents/silent-failure-hunter.md | agent | Hunts ignored rc, swallowed errors, bad fallbacks, lost signals, missing timeouts; report-only. | sonnet | - | ECC, adapted |
| agents/type-design-analyzer.md | agent | Scores types on encapsulation, invariant expression/usefulness/enforcement. | sonnet | - | ECC, NOT adapted (fully generic) |
| commands/cpp-build.md | command | `/cpp-build [target]` - build 32-bit and fix errors via cpp-build-resolver. | - | - | ECC, rewritten |
| commands/cpp-review.md | command | `/cpp-review [paths\|--cached]` - run cpp-reviewer (+ silent-failure-hunter on device paths). | - | - | ECC, rewritten |
| commands/feature-dev.md | command | `/feature-dev` - 8-step guided workflow (explorer -> architect -> spec first -> implement -> review -> close-out). | - | - | ECC, extended (steps 5, 6, 8 local) |
| commands/plan.md | command | `/plan [text\|request file]` - restate, ground in repo/spec, spec delta, tasks, WAIT for confirmation. | - | - | ECC, rewritten |
| rules/code-comments.md | rule (path-scoped: cpp,h,pro,pri,ps1,bat,ui,qss,qrc) | Code comments may cite only tracked repo content; ADR as `ADR Dn`; no phases/requests/.claude/URLs. | - | - | project-written |
| rules/docs-structure.md | rule (always loaded) | Spec-driven docs layout, phase boundary, requests untracked, 5-step requirement workflow. | - | - | project-written |
| rules/no-delete-outside-root.md | rule (always loaded) | Never delete/move/clean anything outside the project root without the owner's explicit yes. | - | - | project-written |
| rules/repo-boundaries.md | rule (always loaded) | Tracked files must never reference `.claude/` or the memory folders. | - | - | project-written |
| rules/cpp/coding-style.md | rule (paths cpp,h,pro,pri) | Language level, ownership, naming, includes, ASCII/English, QSS tokens. | - | - | project-written (ECC rules/cpp slot) |
| rules/cpp/patterns.md | rule (paths cpp,h) | RAII, value semantics, no-exceptions error handling, threading, config compat, architecture, SDK runbook pointer. | - | - | project-written |
| rules/cpp/security.md | rule (paths cpp,h) | Memory safety, UB, external input, hardware side effects, license secrets. | - | - | project-written |
| rules/cpp/testing.md | rule (paths tests/**, laser_host/**, mark_ezd_controller.*) | Oracles after any change, build every dependent test, QtTest capture, how to write tests. | - | - | project-written |
| skills/architecture-decision-records/SKILL.md | skill | Capture/read ADRs; locally redirected to `docs/architecture/architecture_decisions.md` D-items. | - | - | ECC (metadata.origin: ECC) + local override block |
| skills/cpp-coding-standards/SKILL.md | skill | C++ Core Guidelines digest (22.7 KB); project overrides block at top. | - | - | ECC (metadata.origin: ECC) + override block |
| skills/inherit-legacy-style/SKILL.md | skill | Scans code for implicit style, grills the operator on conflicts, writes `.claude/rules/legacy-style.md`. | - | - | community (metadata.origin: community) + local adaptation block |
| memory/MEMORY.md | memory (index) | One-line index of the 24 memory files (complete, but see issues). | - | - | project-written |
| memory/user-role.md | memory (user) | User = Project Leader, technical, writes Vietnamese; reply Vietnamese, code/docs English. | - | - | project-written |
| memory/project-leader-term.md | memory (feedback) | Call the person "Project Leader", never "the owner"; technical "owner" stays. | - | - | project-written |
| memory/working-arrangement.md | memory (feedback) | Assistant = PM/orchestrator of implementer/reviewer/tester sub agents; verifies and commits. | - | - | project-written |
| memory/subagent-default-model.md | memory (feedback) | Every sub agent at every nesting level uses `model: "sonnet"` unless the owner names another. | - | - | project-written |
| memory/git-local-repo.md | memory (feedback) | Local-only git: portable git path, identity, no AI trailer, never push, autocrlf=false, ask commit-vs-fold. | - | - | project-written |
| memory/ecc-local-harness.md | memory (project) | What the ECC subset is, no-Node constraint, which hooks exist and why. | - | - | project-written |
| memory/memory-backup-sync.md | memory (feedback) | Two memory folders must stay byte-identical (hook covers Write/Edit, deletes by hand). | - | - | project-written |
| memory/no-delete-outside-root.md | memory (feedback) | Same rule as rules/no-delete-outside-root.md, memory form (duplicate). | - | - | project-written |
| memory/docs-restructure.md | memory (project) | Record of the 2026-10-07 spec-driven docs restructure and decisions. | - | - | project-written |
| memory/powershell-utf8-source-files.md | memory (feedback) | Never Get-Content/Set-Content a source file on a CP932 machine; recovery recipe. | - | - | project-written |
| memory/no-unicode-symbols-in-code.md | memory (feedback) | ASCII-only source; replacement table lives in tracked build doc; exemptions. | - | - | project-written |
| memory/no-ui-screenshots.md | memory (feedback) | Do not screenshot to verify UI; the user checks UI. | - | - | project-written |
| memory/ui-offscreen-probe.md | memory (feedback) | How to measure Qt widget behaviour with a throwaway offscreen probe app. | - | - | project-written |
| memory/ui-test-release-loops.md | memory (feedback) | Loop widget tests 25-40x on Release (a crash hid from 4/4 and Debug). | - | - | project-written |
| memory/qss-token-theming.md | memory (reference) | ThemeManager `@{token}` QSS system and QSS rules. | - | - | project-written |
| memory/ja-installed-terms.md | memory (feedback) | Japanese terms: shipped `.ts` strings decide, quote verbatim, measure first. | - | - | project-written |
| memory/build-laser-host-gotchas.md | memory (reference) | Build recipe (bat file), vcvars `&&` PATH trap, stale `laser_host.exe` holds the board. | - | - | project-written |
| memory/dialog-dismisser-trap.md | memory (project) | A process-wide dialog auto-clicker aborted the SDK's own homing dialog; keep RAII-scoped. | - | - | project-written |
| memory/laser-init-realmode.md | memory (project) | rc=5 HARDVER root cause: sim-mode init with a real board; init mode latches per process. | - | - | project-written |
| memory/ezd-sdk-docs.md | memory (reference) | Vendor SDK docs live in `components/ezdlib`; read rc table instead of guessing. | - | - | project-written |
| memory/ezcad-config-drift.md | memory (project) | Bundled EzCad config drifts from the run folder; diff before trusting board tests. | - | - | project-written |
| memory/mc-computer-link-frames.md | memory (reference) | MC 1C/3C sum-check ranges and silent-failure fields confirmed on a real PLC. | - | - | project-written |
| memory/qr-schema-is-data.md | memory (project) | QR schema JSON is persisted into saved config; new resource JSON does not reach saved machines. | - | - | project-written |
| memory/project-status.md | memory (project) | 82 KB phase-by-phase history (phases 1-19) with bench results, design decisions and many lessons. | - | - | project-written |

Notes: the three skills and the 7 agents are the only ECC-labelled content. `memory/no-delete-outside-root.md` duplicates `rules/no-delete-outside-root.md` (intentional: memory states the rule, rule file is auto-loaded). Memory frontmatter is `name / description / metadata{node_type, type, originSessionId, modified}`; `no-ui-screenshots.md` has only `metadata.type` (inconsistent), several have an empty `metadata:`.

---

## 2. Rules as atomic statements

Tag: [GENERIC] reusable in any project (possibly after naming parameters); [PROJECT] NichirinLaserMark-specific.

### (a) Roles, delegation, models
1. [GENERIC] The main assistant acts as project manager toward the human lead: plans, spec deltas, checkpoints and reports (memory/working-arrangement.md).
2. [GENERIC] The main assistant orchestrates sub agents in three roles - implementer, reviewer, tester - splits each task, checks results, integrates; it may code itself for a small fix, a tricky seam, or when an agent went wrong.
3. [GENERIC] Spawn sub agents whenever useful, no need to ask.
4. [GENERIC] Every sub agent at every nesting level runs `model: "sonnet"` unless the human names another model for that task; pass `model` explicitly on every Agent call (do not rely on inheritance or agent frontmatter); any prompt that lets an agent spawn agents must repeat this (memory/subagent-default-model.md). All 7 agent files carry `model: sonnet`.
5. [GENERIC] Agent briefs must carry the repo rules the agent cannot see: ASCII-only code, no source writes via PowerShell, comments cite tracked content only, no phase names outside history, no git writes (the orchestrator commits), no deletes outside the root, build scripts, the QtTest `_data` trap. (Project 2026-10-13 notes say a scratch "agent_rules.md" brief is reused.)
6. [GENERIC] Agents share ONE working tree and ONE build/bin output: run implementers sequentially or on disjoint files; never build in parallel.
7. [PROJECT] Worktree isolation does not work here because vendored component sources (qpb, mc_protocol clone) are untracked and absent in a worktree.
8. [GENERIC] The orchestrator owns verification: a task is done only on evidence it checked itself (build output, test totals, oracles) plus a reviewer pass on the diff.
9. [GENERIC] Tester briefs must request the Release-mode loop (>=25 runs; >=40 for the one suspicious slot), report crash counts, and treat any crash as a blocker.
10. [GENERIC] Reviewer/finder agents are report-only (cpp-reviewer, silent-failure-hunter, code-explorer, planner, type-design-analyzer, code-architect have no Write/Edit); only cpp-build-resolver has Write/Edit.
11. [GENERIC] Review verdict scale: Approve (no CRITICAL/HIGH) / Warning (MEDIUM only) / Block (any CRITICAL or HIGH); each finding needs `file:line`, a concrete failure scenario and the minimal fix; mark unconfirmed suspicions as such.
12. [GENERIC] `/plan`: run inline by default, delegate to `planner` only for large changes; never write code before explicit confirmation; end with "WAITING FOR CONFIRMATION".
13. [PROJECT] The human is addressed as "Project Leader" (never "the owner") in replies, plans, specs, docs, code comments, commit messages; technical "owner" (owner HWND, QObject owner, `@param owner`, init field) is not renamed. [GENERIC form: a configurable human-lead title.]
14. [PROJECT] The human writes Vietnamese: reply in Vietnamese, keep code/docs English ("Project Leader" may be used as is in Vietnamese). [GENERIC form: reply language vs artifact language.]

### (b) Git and identity
15. [PROJECT] Repo is local-only: never `git push`, never add or change a remote (enforced by guard-shell.ps1).
16. [PROJECT] Git is not on PATH: use the portable binary by full path `C:\DGB\build_packages\portable-git\cmd\git.exe` (appears in memory/git-local-repo.md, agents/cpp-reviewer.md, commands/cpp-review.md, skills/inherit-legacy-style).
17. [PROJECT] Commit identity `dev27 <de27@local>` in the repo LOCAL config (`user.name`/`user.email`).
18. [PROJECT] No AI trailer in commit messages (no Co-Authored-By, no "Generated with"); messages in English. (Conflicts with any harness default attribution; see section 7.)
19. [PROJECT] Repo-local `core.autocrlf=false` (portable git system config sets true) because golden/baseline files are compared byte-for-byte; `core.quotepath=false` for Japanese filenames. [GENERIC lesson: set autocrlf=false when byte-exact fixtures exist.]
20. [GENERIC] Commit only when the human asks or inside a workflow they requested; stage deliberately; check `git status` for stray outputs first. `/feature-dev` also says "do not commit unless the user asks".
21. [PROJECT] Each time work is ready ask "new commit or fold into the root commit?" - never assume (the lead went both ways).
22. [PROJECT] History was squashed to one root commit and old objects purged (reflog expire + gc --prune) with the lead's approval; the rule is that agent tooling leaves no trace in repo history.
23. [PROJECT] `.claude/` is ignored ONLY through the untracked `.git/info/exclude`; never put it in `.gitignore`.
24. [PROJECT] `.gitignore` deliberately does NOT ignore `*.dll/*.a/*.so` (vendor runtime must be tracked); `**/build/`, `product_release/`, `.vscode/` ignored; vendor `.pdb/.obj/Makefile*` re-included under `components/`.
25. [GENERIC] A vendored component that is its own git repo must have its git dir outside the folder (git silently ignores files inside a folder holding `.git`): measured in plan 19, recorded in a tracked build doc.
26. [GENERIC] Git does not lift the encoding rule; a mangled file can be restored with `git checkout -- <file>`, but prevention beats recovery.

### (c) Repo hygiene and docs policy
27. [GENERIC] Tracked files never reference `.claude/` or the Claude memory folders (no links, paths, file names, "see agent X", commit messages). `.claude/` may point at tracked docs, not the reverse.
28. [GENERIC] Do not copy `.claude/` content into tracked files to dodge the rule; if it matters, write it in the owning tracked doc in its own words after the lead agrees.
29. [GENERIC] Before finishing an edit to a tracked file, check the diff for `.claude` or `memory` paths.
30. [GENERIC] State each fact once, in its owning doc; other docs point to it (prefer a pointer over restating).
31. [GENERIC] Spec = what the system MUST do now: one file per capability (not per phase), stable requirement IDs (e.g. `QR-012`), never renumbered or reused (removed requirements are marked removed), invariants, config keys, acceptance (which test proves it), written from behaviour as built and verified (code + tests + bench), in English.
32. [GENERIC] Workflow for a new requirement: (1) request, untracked or taken from the backlog; (2) plan in `docs/history/plan/` (requirements restated in the project's own words, decisions, tasks, spec IDs to add/change); (3) spec first, lead reviews the spec delta before code; (4) code + tests (tests may name spec IDs); (5) close: CHANGELOG entry, plan closed, ADR if project-wide, backlog row deleted (IDs never reused), spec section 6 updated.
33. [GENERIC] A defect/gap found but not fixed in the current change goes to `docs/backlog.md` (and the owning spec's section 6), never to a new standalone bug file. Backlog rows `BL-nnn`, one line each, pointing at the detail.
34. [GENERIC] Requests are not tracked (`docs/_retired/`, excluded via `.git/info/exclude`); tracked docs never link to them; plans never quote a request verbatim.
35. [GENERIC] Phase boundary: plan/request phase names (`phase N`, `CP1/CP2`, plan-local `Dn`) appear ONLY in `docs/history/`; everything describing the current system (code, scripts, specs, module READMEs, rules docs, READMEs, ONBOARD, tests/README, uml/README) never mentions phases - use dates or changelog versions. CHANGELOG/ADR may link a plan as provenance but must read without knowing a phase number. The domain word "phase" for machine states is exempt.
36. [GENERIC] Code comments may cite only tracked repo content: source files/classes/functions/tests, ADR entries written `ADR Dn` (never bare `Dn`), spec requirement (file + ID), `docs/rules/*`, module README scope cards, `tests/README.md`, vendor material tracked under `components/` (cite the copy, not a URL).
37. [GENERIC] Forbidden in comments: plan/request phases and plan-local IDs, requests and `docs/_retired/`, `.claude/`/memory/agents/tooling, untracked or ignored paths (`build/`, `product_release/`, scratch) and machine-local absolute paths (except where a build file needs an environment-supplied tool path), external URLs.
38. [GENERIC] Write comments self-contained: behaviour, constraint and why, present tense; cite `ADR Dn` or a spec ID for the why. Never just delete a phase prefix (a leftover bare `Dn` silently points at the wrong ADR).
39. [GENERIC] Docs owners: Spec (what), Charter (why, English, in docs/spec), module README (organization + invariants for editors), ADR (why a project-wide choice), rules/runbooks (how to build/test/diagnose), manual (operator), CHANGELOG (by version/date, few lines), Backlog, Plans+history.
40. [GENERIC] Behaviour change without a spec update is a review finding (cpp-reviewer).
41. [GENERIC] Doxygen `/** */` headers per a tracked `doc_comment_style.md`; Doxygen warnings log must stay empty (project-status). `'\n'` in a Doxygen comment is a line-break command.
42. [PROJECT] No clang-format config: keep the formatting of the file you edit.
43. [GENERIC] Do not hard-code new absolute paths in `.pro/.pri`; local tool paths come from the environment / untracked `qmake/local.pri`.
44. [GENERIC] ADR skill: never renumber or rewrite an existing decision; to supersede, add a new D-item naming the replaced one; show the draft and append only after approval; phase-local decisions stay in the plan, only project-wide architecture goes to `architecture_decisions.md`.

### (d) Language and encoding
45. [PROJECT] Code, comments and log strings are English (UI Japanese is a translation matter).
46. [GENERIC] Source is ASCII-only (comments and strings): no em dash, bullet, section sign, arrows, multiplication sign, ellipsis, box-drawing, curly quotes. Use `-`, `section 4.1`, `->`, `x`, `...`, `# -----` / `// =====` banners. Check before every commit: `git grep -I -nP "[^\x00-\x7F]" ...` (no output = clean).
47. [PROJECT] ASCII exemptions: `<translation>` text in `app/translations/*.ts` (each `<source>` must stay ASCII; change source and code together, verify with lupdate on a COPY: "0 new"), vendored `components/`, Markdown docs, `uml/*.puml`.
48. [GENERIC] On a non-UTF-8 ANSI-codepage machine (CP932 here) never edit source with `Get-Content ... | Set-Content`/`Out-File`/`>`: use Edit/Write tools; if scripted, `[IO.File]::ReadAllText(p,[Text.Encoding]::UTF8)` / `WriteAllText(p, text, New-Object Text.UTF8Encoding($false))`. Edit with `replace_all` for bulk.
49. [GENERIC] Recovery from PS mangling: re-encode through CP932, decode as UTF-8, repair leftovers (each mangled `-`/arrow swallows the following space and returns as a stray `E`); verify by listing every non-ASCII code point.
50. [GENERIC] `.ps1` hook scripts must be pure ASCII (PowerShell 5.1 reads a BOM-less script in the ANSI code page); hooks tolerate a BOM on stdin.
51. [PROJECT] Every `.pro` passes `/utf-8` (`msvc: QMAKE_CXXFLAGS += /utf-8`); missing `/utf-8` gives spurious C4819/garbage errors on a CP932 machine.
52. [PROJECT] Japanese: the shipped strings in `app/translations/NichirinLaserMark_ja_JP.ts` decide the term, not merit ("an installed term beats a better term"); look up `docs/rules/ja_glossary.md` first; installed terms include 刻印 (not マーキング), 品番 (not 品種), レッドライト, ハッチング, 読み取り, インデックス, トリガー, スキャナー; phase names on screen are 待機/手動/実行/再接続.
53. [GENERIC] Quote application messages verbatim from the `.ts`, never re-translate; count with an XML parse before claiming a term dominates; watch for entries marked translated with an EMPTY string (lrelease counts them finished, renders blank).
54. [GENERIC] lupdate's same-text heuristic can propose replacing installed terms: check a renamed row against its own `vanished` entry, never accept blindly.
55. [GENERIC] Doxygen `\ref label。` with a Japanese full stop silently breaks; gate with 0 warnings.

### (e) File and process safety
56. [GENERIC] Outside the project root never delete, move away, overwrite-to-empty or clean any file/folder (other projects, build_packages, Qt/VS installs, `%USERPROFILE%` incl. `.claude` and user memory, `%TEMP%`, session scratchpad) unless the lead explicitly asked for that specific deletion in the current conversation. Covers every mechanism (Remove-Item/rm/del/rmdir, Move-Item out, `[IO.File]::Delete`, `robocopy /MIR|/PURGE`, `git clean` on another repo, uninstallers, scripts).
57. [GENERIC] That includes files the agent itself created outside the root (temp scripts, scratch output): leave them and list them for the lead. (The project later records "scratchpad cleaned with PL permission".)
58. [GENERIC] If something outside the root should go: name exact paths and why, wait for yes. A tool that might delete as a side effect (a clean step, `/MIR`): check its target first; ask if it reaches outside.
59. [GENERIC] Inside the root: look at the target before deleting, prefer reversible actions.
60. [GENERIC] Deleting a user-level memory file needs a yes; until then mark it obsolete in its content (both copies).
61. [PROJECT] Before any manual laser run kill leftovers: `Get-Process EzCad2,laser_host -ErrorAction SilentlyContinue | Stop-Process -Force` (a stale `laser_host.exe` holds the board -> rc=1 LMC1_ERR_EZCADRUN). [GENERIC form: kill stale child processes that hold a device before hardware tests.]
62. [PROJECT] Never touch the `LICENSE_BYPASS_FOR_DEV` line (working-arrangement brief). Never copy license secrets (`components/rockey4nd_license/release_constants/runtime_constants.h`) into logs/docs/other files.
63. [GENERIC] Hooks must never block because their own input could not be parsed (fail open); guard hooks block only specific bad patterns.
64. [GENERIC] External input (PLC words, QR text, .ezd files, settings JSON) is untrusted: validate length/range, fail the whole operation rather than write partial results.
65. [PROJECT] A failure while marking must stop the mark and surface an error; never retry firing silently. Code that moves the axis or fires the laser must not run in automated tests unless explicitly opt-in (`NLM_PROBE_HOMING`, `NLM_PROBE_MARK` never enabled without the owner).

### (f) Memory (double sync)
66. [PROJECT] Two memory folders must stay identical at all times (same files, same bytes, incl. MEMORY.md): primary `C:\Users\BAO\.claude\projects\c--DGB-Project-NichirinLaserMark\memory` and backup `C:\DGB\Project\NichirinLaserMark\.claude\memory`. [GENERIC concept: a second copy beside the project survives a reset of the user-level Claude folder.]
67. [GENERIC] Write/Edit in either folder is mirrored by the PostToolUse hook; in the session that installed the hook, mirror by hand.
68. [GENERIC] Deletes and renames are NOT covered by the hook: apply them to both folders by hand (user-level one needs the lead's yes first).
69. [GENERIC] When in doubt compare both folders (file list + SHA-256) and fix drift before ending the task.
70. [GENERIC] Never reference the memory backup (or anything under `.claude/`) from tracked files.
71. [GENERIC] Memory file format: frontmatter (name, description, metadata.type = user|feedback|project|reference), body with **Why** / **How to apply**, `[[wikilinks]]` to related files; index `MEMORY.md` holds one line per file.

### (g) C++/Qt quality and testing
72. [PROJECT] C++17 only (no 20/23: MSVC2019 + Qt 5.15 kit); `auto` when type obvious; `constexpr` constants; Qt types at Qt boundaries, std inside pure logic.
73. [PROJECT] Ownership: Qt parent/child default for QObjects; `std::unique_ptr/make_unique` for non-QObject heap; no raw owning pointer without parent; `deleteLater()` for QObjects with pending events; no malloc/free.
74. [PROJECT] Naming: namespace `vc::`; types PascalCase; functions camelCase; members `m_`; constants `kPascalCase`; files `snake_case.h/.cpp` registered in the owning module `.pri`.
75. [PROJECT] Includes module-qualified from `src/` (`device/laser/...`); no `..`; no `src/` prefix; lower modules never include higher ones (enforced by `tests/architecture_contract_test`). Module levels: core(0) -> device, license(1) -> runtime, marking(2) -> ui -> app/.
76. [PROJECT] No exceptions in the codebase: failures are `bool`, rc/enum, `std::optional`, or a signal, then logged with context. [GENERIC: pick one error strategy and write it down.]
77. [GENERIC] Never collapse a failure into a default value without logging it; SDK rc values keep their meaning end to end.
78. [GENERIC] Rule of Zero; if one of dtor/copy/move is defined, define or `=delete` all five; small types by value, large by `const&`; Qt containers pass by `const&` to avoid detach; tie every resource to an object lifetime (RAII).
79. [PROJECT] Devices are driven cross-thread only through `runtime/*Runner` via queued signals; types crossing a queued connection need `Q_DECLARE_METATYPE` + `qRegisterMetaType` (an unregistered enum class is silently dropped); timers that must follow `moveToThread` are parented; no DeviceManager/Factory/Registry (two fixed devices owned by `MarkingController`).
80. [GENERIC] In polled loops react to a change by comparing STATE, not by catching an EDGE (an edge that arrives while busy is lost); a latched result must not be cleared by an unrelated event.
81. [GENERIC] New JSON/config keys are optional on load; `verify()` must not start rejecting configs already saved on installed machines; new IO keys must not become mandatory.
82. [GENERIC] Guard external-input arithmetic (word counts, indices, lengths); initialize every member; watch lambda captures on queued connections/timers and thread-vs-data destruction order; `reinterpret_cast` only at the SDK/GDI boundary with the layout verified; no strcpy/strcat/unbounded sprintf.
83. [GENERIC] A `QThread`/parented thread must be waited unbounded; a bounded `wait()` that times out deletes a running thread.
84. [PROJECT] `MarkingController::config()` returns a deep COPY: a pointer into it dangles at once.
85. [PROJECT] Colours/fonts in QSS go through `ThemeManager` `@{group.token}` placeholders (resolved before `setStyleSheet`); global `dark.qss/light.qss` use tokens + class/property selectors only, no `#objectName` rules, prefer tokens over hex; per-widget/per-form QSS in its own file (may use `#objectName`), loaded via `reloadStyleSheet()`, must be added to the `.qrc`; an unknown token is left verbatim (Qt drops the rule or the whole sheet) even inside `/* comments */`; painted colours fall back to the active `QPalette` and match severity to state tokens; new `ui/` widget files must be registered in `src/ui/ui.pri`; promoted widgets must be at GLOBAL scope.
86. [GENERIC] QSS/files on CP932: read/write with explicit UTF-8.
87. [GENERIC] Do not screenshot to verify UI when the human reviews UI themselves ([PROJECT] preference dated 2026-07-09); instead measure with an offscreen probe app (`QT_QPA_PLATFORM=offscreen`, includes module .pri not app.pri, writes to a QFile, `QTest::mouseClick` on the widget `QApplication::widgetAt()` names, address QListWidget rows via `itemWidget(item(i))`, flush `DeferredDelete`).
88. [GENERIC] Run every widget/UI QtTest 25-40x on a RELEASE build (plus offscreen) before calling it green; a use-after-free crashed 30-50% of Release runs but passed 4/4 and Debug.
89. [GENERIC] Close-out of a change touching a shared module: build EVERY test project that includes that module; report each test not run and why; never report as passing.
90. [GENERIC] Capture QtTest output with `-o file,txt` (Qt logs go to stderr); delete the old report/exe before running (a stale report/exe once read as a pass); a QtTest slot whose name ends `_data` is silently NOT run - check `-functions`.
91. [GENERIC] Test-writing: pin wire formats/register layouts with LITERAL expected values (not a round-trip through our own codec); a regression test must be shown to FAIL without the fix; fakes injected through `create*Device()` seams with distinct failure texts; prefer recording what was emitted over reasoning about the mechanism; assert that requests REACH the device (the fake needs an override because a no-op base class passes either way).
92. [PROJECT] Run BOTH `laser_host` oracles (geometry `capture_baseline.ps1 -Compare` and `laser_host_protocol_test`) after ANY change to `laser_host/` or `src/device/laser/mark_ezd_controller.*`; the diff is the evidence; re-baseline only with the lead's agreement. Baseline contents must stay placeholder-free (date-bearing content breaks at midnight). [GENERIC pattern: golden/oracle gating for behaviour-preserving refactors, keep the pre-refactor BINARY.]
93. [PROJECT] `laser_marker_test` needs the board ATTACHED; the oracles need it OFF; suite cannot be all-green in one sitting.
94. [GENERIC] Lessons recorded in project-status that act as rules: measure instead of reasoning (instrument first, three rounds of plausible stories failed); a feature "request never issued fails silently"; a branch that decides not to act must say so where the record is kept (not only the status bar); anything set on the SDK before a document load is erased by the load; compare deployed binary timestamps, not the one just built (post-link copy only fires when the app relinks); test scripts must delete the old exe before building; a green test that still passes with the code deleted is worthless; verify 32-bit by PE header machine word 0x014C.

### (h) Build and environment
95. [PROJECT] 32-bit is mandatory (`MarkEzd.dll` is x86, bound at runtime via LoadLibrary, never linked); never use `msvc2019_64`/`vcvars64`.
96. [PROJECT] Toolchain: VS2019 Community `vcvarsall.bat x86` at `C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\`, Qt `C:\Qt\5.15.2\msvc2019\bin`, jom `C:\Qt\Tools\QtCreator\bin\jom\jom.exe` (fallback nmake).
97. [GENERIC] Never chain `call vcvars x86 && set PATH=...;%PATH% && jom` on one line (cmd pre-expands `%PATH%`); put the steps in a `.bat` file and run `cmd /c file.bat`.
98. [GENERIC] The `'vswhere.exe' is not recognized` line is benign.
99. [PROJECT] Since phase 18 (ADR D13): build the WHOLE tree from the root `NichirinLaserMark.pro` (subdirs deploy, laser_host, app, tests) in `build\cli\<cfg>` (`qmake <root>.pro -spec win32-msvc "CONFIG+=<cfg>"` + jom); every exe lands in `build\bin\<debug|release>\`; run tests from there with `QT_QPA_PLATFORM=minimal`. Machine paths in untracked `qmake/local.pri` (template `local.example.pri`). Shared settings `qmake/common.pri`. (The agent/command files still describe the OLD layout; see section 7.)
100. [PROJECT] After adding a SUBDIRS entry run `jom qmake_all` first (subdir Makefiles are generated only "if not exist Makefile"); `deploy` must be a `.depends` of the linkers (jom ran xcopy in parallel -> "Sharing violation").
101. [PROJECT] `license.pri` links `legacy_stdio_definitions.lib` (LNK2019 `__imp__sprintf`); `gdi32` in `device.pri`, not per `.pro`; `windeployqt` PATH uses `$$[QT_INSTALL_BINS]` property.
102. [PROJECT] A stale `EZCAD` bundled config drifts from the run folder: before trusting any board-attached test, diff `plug/markcfg7` + `EZCAD.CFG`; after tuning in EzCad2 copy back into `components/ezcad/`.
103. [PROJECT] Debug: pre-existing LNK4098 MSVCRT on license-linked targets (vendor lib); transient "Sharing violation" when the lead's release app is running.
104. [GENERIC] cpp-build-resolver stop conditions: same error after 3 attempts, a fix introduces more errors than it resolves, or the fix needs an architectural change; surgical fixes only; never suppress warnings with `#pragma` without approval; never change signatures unless necessary; one fix at a time; read the FIRST error (later ones cascade).

### (i) Workflow / pipeline
105. [GENERIC] `/plan` steps: restate requirements (own words); ground in repo (read ONBOARD, relevant spec, module READMEs; capture Spec/Naming/Error handling/Threading/Config/Tests patterns with `file:line`; if no similar code, say so); spec delta with IDs; tasks (exact files, dependencies, risk); verification (builds, tests naming spec IDs, oracles, bench-only items); close-out (CHANGELOG, ADR); present and WAIT. Plan format: Requirements restated / Decisions needed / Spec delta / Patterns to mirror / Tasks T1.. (Files, Action, Verify, Risk) / Verification / Close-out / Risks. Save to `docs/history/plan/` only if asked.
106. [GENERIC] `/feature-dev` pipeline: (1) discovery, (2) code-explorer, (3) clarifying questions and wait, (4) code-architect blueprint and wait for approval, (5) spec first and wait for the lead to review the spec delta, (6) implement in small buildable slices + QtTest case + build every affected project + do not commit, (7) cpp-reviewer (+ silent-failure-hunter for device/PLC/laser paths), fix critical/high, report test totals, list bench checks, (8) close-out (CHANGELOG, ADR, summary).
107. [GENERIC] code-architect: study patterns first, simplest architecture, no speculative abstractions unless the repo uses them; blueprint per component (path, purpose, interfaces, deps, data-flow role); build order types -> core -> integration -> UI -> tests -> docs.
108. [GENERIC] code-explorer: entry point discovery, execution path tracing, layer mapping, pattern recognition, dependency documentation; note each thread boundary.
109. [GENERIC] type-design-analyzer: evaluate encapsulation, invariant expression, usefulness, enforcement; per type scores for four dimensions + suggestions. Not wired into any command (see issues).
110. [GENERIC] Plans with phases: each phase independently deliverable (MVP -> core -> edge cases -> optimization). Plans carry CP1 (code review) / CP2 (owner bench) checkpoints; hardware-only verification is listed as a bench item, never claimed as tested.
111. [GENERIC] Behaviour-preserving refactors: build the oracles FIRST, then thin slices with both gates after every task; keep the pre-refactor binary.
112. [GENERIC] Adversarial multi-agent review workflows were used (5-agent, 43-agent); every confirmed finding was fixed and tests shown to fail without the fix.
113. [GENERIC] ADR skill triggers: "record this decision", "ADR this", choosing between frameworks/patterns, "why did we choose X?" (read first); suggest an ADR, never auto-create.
114. [GENERIC] inherit-legacy-style: one conflict question at a time; weak signal (minority <5% and <10 occurrences) auto-resolved to majority with minority going to DONTs; strong signal (near-even split or semantic fork) grilled; small project (<=~50 files) "3 vs 2" is not a majority; never overwrite old rules in incremental mode (append dated evolution log); never copy bugs from exemplar files.

### (j) Project-domain (laser, PLC, EzCad, MC frames)
115. [PROJECT] Laser init must be REAL mode (`testMode=false`) whenever a board may be attached (`LaserMarkerConfig::testMode` default false); sim init (rc=0 no board / rc=5 board present) lives in the separate process `tests/laser_sim_test/`; a host must never sim-init before a real-init within its own lifetime (init mode latches per process; changing mode needs an app restart).
116. [PROJECT] rc=5 `LMC1_ERR_HARDVER` is mode-vs-hardware mismatch, not firmware mismatch; read the rc table in `components/ezdlib/MarkEzd_DLL_Reference.md` section 4 and name the constant (no `LMC1_ERR_*` enum in `src/`; do not describe rc empirically).
117. [PROJECT] `DialogDismisser` (matches `#32770`, clicks first button) must be a short RAII scope around `lmc1_Initial`/close/teardown only; process-wide it aborted the SDK's homing wait dialog (rc=140, low mark power); check what would click any new SDK dialog.
118. [PROJECT] Read `docs/rules/laser_sdk_runbook.md` before touching laser init, the host or a laser connect failure (two hard rules + symptom table); before reading `components/ezdlib` docs, do not guess.
119. [PROJECT] Laser SDK bound at runtime inside `laser_host` (out-of-process, line-delimited JSON over stdin/stdout); new host command = one handler + one table line in `command_handlers`; new rc values must not reuse ones the protocol golden pins (-2..-7 taken; -112/-113 used for preview).
120. [PROJECT] `lmc1_RedLightMarkByEnt`, `lmc1_Reset` (returns int not double), `lmc1_SetPenParam2` (extra double) are known SDK doc discrepancies (project-status).
121. [PROJECT] MC computer-link: sum check = low byte of the character sum as two UPPER-case hex chars before CR+LF; request range = frame ID + access route + request data; response range = same + data + ETX; ACK (no data) and NAK responses carry NO sum check; `plcSeries` (iQ-R widens device name, address and sub-command) and non-standard baud (56700) produce accepted-but-wrong frames; shipped defaults 57600 8N1, sum check ON, format 4, Q series; diagnose with a read-only batch-read (`0401`) probe, never a write.
122. [PROJECT] QR parser layout is data in `resrc/qr/qr_default_schema.json` but PERSISTED into saved config (`MarkingConfig.qrCodeReader.schema`); a new resource JSON does not reach a machine that already saved a schema; word count per field is `ceil(len/2)`; QR IO keys are a separate key set (not mandatory in `verify()`).
123. [PROJECT] Hardware sequence gotchas: `MarkerStop`/`MarkerReset` must be PLC-sourced (laser-board inputs cannot fire mid-mark); pins are laser-board BIT indices 0..15; registers: low word at the lowest D address (Mitsubishi); Raw QR field forwarded verbatim with one trailing space if odd length.
124. [PROJECT] `components/ezdlib/MarkEzd_DLL_Reference.md` is the vendor reference (tracked copy); comments cite that copy, not URLs.
125. [PROJECT] Secrets: license secrets only in `runtime_constants.h`.
126. [PROJECT] Build/test env variables: `NLM_MARK_TRACE` (0 in the app env disables), `NLM_PLC_TRACE=1`, `NLM_LASER_HOST`, `NLM_PROTO_UPDATE=1`, `NLM_TRACE_*`, `NLM_PROBE_*`, `QT_QPA_PLATFORM=minimal|offscreen`.

---

## 3. Hooks in detail

### settings.json (registration)
```
PreToolUse  matcher "PowerShell|Bash"  -> powershell -NoProfile -ExecutionPolicy Bypass -File C:/DGB/Project/NichirinLaserMark/.claude/hooks/guard-shell.ps1  (timeout 10)
PostToolUse matcher "Write|Edit"       -> powershell -NoProfile -ExecutionPolicy Bypass -File C:/DGB/Project/NichirinLaserMark/.claude/hooks/sync-memory.ps1 (timeout 10)
```
Uses Windows PowerShell 5.1 (`powershell`, not `pwsh`). Absolute project path hard-coded (not `$CLAUDE_PROJECT_DIR`). No `permissions`, `env`, `model`, `UserPromptSubmit`, `Stop`, `SessionStart` entries.

### hooks/guard-shell.ps1 (PreToolUse)
- Input: JSON on stdin, reads `tool_input.command` (both the PowerShell and Bash tools use this field). Sets `[Console]::InputEncoding` to UTF-8 no BOM, strips a leading U+FEFF, `ConvertFrom-Json`. Any parse failure -> `exit 0` (fail open). Empty command -> `exit 0`.
- Rule 1 (BLOCK, exit 2): regex `(?i)\bgit(\.exe)?["']?\s+(push|remote\s+(add|set-url))\b` -> stderr "Blocked by .claude/hooks/guard-shell.ps1: this repo is local-only - never git push and never add or change a remote."
- Rule 2 (BLOCK, exit 2): source extensions `\.(cpp|h|hpp|ui|pro|pri|qrc|qss|ts)\b`. Blocks if `(Set-Content|Add-Content|Out-File)` followed (non-greedy, no `|` or `;` in between) by such a filename, or a `>`/`>>` redirection to a token ending in such an extension. Message tells the user to use Edit/Write or `[IO.File]::WriteAllText` with `UTF8Encoding($false)`.
- Everything else: `exit 0` (allow). It never "asks" (no JSON `permissionDecision`), only exit-2 + stderr, which the harness feeds back to Claude.
- Hard-coded: the regexes/extension list, the repo-local-only policy, and the text of the messages (names the hook path). No project path inside the script itself.
- Weaknesses:
  - Rule 1 misses `git -C <dir> push`, `git --git-dir=.. push`, `git -c k=v push`, `git remote rename|remove`, `git config remote.origin.url`, `git push` hidden in a variable/alias/script file, `gh` CLI. False positives: the text "git push" inside a commit message, echo, or search string will block the call.
  - Rule 2 misses path held in a variable or defined in a previous statement (`$p = 'a.cpp'; ... | Set-Content $p`), aliases (`sc`, `ac`), `Tee-Object`, `New-Item -Value`, `Copy-Item` of a bad file, Bash `sed -i`, `tee`, `python -c`, heredoc to a file via `cat >` (the redirect is caught only when the target literally ends in the extension). False positives: `->`/`>` followed by text ending in `.h`/`.ts` inside quoted strings (e.g. `"a->b.h"`), comparison redirections. `.ps1/.bat/.md/.json/.gitignore` are not covered although the ASCII rules mention them; the hook list differs from the lists in `rules/code-comments.md` and `memory/no-unicode-symbols-in-code.md`.
  - It does not enforce the other safety rules (delete outside root, license-bypass line, ASCII-only content, Stop-Process, commit trailer): those are advisory only.
  - Cost: starting `powershell.exe` 5.1 on every Bash/PowerShell tool call (typically a few hundred ms), within a 10 s timeout.
- Must stay pure ASCII (PS 5.1 reads BOM-less script in CP932).

### hooks/sync-memory.ps1 (PostToolUse)
- Input: same stdin JSON, reads `tool_input.file_path`, resolves with `[IO.Path]::GetFullPath`.
- Hard-coded paths: `$primary = C:\Users\BAO\.claude\projects\c--DGB-Project-NichirinLaserMark\memory`, `$backup = C:\DGB\Project\NichirinLaserMark\.claude\memory`.
- Logic: for each of the two directions (primary->backup, backup->primary), if the written path starts with the source dir (case-insensitive, with trailing `\`), compute the relative path, create destination subdirs as needed, `[IO.File]::Copy($full,$dest,$true)` (overwrite). Stops after the first match.
- Output: nothing on success; on failure a line to stderr "sync-memory: mirror failed: <msg>". Always `exit 0`, so it never blocks.
- Weaknesses: no delete/rename mirroring (stated); only Write|Edit (not NotebookEdit/MultiEdit, not shell-made changes); machine/user specific primary path (`BAO`; the current machine user is not BAO); last-writer-wins with no conflict detection or hash check; a failed copy is only a stderr line (invisible unless verbose); if `$path` is outside both folders it silently does nothing; works only for the single hard-coded project.

### Conceptual comparison with a Node-based guard
- ECC's own hooks are all `node -e`; the owner forbade Node, so these two exist instead.
- Gained by standardizing on ONE runtime across the kit:
  - One JSON/regex/config implementation shared by every hook (patterns, protected dirs, extensions, ASCII list as data in one `guard-config.json` instead of copied constants).
  - Consistent, tested UTF-8 handling: the PS 5.1 scripts must stay ASCII and sanitize BOM/codepage by hand; Node reads stdin as UTF-8 by default and has no CP932 trap.
  - Easier unit tests, cross-platform use, structured output (`hookSpecificOutput.permissionDecision` allow/ask/deny) and faster process start than `powershell.exe` 5.1 (the cost applies to every shell call).
  - Reuse of the large ECC hook library.
- Lost / traded:
  - Zero-install: Windows PowerShell 5.1 ships with the OS, Node does not (the owner's explicit constraint).
  - The project's own scripts (`run_all.ps1`, `capture_baseline.ps1`, build scripts) are PowerShell anyway; PowerShell has a real language parser (`System.Management.Automation.Language.Parser`) that would allow AST-level command analysis, which regex-on-text cannot do.
  - Staying PowerShell 5.1 keeps the CP932 pitfalls; moving to `pwsh` 7 (UTF-8 default) fixes most of them but must be installed.
- Suggested kit rule: pick one runtime per kit, make hook behaviour data-driven (JSON config + parameters in section 6), share a small stdin/BOM/encoding preamble, and add an `ask` path instead of only block/allow.

---

## 4. Agents, commands and skills in detail

All 7 agents begin with the same "Prompt Defense Baseline" block (6 generic bullets, ~1 KB each, duplicated 7 times; memory says stripping it was denied by the permission classifier). All use `model: sonnet`.

### Agents
| Agent | Role | model | tools | Must / must not | Output |
|---|---|---|---|---|---|
| code-architect | Feature blueprint from existing patterns | sonnet | Read, Grep, Glob, Bash, PowerShell | Must: analyze patterns, simplest design, no speculative abstractions, build order types->core->integration->UI->tests->docs; respect layering (architecture_contract_test), register files in module `.pri` (never root `.pro`), runners only, no DeviceManager/Factory/Registry, optional config keys, one handler + one table line per host command, new rc must not reuse golden ones, tests under `tests/<name>/` (+`run_all.ps1` when no hardware), headers per `doc_comment_style.md`. Read ONBOARD.md + module READMEs first. | Markdown: Design Decisions / Files to Create (table) / Files to Modify (table) / Data Flow / Build Sequence |
| code-explorer | Trace existing features | sonnet | Read, Grep, Glob | Must: start from ONBOARD.md + module READMEs, know module levels core(0)->device,license(1)->runtime,marking(2)->ui->app, `laser_host` = separate exe over JSON stdio, note every thread boundary (Runner queued signals). Read-only (no Bash). | Entry Points / Execution Flow / Architecture Insights / Key Files (table) / Dependencies / Recommendations (Follow/Reuse/Avoid) |
| cpp-build-resolver | Fix compile/link/moc/qmake errors | sonnet | Read, Write, Edit, Bash, PowerShell, Grep, Glob | Must: 32-bit only; build through a `.bat` in the scratchpad run with `cmd /c`; fix FIRST error; rebuild every project compiling shared code; stop after 3 failed attempts / fix causes more errors / needs architectural change. Must not: refactor, add `#pragma` warning suppression without approval, change signatures unnecessarily, use Get/Set-Content on sources, hard-code absolute paths in .pro/.pri. Contains a common-error table (LNK2019, staticMetaObject, `__imp__sprintf`, C4819, C2027, C1083, promoted widget scope, C2664). | `[FIXED] file:line / Error / Fix / Remaining errors` and final `Build Status: SUCCESS/FAILED | Errors Fixed: N | Files Modified | Exe machine: 0x014C (x86)` |
| cpp-reviewer | Senior C++/Qt review, report-only | sonnet | Read, Grep, Glob, Bash, PowerShell | Must: diff with portable git, read module README scope cards, read callers not just the hunk, do NOT edit. Priorities: CRITICAL memory/lifetime + error propagation (rc ignored, latched result cleared); HIGH Qt threading/signals (affinity, metatype, unparented timers, edge vs state, QSignalBlocker loops) and project rules (layering, .pri registration, no DeviceManager, SDK runtime-bound, set-before-load erased, optional config keys, English, Doxygen, comment-citation rule, behaviour change without spec update); MEDIUM const/copies/reserve/function length >50 lines/nesting >4/`using namespace` in headers/C casts. | Findings with `file:line`, failure scenario, minimal fix; verdict Approve / Warning / Block |
| planner | Plan complex features/refactors | sonnet | Read, Grep, Glob | Must: read ONBOARD + spec + module READMEs; restate requirements in own words, spec delta, CHANGELOG/ADR, bench (CP2) items listed explicitly; respect layering/.pri/Runner/optional keys/oracles. Generic ECC sections kept (Sizing and Phasing Phase 1-4, Red Flags). | Markdown "Implementation Plan": Overview / Requirements / Architecture Changes / Implementation Steps (Phase 1.., Action, Why, Dependencies, Risk) / Verification (Builds, QtTest, Oracles, Bench CP2) / Risks / Success Criteria. NOTE: differs from the format in commands/plan.md |
| silent-failure-hunter | Find swallowed errors | sonnet | Read, Grep, Glob, Bash, PowerShell | "Zero tolerance". Targets: ignored rc/bool/end codes (rc converted to string/bool too early; QProcess/QTcpSocket/QFile errors unchecked), empty/over-broad catch, dangerous fallbacks, lost signals/events (missing qRegisterMetaType, request rejected while busy host rc=-3 dropped, consumed edge), inadequate logging (status bar only), missing timeouts. Report only. | Per finding: location, severity, issue, impact scenario, fix recommendation; unconfirmed marked |
| type-design-analyzer | Type design review | sonnet | Read, Grep, Glob | Generic ECC, no project context. Criteria: encapsulation, invariant expression, usefulness, enforcement. | Per type: name/location, scores for four dimensions, overall assessment, improvements |

### Commands
- `/cpp-build [app | laser_host | tests/<name> | blank]` (frontmatter `description`, `argument-hint`, uses `$ARGUMENTS`): invokes **cpp-build-resolver**. Blank target = decide from the change which projects compile the touched files (app, laser_host, every test including the module `.pri`). Steps: build 32-bit (vcvars -> qmake -> jom via .bat), fix first error and repeat, stop after 3 failures or architectural change, report errors fixed / files / exit code / x86 `0x014C`. Rules: build `laser_host` first then app, confirm timestamp of the DEPLOYED `laser_host.exe`; green build is not a passing test; no Get/Set-Content on sources. Related: /cpp-review, `docs/rules/build_and_verification.md`.
- `/cpp-review [paths | --cached | blank]`: invokes **cpp-reviewer** on the scope (default uncommitted changes via portable git `diff`); for device/PLC/laser paths also runs **silent-failure-hunter** and merges findings. Output: findings CRITICAL/HIGH/MEDIUM with `file:line`, scenario, fix; verdict Approve/Warning/Block; report only, no edits unless asked. Related: /cpp-build, skill cpp-coding-standards.
- `/feature-dev` (description only): chains **code-explorer** (step 2) -> **code-architect** (step 4) -> spec update (step 5, `docs/spec/`, lead reviews delta) -> implement (step 6, uses `/cpp-build` and tests, no commit) -> **cpp-reviewer** (+ **silent-failure-hunter**) (step 7) -> close-out CHANGELOG/ADR (step 8). Waits for the user at steps 3, 4, 5.
- `/plan [feature | request file]`: runs inline; optionally **planner**. Input modes: request file (untracked), free text, empty -> ask. Steps listed in rule 105. Ends with "WAITING FOR CONFIRMATION". After planning suggests `/feature-dev`, `/cpp-build`, `/cpp-review`.
- Not chained by any command: **type-design-analyzer** (only invokable manually).

### Skills
- **architecture-decision-records** (origin ECC, project-bound by override). Trigger: "record this decision", "ADR this", choosing between alternatives, "we decided to...", "why did we choose X?". Steps: identify decision; gather context; document alternatives; state consequences; assign number; show draft; write only after approval; update index. Local override (top of file) replaces `docs/adr/NNNN-*.md` with D-items in `docs/architecture/architecture_decisions.md` (`### D<N> - <Title> (<who/when>)`), forbids creating `docs/adr/`. The generic part (Nygard format, lifecycle proposed->accepted->deprecated/superseded, do/don't) is portable; only the override block is project-bound. Body still contains the unmodified `docs/adr/` workflow (contradiction, see issues).
- **cpp-coding-standards** (origin ECC). Trigger: writing/reviewing C++. Content: Core Guidelines digest (P, I, F, C, R, ES, E, Con, CP, T, SL, Enum, SF/NL, Per) with DO/DON'T code and a closing checklist. Mostly portable; overridden by the "Project overrides" block (C++17 only, no exceptions, Qt ownership idiomatic, QtTest, no clang-format). Several parts contradict the project (exceptions section E.*, concepts T.10, `underscore_style` naming with trailing `_` members versus the project's `m_`/camelCase, C++20 concepts).
- **inherit-legacy-style** (origin community; frontmatter `allowed-tools: Read, Glob, Grep, Bash, Edit, Write, AskUserQuestion`). Full description:
  - Purpose: prevent AI style drift on a hand-written legacy codebase by scanning for implicit conventions, resolving conflicts with the operator one at a time, and writing an enforceable rules file. Language/framework-agnostic.
  - Triggers: user types `/inherit-legacy-style`; mentions onboarding AI onto a legacy project; worries about AI "drifting"; wants unwritten rules codified.
  - Prerequisites (local): portable git by full path, read-only commands only.
  - Local adaptation (NichirinLaserMark): the output file is `.claude/rules/legacy-style.md` (local-only) instead of repo-root `.ai-style-rules.md`; `.claude/rules/*.md` are auto-loaded, so no hook, never write CLAUDE.md, never touch settings.json hooks; existing written conventions win (`ONBOARD.md`, module READMEs, `docs/rules/doc_comment_style.md`, `.claude/rules/cpp/*.md`) and only unstated conventions are recorded; source scope `*.cpp *.h *.ui *.pro *.pri` under `src/ app/ laser_host/ tests/`, skip `components/`, `temp_codebase/`, build folders.
  - Step 0 auto-detect: rules file absent -> Branch A (first-time full scan); present -> Branch B (incremental sniff). Announce the mode in one line; never ask the user to pick.
  - Branch A: (1) measure scale via `git ls-files` count and choose tier: Small <=~50 files full close read; Medium 50-500 infra full read + sample 2-3 per dimension for business layer; Large >~500 strict sampling with budget cap, `--stat` first. (2) Scan 4 dimensions: File Anatomy (declaration order), State & Control Flow (naming of async state/flags), Infrastructure (where cross-cutting utils live), Error Handling (try/catch vs result return, null-check habits). (3) Signal threshold: weak signal (minority <5% AND <10 occurrences) auto-suppressed (majority wins, minority to DONTs); strong signal (near-even split or semantic fork on a core dimension) grilled; small project exception: "3 vs 2" is not a majority. (4) Grilling Protocol: exactly one question at a time, with evidence from two paths and four options (1 follow X, 2 follow Y, 3 this is evolution - update rules, 4 I have a new rule); suspend until answered. (5) Generate the rules file with three mandatory sections: [Golden Files] (real exemplar paths + what they show), [Naming & State-Control Rules] (checkable), [DONTs]; header must carry commit fingerprint + scale tier. (6) Hook step skipped locally (original: offer soft/hard CLAUDE.md hook).
  - Branch B: read existing rules (and fingerprint hash -> `git diff <hash> HEAD --stat`), `git log -3 --stat`, for huge diffs `--stat` + sample; compare new code with rules, grill conflicts, append `### [YYYY-MM-DD] Style Evolution Log` (never overwrite).
  - Per-turn enforcement: when rules are in context every code-writing task opens with a compliance declaration naming the exemplar followed and DONTs avoided.
  - Anti-patterns: skipping scale measurement, stacking questions, overwriting old rules, defaulting to a hard hook, judging syntax/tech quality (meta-architecture only), copying bugs from exemplars.
  - Portability: the generic core (steps, tiers, thresholds, grilling) is fully portable; project-bound parts are the local adaptation block, the portable git path and the source-scope globs. The skill has NOT been run in this folder (no `rules/legacy-style.md` exists). The skill's body still talks about CLAUDE.md hooks, which contradicts the local "no hook" decision.

---

## 5. Docs structure (rules/docs-structure.md + memory/docs-restructure.md)

Decided by the owner 2026-10-07; done and squashed into the root commit. Result: 13 specs (602 requirements) in `docs/spec/` + index `docs/spec/README.md`; `CHANGELOG.md`; `docs/backlog.md`; ~2700 comment lines de-phased; 10 phase-named tests renamed; UML de-phased.

Folders and files:
- `docs/spec/<capability>.md` - one per capability; requirement IDs (`QR-012`, `PLC-061`, `RUN-063`, `PART-056`, ...) stable and never reused; sections include invariants, config keys, acceptance/"Verified-by" (test that proves it) and a **section 6** listing open questions, doc-vs-code contradictions, owner decisions (the backlog points at section 6). During a plan, a delta is marked with `(new)/(changed)/(removed)` markers that are dropped at close-out.
- `docs/spec/` also holds the **charter** (`project_charter.md`, kept, translated to English, why/scope/stakeholders).
- `docs/architecture/architecture_decisions.md` - ADRs `### D<N> - Title`; cited from code as `ADR Dn`.
- `docs/rules/` - how to build/test/diagnose (e.g. `build_and_verification.md`, `laser_sdk_runbook.md`, `doc_comment_style.md`, `ui_design_rules.md`, `ja_glossary.md`, `license_runbook.md`, `qr_code_schema.md`).
- `docs/manual/` - operator manual (EN + JA trees).
- `docs/reference/` - generated Doxygen (regenerate with `docs/reference/generate.ps1`).
- `CHANGELOG.md` - what changed, by version/date, a few lines each; no phase numbers.
- `docs/backlog.md` - ONE prioritized list of open defects/gaps/decisions/doc drift, `BL-nnn` one line each, IDs never reused, row deleted when closed.
- `docs/history/` - plans (`docs/history/plan/phase_N_plan.md`), `phase_status.md`; the ONLY place phase names are allowed; code never cites it.
- `docs/_retired/` - owner requests, UNTRACKED (excluded in `.git/info/exclude`), also purged from history; tracked docs never link them.
- Root: `README.md`, `ONBOARD.md` (renamed from AGENT.md), `tests/README.md`, `uml/README.md`, `docs/README.md`.

Tracked vs untracked: tracked = everything above except `docs/_retired/`, `.claude/`, `build/`, `product_release/`, scratch, `.vscode/`, `qmake/local.pri`, and untracked vendored component sources (qpb sources, mc_protocol clone: only README/CHANGELOG/include/LICENSE tracked).

Module README ("scope card") must contain: how the code in that module is organized and the invariants for whoever edits it (per rules table). Location: `src/<module>/README.md`, `laser_host/README.md`; cpp-reviewer treats each touched module's README invariants as review criteria; planner/explorer/architect must read them first. (They were renamed from AGENTS.md; repo must not reference `.claude`.) No further required template is given in these files.

Comment citation: see rules 36-38 (only tracked content; `ADR Dn`; spec file + ID; docs/rules; module README; tests; vendor copy under `components/`; no phases, requests, `.claude`, untracked paths, external URLs).

Other documentation rules: describe behaviour as built and verified, not as originally requested (several requests were corrected on the bench); English for all tracked docs; a plan restates requirements in the project's own words; defect found but not fixed goes to the backlog, not a new bug file; manual drift parked as BL rows.

---

## 6. Parameterization candidates

| Value | Where it appears | Suggested variable |
|---|---|---|
| Project name `NichirinLaserMark`, descriptions "PLC-to-laser bridge" | memory/*, rules/cpp/*, agents/*, commands/*, hooks messages, settings.json | PROJECT_NAME, PROJECT_DESCRIPTION |
| Project root `C:\DGB\Project\NichirinLaserMark` | settings.json (2 hook commands), rules/no-delete-outside-root.md, memory/no-delete-outside-root.md, memory/memory-backup-sync.md, hooks/sync-memory.ps1 ($backup) | PROJECT_ROOT |
| Hook script location | settings.json `C:/DGB/Project/NichirinLaserMark/.claude/hooks/...` | use `$CLAUDE_PROJECT_DIR` / relative |
| User-level memory dir `C:\Users\BAO\.claude\projects\c--DGB-Project-NichirinLaserMark\memory` | hooks/sync-memory.ps1 ($primary), memory/memory-backup-sync.md, rules/no-delete-outside-root.md (`C:\Users\BAO\.claude\`) | MEMORY_DIR_PRIMARY (derive from user profile + project slug) |
| Memory backup dir `<root>\.claude\memory` | sync-memory.ps1, memory-backup-sync.md | MEMORY_DIR_BACKUP |
| Portable git path `C:\DGB\build_packages\portable-git\cmd\git.exe` | memory/git-local-repo.md, agents/cpp-reviewer.md, commands/cpp-review.md, skills/inherit-legacy-style | GIT_EXE |
| Build_packages / harness tools root `C:\DGB\build_packages` (ECC source `harness-tools\ECC-2.2.3`) | memory/ecc-local-harness.md, rules/no-delete-outside-root.md | TOOLS_ROOT |
| Git identity `dev27 <de27@local>`; no AI trailer; local-only/no push; autocrlf=false; quotepath=false; ask "new commit or fold" | memory/git-local-repo.md (policy), hooks/guard-shell.ps1 (push block) | GIT_USER_NAME, GIT_USER_EMAIL, COMMIT_TRAILER_POLICY, ALLOW_PUSH, COMMIT_ASK_POLICY |
| Human title "Project Leader" (formerly "owner") | memory/project-leader-term.md, user-role.md, working-arrangement.md; "owner" in rules/docs-structure.md, code-comments.md, commands/plan.md, feature-dev.md, agents/cpp-reviewer.md, planner.md | LEAD_TITLE |
| Reply language Vietnamese, artifacts English, product UI Japanese | memory/user-role.md, ja-installed-terms.md | REPLY_LANG, DOC_LANG, UI_LANGS |
| Protected/ignored dirs: `docs/_retired/`, `.claude/`, `build/`, `product_release/`, `components/`, `temp_codebase/`, `temp_ezd_api source/`, `.vscode/` | rules/code-comments.md, rules/repo-boundaries.md, skills/inherit-legacy-style, memory/git-local-repo.md | UNTRACKED_DIRS, VENDOR_DIR |
| Process names to kill: `EzCad2.exe`, `laser_host.exe` | rules/cpp/testing.md, memory/build-laser-host-gotchas.md, memory/laser-init-realmode.md | STALE_PROCESS_NAMES |
| Source extensions blocked from PS writes `cpp h hpp ui pro pri qrc qss ts` | hooks/guard-shell.ps1 | GUARD_SOURCE_EXTS |
| ASCII-only extensions `h cpp pro pri ui qss ps1 gitignore` | memory/no-unicode-symbols-in-code.md | ASCII_EXTS |
| Comment-rule file globs `cpp h pro pri ps1 bat ui qss qrc` | rules/code-comments.md `paths:` | COMMENT_RULE_GLOBS |
| Non-ASCII exemptions: `app/translations/*.ts`, `components/`, Markdown docs, `uml/*.puml` | memory/no-unicode-symbols-in-code.md, rules/cpp/coding-style.md | ASCII_EXEMPT_PATHS (translation dir/file) |
| ASCII check command `git grep -I -nP "[^\x00-\x7F]" ...` | memory/no-unicode-symbols-in-code.md | ASCII_CHECK_CMD |
| Translation file `app/translations/NichirinLaserMark_ja_JP.ts`; glossary `docs/rules/ja_glossary.md` | memory/ja-installed-terms.md, rules/cpp/coding-style.md | TRANSLATION_FILE, GLOSSARY_FILE |
| Build scripts/toolchain: VS2019 Community vcvarsall path + arg `x86`; Qt `C:\Qt\5.15.2\msvc2019\bin`; jom `C:\Qt\Tools\QtCreator\bin\jom\jom.exe`; build dirs (`build\cli\<cfg>`, `build\bin\<cfg>`, legacy `build\msvc32`, `laser_host\build\release`, `tests\<name>\build`) | agents/cpp-build-resolver.md, commands/cpp-build.md, memory/build-laser-host-gotchas.md, rules/cpp/testing.md | VCVARS_PATH, VCVARS_ARCH, QT_BIN, JOM_PATH, BUILD_DIR_TEMPLATE, BUILD_OUT_DIR |
| Architecture-contract test, oracle scripts (`tests/architecture_contract_test`, `capture_baseline.ps1`, `laser_host_protocol_test`, `run_all.ps1`, `qmake/local.pri`) | agents/*, rules/cpp/testing.md, commands/* | ARCH_TEST, ORACLE_CMDS, TEST_RUNNER |
| Module list and levels (core0, device/license1, runtime/marking2, ui, app/; `runtime/*Runner`) | agents/code-explorer.md, rules/cpp/coding-style.md, patterns.md | MODULE_LAYERS |
| Tracked doc paths: `ONBOARD.md`, `docs/spec/`, `docs/rules/*`, `docs/architecture/architecture_decisions.md`, `docs/history/plan/`, `docs/backlog.md`, `CHANGELOG.md`, `tests/README.md`, `uml/README.md`, `docs/manual/` | rules/*, commands/plan.md, feature-dev.md, agents/planner.md, cpp-reviewer.md, skills ADR override | DOC_ROOTS (a map) |
| Doc ID formats: `ADR Dn`, `BL-nnn`, spec ID prefixes (`QR-012`), plan-local `Dn`, `CP1/CP2` | rules/code-comments.md, docs-structure.md | ID_FORMATS |
| Namespace `vc::`, member prefix `m_`, constant `kPascalCase`, C++17, Qt 5.15.2 | rules/cpp/coding-style.md | CODING_STYLE profile (language level, naming) |
| Sub agent default model `sonnet` (Sonnet 5.5) | memory/subagent-default-model.md, all agents/*.md frontmatter | DEFAULT_SUBAGENT_MODEL |
| Hook timeout 10 s, shell `powershell -NoProfile -ExecutionPolicy Bypass` | settings.json | HOOK_SHELL, HOOK_TIMEOUT |
| Env vars `NLM_*`, `QT_QPA_PLATFORM`, `LICENSE_BYPASS_FOR_DEV` define | memory/*, rules/cpp/testing.md, working-arrangement.md | domain-only; project extension |
| Release loop counts (25-40) | memory/ui-test-release-loops.md | UI_TEST_LOOPS |
| ECC "Prompt Defense Baseline" block | all 7 agents | AGENT_PREAMBLE (single include) |
| Domain constants (rc values, MC frame constants, laser pins, hardware ids) | memory/laser-init-realmode.md, mc-computer-link-frames.md, ezd-sdk-docs.md, rules/cpp/patterns.md | domain pack, not kit core |

---

## 7. Issues spotted

1. **Stale build layout in agent and command**: `agents/cpp-build-resolver.md` table (`build\msvc32`, `laser_host\build\release`, `tests\<name>\build`) and `commands/cpp-build.md` ("laser_host first, then app", post-link copy) describe the layout that phase 18 (2026-10-07) made OBSOLETE (single root build in `build\cli\<cfg>`, output `build\bin\<cfg>`, oracles run from there). `memory/build-laser-host-gotchas.md` and `rules/cpp/testing.md` already use the new layout. `memory/project-status.md` explicitly says old notes are obsolete.
2. **Hard-coded absolute paths in settings.json** (`C:/DGB/Project/NichirinLaserMark/.claude/hooks/...`): dead when the folder is copied (the reference folder is named `claude4`); hooks will not run. `sync-memory.ps1` hard-codes user `BAO` (current user on this machine is not BAO) and the project slug.
3. **Memory sync hook gaps**: no delete/rename mirror, only Write|Edit; no conflict detection; failures only visible on stderr.
4. **Guard hook gaps/false positives** (see section 3): `git -C x push` bypass, quoted "git push" false positive, variable-path bypass, extension list differs from the ASCII rules (`.ps1`, `.bat`, `.md`, `.json` absent; `hpp`, `ts` present only here); no "ask" decision.
5. **Safety rules not mechanically enforced**: no-delete-outside-root, license-bypass line, ASCII-only content, Stop-Process, "no AI trailer" rely on the model's compliance; only push and PS source writes are hooked.
6. **Skill contradictions**: `skills/architecture-decision-records` keeps the full `docs/adr/` + `ADR-NNNN` workflow below an override block that says do not create `docs/adr/` and use D-items; `skills/inherit-legacy-style` still describes `.ai-style-rules.md`, CLAUDE.md soft/hard hooks and "offer hook strength" after saying no hook/CLAUDE.md; Branch B detection step says "check `.ai-style-rules.md` at the project root" while the output is `.claude/rules/legacy-style.md`. `skills/cpp-coding-standards` contradicts the project (exceptions section, C++20 concepts/checklist item T.10, `underscore_style` and trailing-underscore members versus `m_`/camelCase); only a generic override header guards this. Frontmatter `metadata.origin` is used (ECC/ECC/community) but not `allowed-tools` on the ECC ones.
7. **Two divergent plan formats**: `agents/planner.md` (Overview / Implementation Steps with "Phase 1/2" / Success Criteria) versus `commands/plan.md` (Requirements restated / Decisions needed / Spec delta / Tasks T1.. / Close-out). The planner's generic "Sizing and Phasing: Phase 1..4" invites phase vocabulary; allowed only in `docs/history/`.
8. **Terminology drift "owner" vs "Project Leader"**: `memory/project-leader-term.md` says to call the person Project Leader, but `rules/docs-structure.md`, `rules/code-comments.md` ("Owner rule"), `commands/plan.md` ("Decisions needed from the owner"), `commands/feature-dev.md`, `agents/cpp-reviewer.md`/`planner.md`, `memory/subagent-default-model.md`, `memory/no-delete-outside-root.md` etc. still say "owner" (the memory note says local rules may still say owner and it means the Project Leader, but it is an unresolved inconsistency).
9. **Conflicting commit hashes**: `memory/git-local-repo.md` says the single root commit is `be838a8` and then later "now `bff10ed`"; `memory/docs-restructure.md` says `be838a8`; `memory/project-leader-term.md` says `bff10ed`. Hashes in memory go stale after every amend and should not be recorded. Same for `c7cec64`, `296eca6` etc.
10. **MEMORY.md index stale**: the project-status line says "phases 1-17 all closed (14 by owner decision 2026-10-07)" while the file records phases 18 and 19 (19D uncommitted). The index line for `ecc-local-harness` lists hooks accurately but is long; descriptions elsewhere mention "owner".
11. **project-status.md is a log, not memory**: 82 KB history with commit hashes, bench logs and a "Superseded" section; its `description` is still "phase status, key constraints, and toolchain". It contains the generic lessons worth extracting (rule 94) but should not be copied into a kit. It also contains a reference to an artifact URL (`https://claude.ai/artifact/...`) and mentions deleted files.
12. **Dead references from inside `.claude/`**: pointers to tracked docs not part of the kit: `ONBOARD.md`, `docs/rules/build_and_verification.md`, `docs/rules/laser_sdk_runbook.md`, `docs/rules/doc_comment_style.md`, `docs/rules/ui_design_rules.md`, `docs/rules/ja_glossary.md`, `docs/architecture/architecture_decisions.md`, `tests/README.md`, `components/ezdlib/*`, `temp_complete_source/MarkEzd` (laser-init-realmode.md; the lead said `temp_*` folders will be deleted), `temp_codebase/`. Also `.claude/rules/legacy-style.md` is referenced by the skill but does not exist yet. `rules/cpp/coding-style.md` points to `.claude/rules/code-comments.md` by path (fine locally).
13. **Duplicated rule**: `no-delete-outside-root` exists as both memory and rule; `no-unicode-symbols`/`powershell-utf8` memory vs hook vs coding-style rule; three ASCII/extension lists differ (see section 6) and could drift.
14. **Memory frontmatter inconsistent**: `no-ui-screenshots.md` has `name`, `description` and only `metadata.type` (no `node_type`/`originSessionId`/`modified`); several have empty `metadata:`; `modified` is missing in some; `[[wikilinks]]` used but no link checker.
15. **Agent tool lines vs hook coverage**: agents with Bash/PowerShell (code-architect, cpp-reviewer, silent-failure-hunter) are described as read-only/report-only but technically can write through the shell; only the guard hook (limited) restricts them. `cpp-build-resolver` is the only agent with Write/Edit, in line with design.
16. **type-design-analyzer** is generic and unwired (no command uses it; no project constraints); planner/cpp-reviewer descriptions say "Use PROACTIVELY / automatically activated" (ECC leftover) while `/plan` says run inline by default.
17. **"Prompt Defense Baseline"** duplicated in 7 agents (~0.8 KB each), contains generic text ("Do not output executable code... unless required") that does not fit agents whose job is code; memory says removal was denied by the permission classifier.
18. **Policy tension with harness defaults**: `memory/git-local-repo.md` forbids any AI trailer in commits ("no Co-Authored-By / Generated with"), which conflicts with an environment-level attribution instruction (session system reminders ask for Co-Authored-By). Needs a precedence rule in the kit (the user's own instruction wins).
19. **Machine-specific facts in memory**: COM6, bench PLC settings, EzCad2 parameter names, test commit ids, PL/owner names, `C:\Users\BAO`; `memory/laser-init-realmode.md` references `temp_complete_source` and `HWND` details; unsuitable for a generic kit.
20. **Process-name kill command** appears twice with slightly different forms (`rules/cpp/testing.md` with `-ErrorAction SilentlyContinue`, memory without) - harmless; `Stop-Process -Force` is not guarded and affects the user's own running EzCad2.
21. **ASCII rule vs. this folder**: memory and rules contain many non-ASCII characters (arrows, section signs, em dashes) - consistent with the exemption for Markdown docs, but `.claude` hook `.ps1` files are ASCII; the `.ps1` hooks contain no violation.
22. **`rules/` scoping**: only `rules/code-comments.md` and `rules/cpp/*` have `paths:` frontmatter; `docs-structure.md`, `repo-boundaries.md`, `no-delete-outside-root.md` load on every session (cost, but intended).
23. **LICENSE_BYPASS_FOR_DEV**: a licence-bypass define in the app (`MainWindow`) is mentioned as "never touch" and project-status notes it was left uncommitted; a bench-affecting hazard (the preview bug hid behind it for a phase), worth keeping as an example rule: "bench with the production configuration".
24. **settings.json has no `permissions` block**: the memory/rules rely on interactive approval; the starter kit could add an allow/deny list for git push, rm, etc.
