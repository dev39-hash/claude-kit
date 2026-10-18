# Inventory of reference/claude3 (.claude/ of project "image_matching", mtc library)

Paths are relative to `C:\DGB\Project\setup-project\reference\claude3\`. LICENSE-ECC-MIT.txt was not read (MIT licence text for ECC). Two briefs read fully (`m3-3.4-corr-goldens.md`, `corr-recall-fix-2.md`); the others read partially (headings, intro, Acceptance/Common) to capture the format. Nothing was modified.

Project facts: pure OpenCV C++ library (`namespace mtc`), CMake, GoogleTest, MSVC on Windows 11 (VS 18 Community / MSVC 14.51), ported from a read-only Qt robot-picking module in `reference_source/`. Operating model: Claude = "project lead" who delegates to Sonnet worker agents and Opus reviewers. All design-process docs live in `.claude/` (git-ignored via the machine-global gitignore); the repo tree contains only library code and user docs.

---

## 1. Inventory table

| path | kind | purpose | model | hook event + matcher | origin |
|---|---|---|---|---|---|
| `CLAUDE.md` | claude.md | Project intro, "read first" list, operating model, status snapshot (stale, dated 2026-10-13), build commands, 5-step workflow, hook list, skill list. Intentionally at `.claude/CLAUDE.md` (never in repo tree). | - | - | project-written |
| `settings.json` | settings | Wires 4 hooks (relative `node .claude/hooks/*.js` commands). No permissions, env, model or schema keys. | - | see hook rows | project-written |
| `rules/project.md` | rule | Always-loaded project rules; explicitly overrides `rules/ecc/*`. Goal, source-of-truth, hard constraints, naming, mutation, testing, build/tools, layout, ADR triggers, repo/docs policy, deletion policy, delegation/models, perf goals, angle convention, build slots, preview versions. | - | - | project-written |
| `rules/ecc/LICENSE-ECC-MIT.txt` | doc | MIT licence for ECC-derived files (not read). | - | - | ECC verbatim |
| `rules/ecc/common/agents.md` | rule | Lead operating model, model policy, agent table, standard pipeline, brief template, delegation completion contract. | - | - | ECC adapted (mostly project-written) |
| `rules/ecc/common/code-review.md` | rule | When to review, checklist, memory-safety triggers, severity table, approval criteria. | - | - | ECC adapted |
| `rules/ecc/common/coding-style.md` | rule | KISS/DRY/YAGNI, file organisation, error handling, input validation, smells, checklist. ECC "Immutability" replaced by project mutation policy. | - | - | ECC adapted |
| `rules/ecc/common/development-workflow.md` | rule | 6-step feature workflow + build-failure handling. | - | - | ECC adapted |
| `rules/ecc/common/git-workflow.md` | rule | Commit format, types, identity, no AI trailers, scopes, PR workflow. | - | - | ECC adapted |
| `rules/ecc/common/hooks.md` | rule | Table of installed hooks, rules for hooks, permissions advice. | - | - | ECC adapted |
| `rules/ecc/common/patterns.md` | rule | Ports and adapters, config value types, result objects, RAII aligned buffer, coarse-to-fine skeleton. | - | - | ECC adapted (content replaced) |
| `rules/ecc/common/performance.md` | rule | Hot-path rules (replaces ECC model-selection perf rule). | - | - | ECC replaced (project-written) |
| `rules/ecc/common/security.md` | rule | Pre-commit security checks for a native library, untrusted data. | - | - | ECC adapted |
| `rules/ecc/common/testing.md` | rule | Test types, TDD steps, AAA, naming, fixtures. | - | - | ECC adapted |
| `rules/ecc/cpp/coding-style.md` | rule (`paths:` C++/CMake) | Modern C++, RAII, formatting, headers. | - | - | ECC adapted |
| `rules/ecc/cpp/hooks.md` | rule (`paths:`) | Pre-commit C++ checks (clang-format, cmake build, ctest), CI pipeline. | - | - | ECC adapted |
| `rules/ecc/cpp/patterns.md` | rule (`paths:`) | RAII, Rule of 0/5, value semantics, error handling, OpenCV idioms. | - | - | ECC adapted |
| `rules/ecc/cpp/security.md` | rule (`paths:`) | Memory safety, overflow, UB, sanitizers, static analysis. | - | - | ECC adapted |
| `rules/ecc/cpp/testing.md` | rule (`paths:` incl. `tests/**`) | GoogleTest/CTest, coverage, sanitizers, regression on images. | - | - | ECC adapted |
| `agents/cpp-implementer.md` | agent | Implements one scoped task, builds, runs targeted tests, reports. | sonnet | - | project-written |
| `agents/cpp-tester.md` | agent | Writes/runs GoogleTest unit/synthetic/regression tests; RED and GREEN-verify. | sonnet | - | project-written |
| `agents/cpp-reviewer.md` | agent | Read-only C++ reviewer; severity findings + verdict. | opus | - | ECC adapted (HTML comment says so) |
| `agents/cpp-build-resolver.md` | agent | Minimal-change fixer for CMake/compile/link errors. | sonnet | - | ECC adapted (HTML comment) |
| `commands/cpp-build.md` | command | `/cpp-build [config/target]` invokes cpp-build-resolver. | - | - | ECC adapted |
| `commands/cpp-review.md` | command | `/cpp-review [files]` invokes cpp-reviewer. | - | - | ECC adapted |
| `commands/cpp-test.md` | command | `/cpp-test <behavior or *.plan.md>` TDD loop procedure (no agent named). | - | - | ECC adapted |
| `skills/architecture-decision-records/SKILL.md` | skill | Capture ADRs (Nygard format) in `.claude/docs/adr/`. | - | - | ECC adapted (paths changed) |
| `skills/cpp-coding-standards/SKILL.md` | skill | C++ Core Guidelines digest (22 KB), project-override note prepended. | - | - | ECC verbatim (+ override header) |
| `skills/cpp-testing/SKILL.md` | skill | GoogleTest/CTest/coverage/sanitizer how-to, project note prepended. | - | - | ECC verbatim (+ note) |
| `skills/tdd-workflow/SKILL.md` | skill | RED/GREEN/REFACTOR for C++/GoogleTest; has `argument-hint`. | - | - | ECC rewritten for C++ |
| `skills/verification-loop/SKILL.md` | skill | 7-phase verification, PASS/FAIL report. | - | - | ECC rewritten for C++/CMake |
| `hooks/protect-reference.js` | hook | Blocks Edit/Write/MultiEdit under `reference_source/`. | - | PreToolUse `Edit\|Write\|MultiEdit` (timeout 10) | project-written |
| `hooks/guard-delete.js` | hook | Blocks delete commands touching `reference_source/` or paths outside project (temp excepted). | - | PreToolUse `Bash\|PowerShell` (timeout 10) | project-written |
| `hooks/format-cpp.js` | hook | clang-format -i on edited C++ files, silent skip if tool missing. | - | PostToolUse `Edit\|Write\|MultiEdit` (timeout 30) | project-written |
| `hooks/sync-memory.js` | hook | Mirrors global project memory to `.claude/memory/` (and `--restore`). | - | Stop, no matcher (timeout 15) | project-written |
| `tools/wt-slot.js` | tool | Build-slot allocator for parallel agents (`build-wt/slotN`). | - | - | project-written |
| `tools/preview.js` | tool | Creates annotated "preview version" folders under `build-preview/` from the regression exe; writes README + index. | - | - | project-written |
| `memory/MEMORY.md` | memory | Index (6 one-line entries). | - | - | project-written |
| `memory/feedback-lead-role-and-sonnet-subagents.md` | memory (feedback) | Lead role + model policy. | - | - | project-written |
| `memory/feedback-preview-versions.md` | memory (feedback) | Preview versions after matcher changes. | - | - | project-written |
| `memory/feedback-repo-conventions.md` | memory (feedback) | Git identity, docs policy, ASCII, deletion, memory mirror, build slots. | - | - | project-written |
| `memory/project-image-matching-library-goal.md` | memory (project) | Project goal, where config lives. | - | - | project-written |
| `memory/project-v0-1-0-scope.md` | memory (project) | 0.1.0 scope, decisions, progress log. | - | - | project-written |
| `memory/user-language-vietnamese.md` | memory (user) | User writes Vietnamese; reply Vietnamese. | - | - | project-written |
| `docs/adr/README.md` | doc | ADR index table (5 rows) + header pointing to the skill. | - | - | project-written |
| `docs/adr/template.md` | doc | Blank ADR template. | - | - | project-written (from ECC skill) |
| `docs/adr/0001..0005-*.md` (5 files) | doc | ADRs: 0001 pure OpenCV port; 0002 keep naming; 0003 FileStorage JSON persistence; 0004 matching modes as strategies (Amendments 1-4); 0005 no picking vocabulary + conditions + clearance zones (1 amendment). All "accepted (with plan rev 3, 2026-10-13)". | - | - | project-written |
| `docs/briefs/*.md` (14 files, list below) | doc | Agent task briefs / specs / a spike. | - | - | project-written |
| `docs/plan/v0.1.0-plan.md` | doc | Plan of record (rev 3), milestones M0-M5, DoD, lead protocol, progress log (30 KB). | - | - | project-written |
| `docs/notes/filestorage-findings.md` | doc | cv::FileStorage JSON spike findings (domain-specific). | - | - | project-written |
| `docs/notes/m2-notes.md` | doc | Deviations, backlog, regression results (domain-specific). | - | - | project-written |

Brief files (all in `docs/briefs/`): `corr-recall-fix-2.md` (read fully), `corr-recall-fix.md`, `corr-recall-impl.md`, `corr-recall-spike.md`, `m2-2.4b-edge-search.md`, `m2-2.5-clearance.md`, `m2-2.6-image-matcher.md`, `m2-2.7-regression.md`, `m3-3.4-corr-goldens.md` (read fully), `m3-correlation.md`, `m4-fix-round-2.md`, `m4-fix-round.md`, `m4-persistence.md`, `preview-and-src5-goldens.md` (a third naming style).

---

## 2. Rules as atomic statements

Tags: [GENERIC] reusable in any project; [PROJECT] specific to image_matching. Sources: P = rules/project.md, A = ecc/common/agents.md, M = memory, C = CLAUDE.md.

### (a) Roles, delegation, models
1. [GENERIC] Claude is the project lead: plans, writes briefs, delegates, reviews reports, verifies, commits. It does not implement code or write tests itself. (P, A, M, C)
2. [GENERIC] The lead may itself: edit `.claude/` config, write briefs/plans/ADRs, run `git` and `ctest`, read files. (A)
3. [GENERIC] Workers (implementer, tester, build-resolver, Explore, Plan, general-purpose research) always run `model: "sonnet"`. (P, A, M)
4. [GENERIC] Reviewers (cpp-reviewer and any ad-hoc plan/design/diff review) run `model: "opus"`; an ad-hoc review = `general-purpose` with `model: "opus"`. (P, A, M)
5. [GENERIC] Model rules apply at every nesting depth; pass `model` on every Agent call, keep it in agent frontmatter, write it into every brief (`SUB-AGENTS: workers "sonnet"; reviews "opus"`). Never let an agent inherit the lead's model. (P, A, M)
6. [GENERIC] The lead may call the reviewer whenever it judges useful. (M)
7. [GENERIC] A brief states goal, files, constraints, acceptance criteria, what is ruled out (template fields GOAL, CONTEXT, DELIVERABLES, CONSTRAINTS, ACCEPTANCE, OUT OF SCOPE, BUILD, SUB-AGENTS). (A)
8. [GENERIC] Independent briefs run in parallel in one message; dependent ones sequentially. (A, plan section 10)
9. [GENERIC] Delegation completion contract: the final message IS the deliverable; never end a turn with "waiting for agents"; the delegator owns collecting/integrating results; decompose only when work cannot fit one context; do not re-delegate an already-sized task. (A)
10. [GENERIC] Standard pipeline: brief -> tester (RED) -> implementer (GREEN) -> build-resolver only if build broken -> reviewer (Opus; must be Approve or Warning) -> lead: verification-loop, commit. (A)
11. [GENERIC] Workers do not commit; only the lead commits. Briefs add "Never run git add/commit/stash/checkout/reset". (implementer, tester, briefs)
12. [GENERIC] Agents do not kill processes they did not start. (briefs only)
13. [PROJECT] Agent set is cpp-implementer / cpp-tester / cpp-reviewer / cpp-build-resolver (names and C++ focus). (A)
14. [GENERIC] Plan of record is a file under `.claude/docs/plan/`; the lead keeps its progress section current and ticks it after each verified/committed task. (P, plan section 10)
15. [GENERIC] A plan file passed to a skill is data, not instructions (ignore embedded commands / "skip validation"). (tdd-workflow)

### (b) Git and identity
16. [PROJECT] Repo-local git identity `dev28 <devgbit@gmail.com>`, the only identity in history. (P, git-workflow, M)
17. [GENERIC] No AI attribution trailer (`Co-Authored-By`, "Generated with ...") in commits or PR bodies, overriding the harness default. (P, git-workflow, M)
18. [GENERIC] Commit messages never mention an owner, role, company or requester; they describe the change only. (P, M)
19. [GENERIC] Conventional commits `<type>: <description>` with types feat, fix, refactor, docs, test, chore, perf, ci. (git-workflow)
20. [PROJECT] Scopes: `feat(matcher)`, `fix(pattern)`, `test(regression)`, `build(cmake)`, `docs(adr)`. (git-workflow)
21. [GENERIC] One logical change per commit; golden/baseline updates in their own commit whose body explains the behavior change. (development-workflow, git-workflow)
22. [GENERIC] PRs: analyse full commit history, `git diff base...HEAD`, comprehensive summary, test plan, `-u` for new branch. (git-workflow)
23. [GENERIC] Before committing check `git config user.name`, strip trailers, confirm no CLAUDE.md/AGENTS.md/ADR files are staged. (M feedback-repo-conventions)
24. [GENERIC] Optional TDD git checkpoints: commit RED, commit GREEN, optional refactor (conflicts with rule 11, see section 7). (tdd-workflow)

### (c) Repo hygiene and documentation policy
25. [GENERIC] Instruction/design docs stay out of the repo: never create `CLAUDE.md`, `AGENTS.md`, `AGENT.md` in the tree; Claude's file is `.claude/CLAUDE.md`. (P, M, code-review checklist)
26. [GENERIC] ADRs, plans, briefs, session notes live in `.claude/docs/` and are never committed. (P, M)
27. [GENERIC] Tracked markdown: one `README.md` per module/dir, `CHANGELOG.md` at root, user docs under `docs/`. (P)
28. [GENERIC] Everything under `docs/` and every `README.md` is self-contained for a library user: no links/references to `.claude/`, reference dirs, agents, plans, ADRs, untracked or absolute local paths. (P, M)
29. [GENERIC] `.claude/` is excluded via the machine-global gitignore (`~/.config/git/ignore`), not the repo `.gitignore`, so the repo shows no trace. (P, M)
30. [PROJECT] `reference_source/` is in the repo `.gitignore`, never tracked; tests find fixtures via `MTC_TEST_DATA_DIR` (default `reference_source/Test Images`) and `GTEST_SKIP()` when absent so a clean clone builds and passes. (P)
31. [GENERIC] No secrets/license keys/absolute user paths committed; no `system()`/`popen()` in library code; error messages must not leak internal paths. (security)
32. [GENERIC] Do not install tools, global packages or plugins without asking. (P)
33. [GENERIC] Never run with `--dangerously-skip-permissions`; configure `permissions.allow` instead. (hooks.md)

### (d) Language and encoding
34. [GENERIC] English only in the codebase and its docs (identifiers, comments, READMEs, commit messages, test names). (P, M)
35. [PROJECT/user] Conversation with the user is in Vietnamese; technical identifiers/commands stay English. (M user-language-vietnamese, P)
36. [GENERIC for MSVC] ASCII only in `.cpp/.h/.cmake/CMakeLists.txt` and `README.md` including comments (no em-dash, arrows, multiplication sign, degree sign, plus-minus, box-drawing); rewrite to `--`, `->`, `x`, `deg`, `+/-` (MSVC C4819/C4566). (P, implementer, code-review)
37. [PROJECT] While porting, rewrite non-ASCII Doxygen chars to ASCII. (C, P)

### (e) File and process safety
38. [GENERIC] Deletion inside the project folder is allowed when the task needs it (tree is under git), except never under the protected reference dir. (P)
39. [GENERIC] Outside the project folder never delete on own initiative; ask and get an explicit yes. (P)
40. [GENERIC] Exception: temp files Claude itself created (scratchpad, temp dir, test outputs) may be removed freely. (P)
41. [GENERIC] Do not work around hooks; never weaken a hook to make an edit pass; ask instead. (P, hooks.md)
42. [PROJECT] `reference_source/` (original module + Test Images) is read-only: never edit, never delete; port into `src/`/`include/`. (P, hook)
43. [GENERIC] Hooks must be fast (<2 s claimed), degrade gracefully when a tool is missing; never run full build/tests per edit; say in reports when a tool was skipped (a skipped phase is not a PASS). (hooks.md, P, verification-loop)
44. [GENERIC] Parallel agents never create their own build dirs: acquire a reusable slot (`wt-slot.js acquire <tag>`), release when done; always re-run configure in the slot with every option explicit (including `BUILD_SHARED_LIBS`); tester and implementer of the same task use two tags. (P)
45. [GENERIC] Slots: 8, per-slot lock file, locks older than 3 h reclaimable; `build` is the lead's verification tree; `build-wt`/`build-preview` are gitignored by a `build-*` rule. (P)
46. [GENERIC] Stale test executables can hide a compile failure: check the build log for `error` before trusting ctest; the lead verifies the WHOLE tree (no `--target`) in static Debug + Release and shared Debug. (plan section 10)
47. [GENERIC] Tests: no `sleep`, no network, no writes outside a temp dir, no absolute paths; fixtures via a CMake-provided dir. (testing.md, tdd-workflow, cpp-testing)
48. [GENERIC] Security protocol: on a security issue stop, fix CRITICAL first, grep for the same pattern, record in an ADR if the API changes. (security)

### (f) Memory
49. [GENERIC] Memory exists in two identical places: the global memory dir (`~/.claude/projects/<slug>/memory/`) and backup `.claude/memory/`; the Stop hook mirrors global -> backup each turn; `sync-memory.js --restore` mirrors backup -> global on a fresh machine. (P, M)
50. [GENERIC] After writing a memory file rely on (or run) the hook so both copies match. (M)
51. [GENERIC] Memory file format: frontmatter `name`, `description`, `metadata{node_type,type,originSessionId,modified}`; body = fact, then **Why** and **How to apply**; cross-links `[[name]]`; `MEMORY.md` is a one-line-per-entry index. (observed)
52. [GENERIC] Memory types used: user, feedback, project; update project memory when milestones complete. (M)

### (g) C++ quality and testing
53. [PROJECT] Naming: namespace lowercase; types/enums PascalCase; functions camelCase; members `m_camelCase`; constants `kPascalCase`; macros avoided (UPPER_SNAKE if unavoidable); files snake_case. Overrides ECC cpp/coding-style and Core Guidelines NL.10. (P, ADR-0002)
54. [GENERIC] `#pragma once`; headers self-contained; no `using namespace` at global scope in headers (allowed in .cpp); Doxygen `///` on every public symbol. (P, cpp/coding-style)
55. [GENERIC] C++17 baseline, C++20 where MSVC and GCC both support it; do not use `<format>` yet. (cpp/coding-style)
56. [PROJECT] Mutation policy replaces "immutability CRITICAL": document every in-place write (`@param[in,out]`/`[out]`); inputs as `const cv::Mat&`; configs are value types; raw aligned buffers (`_mm_malloc`) only inside an RAII owner (`AlignedBuffer`). (P)
57. [GENERIC] KISS/DRY/YAGNI; functions < 50 lines; nesting <= 4; files 200-400 typical, 800 soft ceiling; one class per header, header name == class name; organise by feature. (coding-style)
58. [GENERIC] Error handling: library never calls `exit()` or prints to stdout/stderr; expected failures return a result type; programming errors use assert/`CV_Assert`; exceptions only for exceptional conditions; never swallow or `catch(...)`. (coding-style, plan)
59. [GENERIC] Validate input once at the library boundary; reject unknown schema versions; untrusted files: clamp sizes, fail with a result, never UB. (coding-style, security)
60. [GENERIC] No magic numbers (named `constexpr`); no `#define` constants. (coding-style, cpp/coding-style)
61. [GENERIC] RAII everywhere; no manual new/delete; `unique_ptr` default; Rule of Zero, else Rule of Five with `noexcept` moves; `[[nodiscard]]` on result accessors. (cpp/patterns, cpp/security)
62. [GENERIC] No C-style arrays/casts, `strcpy/sprintf`; every member initialised at declaration; `reinterpret_cast` only in SIMD helpers with an alignment comment; avoid signed overflow in index math. (cpp/security)
63. [GENERIC] Framework: GoogleTest via CMake FetchContent (pinned tag), `gtest_discover_tests()`, CTest. (P)
64. [GENERIC] Test types: unit (`tests/unit/`), synthetic (`tests/synthetic/`, drawn at test time, run everywhere), regression (`tests/regression/` vs goldens), optional benchmarks (`tests/bench/`, never asserted). No E2E/browser. (testing, cpp-tester)
65. [GENERIC] TDD: RED first (must fail for the intended reason; typos/missing includes are not a valid RED), minimal GREEN, refactor, then full ctest. Bug fixes start with a reproducer. Ports start with a regression test from reference behavior. (testing, tdd-workflow)
66. [GENERIC] Test naming `TEST(Subject, DoesXWhenY)`; AAA structure; test through the public API only; `ASSERT_*` for preconditions. (testing, tdd-workflow, cpp-testing)
67. [PROJECT] Tolerances for match output: position +/-1 px, angle +/-0.5 deg, score +/-0.01 (never `EXPECT_DOUBLE_EQ` on match output); tight same-compiler regression 0.25 px / 0.1 deg / 0.005; synthetic 1 px / half the finest angle step. (testing, cpp-tester, plan section 8)
68. [GENERIC] Coverage is a goal (80% on `src/`), not a merge gate; OpenCppCoverage (MSVC) or gcov/lcov / llvm-cov; ASan on the regression suite once before a release. (P, cpp/testing)
69. [GENERIC] Review severities CRITICAL/HIGH/MEDIUM/LOW -> BLOCK/WARN/INFO/NOTE; dedicated memory-safety pass when touching aligned buffers, SIMD, OpenMP, Mat ROI views, raw-pointer accessors, file/JSON parsing. (code-review)
70. [GENERIC] Fix CRITICAL and HIGH before committing; MEDIUM when cheap. (development-workflow)
71. [GENERIC] Build-resolver: one error at a time, minimal surgical fix, rebuild after each; no `#pragma` warning suppression without approval; no public-signature change unless forced; stop after 3 attempts on the same error / fix adds more errors / architecture change / missing tool. (build-resolver, /cpp-build)
72. [PROJECT] SIMD (AVX2) and OpenMP optional at build time, guarded by `MTC_USE_AVX2`/`MTC_USE_OPENMP`; every SIMD kernel has a scalar twin with identical semantics and a parity test; OpenMP regions touch no shared mutable state without reduction. (P, performance)
73. [PROJECT] Unicode paths: `std::filesystem::path` at API boundary; keep the `imread/imwrite` wide-path helpers. (P)

### (h) Build and environment
74. [PROJECT] Public headers include only OpenCV and the standard library (no Qt); logging/settings through injectable interfaces (`ILogger`), never a host global macro. (P)
75. [PROJECT] Build with CMake + MSVC (x64); the CMake project must also build with clang-cl/GCC; `find_package(OpenCV REQUIRED)` with `OpenCV_DIR` from the environment, never hard-coded in CMakeLists. (P)
76. [PROJECT] `BINPICK_OPENCV_DIR=C:\build_packages\opencv\build` (OpenCV 4.x, vc16). (P, build-resolver)
77. [PROJECT] `cmake`, `clang-format`, `clang-tidy` are not on PATH; they live in `C:\Program Files\Microsoft Visual Studio\18\Community\...`; cppcheck not installed; tools must degrade gracefully and say when skipped. (P, agents, hook)
78. [PROJECT] Generator `-G "Visual Studio 18 2026" -A x64` (fall back to the VS 17 2022 string if CMake does not know 18). (build-resolver, briefs)
79. [PROJECT] Standard commands: configure `cmake -S . -B build -DOpenCV_DIR="$BINPICK_OPENCV_DIR" [-DMTC_WARNINGS_AS_ERRORS=ON]`; build `--config Debug`; `ctest --test-dir build -C Debug --output-on-failure`; single suite `-R <Suite>`. (all)
80. [PROJECT] CMake options: MTC_USE_AVX2, MTC_USE_OPENMP, MTC_BUILD_TESTS/EXAMPLES/DOCS/REFERENCE_HARNESS, MTC_ASAN, MTC_WARNINGS_AS_ERRORS, MTC_TEST_DATA_DIR. (plan)
81. [GENERIC] Formatting via repo `.clang-format` (LLVM base, 4-space, 100 cols); the PostToolUse hook formats automatically. (cpp/coding-style)

### (i) Workflow / pipeline
82. [GENERIC] Workflow: Plan (+ADR for API/algorithm/schema changes, wait for confirmation) -> tdd-workflow or /cpp-test -> implement (/cpp-build if broken) -> verification-loop -> /cpp-review -> conventional commit. (C, development-workflow)
83. [GENERIC] Research and reuse first: check reference code and the library (OpenCV) before writing a utility; prefer porting a proven approach. (development-workflow)
84. [GENERIC] ADR required for: public API shape, config model, algorithm, JSON schema, new matching type. Skill rules: ask before creating the ADR dir; explicit approval before writing an ADR file; number by scanning existing; update README index; statuses proposed -> accepted -> deprecated/superseded; keep short, record rejected alternatives, no ADRs for trivia. (P, ADR skill)
85. [GENERIC] Verification loop phases: 1 Configure, 2 Build (warnings as errors, 0 warnings), 3 Format check, 4 Tests (list skipped by name), 5 Golden comparison (unexplained drift = FAIL), 6 Static analysis (optional), 7 Diff review; output VERIFICATION REPORT with READY/NOT READY. (verification-loop)
86. [GENERIC] Review stage: findings `[SEVERITY] file:line - issue - fix` + counts + verdict; code-review checklist (section 4). (agents, code-review)
87. [GENERIC] Fixed report blocks for implementer, tester, build-resolver, TDD evidence. (agents, skill)
88. [GENERIC] Definition of done per milestone: whole tree green in all configs, 0 warnings, gates clean, docs updated, Opus Approve/Warning, commit with the given message. (briefs "Acceptance", plan section 9)
89. [GENERIC] Briefs are "Not tracked"; Common block carries slot tags, explicit configure options, `--parallel`, final `--clean-first`, acceptance, "Do not commit", SUB-AGENTS. (briefs)

### (j) Project-domain-specific
90. [PROJECT] Vocabulary ban: no picking, gripper, collision, robot, workpiece, jaw vocabulary in `include/` or `src/`. Gate: `grep -riE "pick|gripper|robot|collision|workpiece|jaw" include src --exclude=legacy_keys.cpp` must return nothing; sole exemption `src/model/legacy_keys.cpp` (tests may hold legacy keys as data). (P, ADR-0005, plan DoD)
91. [PROJECT] Downstream acceptance logic plugs in via `IMatchCondition`/`IMatchSetCondition`; the overlap check survives as clearance zones (`ClearanceCondition`), edge-based mode only (rejected at config time for Correlation). (P)
92. [PROJECT] Performance priority (user, 2026-10-13): hot paths allocation-free per call (per-matcher `Workspace`, reserve once); no `cv::Mat::clone()`/temp Mats in per-candidate/angle/layer loops; reserve containers; contiguous SoA float arrays in 32-byte aligned `AlignedBuffer` built at learn time; AVX2+FMA kernels with scalar fallback; OpenMP over angles with ordered merge (thread-count independent results); each hot-path brief states an allocation budget and each review checks it; benchmark target reports stage time and peak allocations; "measure before claiming", numbers in commit message when matcher touched. (P, performance)
93. [PROJECT] Angle convention: degrees wrapped to (-180, 180]; y-down; positive = clockwise on screen; rotation formula given; `geom::rotatePoint(p, o, -angle)` when porting `ptRotatePt2f`; `corners()` order = `cv::RotatedRect::points`; golden LT/RT/RB/LB = corners()[1,2,3,0]; regression compares angles by wrapped difference. (P)
94. [PROJECT] Goldens: JSON under `tests/golden/`; regenerate only with explicit `--update-golden` plus a commit message explaining why; library goldens under `tests/golden/library/<suite>/<case>.json`; agents never edit golden files to make a test pass, they report the mismatch. (P, cpp-tester, plan section 8, briefs)
95. [PROJECT] Regression fixtures `reference_source/Test Images` are read-only; tests may read them. (P)
96. [PROJECT] Preview versions: after every commit that can change matcher output (src/include behavior, every golden update) the lead builds the Release regression exe and runs `node .claude/tools/preview.js <label>`, producing `build-preview/NNN_<date>_<sha>_<label>/` with one annotated PNG per golden case, `summary.tsv`, per-version README, index README; agents never delete old versions (user prunes). (P, M)
97. [PROJECT] Known reference bugs fixed deliberately while porting (`renamePattern` inverted collision check; two more in plan section 3). (C, plan)
98. [PROJECT] 0.1.0 scope: edge-based (port) + correlation (`cv::matchTemplate`), conditions, `PatternGroupManager` JSON schema v3 via cv::FileStorage. (memory, ADRs, plan)
99. [PROJECT] cv::FileStorage JSON conventions: flat point arrays, bool read as int, wide ints as double, `isNone()` for presence, names are values not keys, never pass a path to FileStorage (use bytes + MEMORY mode). (notes/filestorage-findings.md)

### ECC rules that `rules/project.md` overrides
- `ecc/cpp/coding-style.md` "Naming" and Core Guidelines NL.10 (underscore_style) -> project naming table (ADR-0002).
- `ecc/common/coding-style.md` "Immutability (CRITICAL)" -> Mutation policy (the ECC section is removed from that file; header says so).
- `ecc/common/testing.md` "80% coverage / E2E required" -> coverage is a goal, no E2E.
- Skill `cpp-coding-standards` immutability/NL.10 -> overridden by the note in its header.
- `ecc/common/performance.md`: the ECC original (model selection) is replaced by hot-path rules.
- `ecc/cpp/security.md`: carries a project exception (`_mm_malloc` allowed inside one RAII owner).
- Generic statements: top of `project.md` says "Project-specific rules win over `ecc/common/*` and `ecc/cpp/*`"; CLAUDE.md says project.md "overrides everything under `.claude/rules/ecc/`". Identity/no-trailer rules also override the harness default attribution reminder.

---

## 3. Hooks and tools in detail

`settings.json` registers hooks with RELATIVE commands `node .claude/hooks/<name>.js` (works only if the hook cwd is the project root; not `$CLAUDE_PROJECT_DIR`-based). No `permissions`, `env`, `$schema`. All scripts: Node 18+, 'use strict', read the hook JSON from stdin (except sync-memory), use `CLAUDE_PROJECT_DIR` with `process.cwd()` fallback. Exit 2 + stderr = block (Claude sees stderr); exit 0 = allow.

### hooks/protect-reference.js (PreToolUse `Edit|Write|MultiEdit`, timeout 10)
- Blocks: `tool_input.file_path | path | notebook_path` matching `/(^|\/)reference_source\//i` after backslash -> slash. Exit 2, message `[protect-reference] <path> is under reference_source/, which is read-only ...`.
- Allows everything else; malformed JSON -> allow (fail-open).
- Hard-coded: dir name, message mentioning `src/`/`include/`.
- Weaknesses: only Edit/Write/MultiEdit (matcher omits NotebookEdit); Bash writes (`>`, `sed -i`, `cp`, `mv`, `tee`) into the directory are not covered; the directory path without trailing slash is ignored; no `..`/symlink resolution.

### hooks/guard-delete.js (PreToolUse `Bash|PowerShell`, timeout 10)
- Decision: stage 1 regex list `DELETE_PATTERNS` (rm, rmdir, unlink, del, erase, rd, Remove-Item, `ri -`, `rm -Recurse`, `del -`, `[System.IO.File|Directory]::Delete`, `git rm`, `git clean`, `find ... -delete`, `find ... -exec rm`, `shred`, `truncate -s 0`); no match -> allow. Stage 2 `check(cmd)`:
  1. Whole-string regex: any `reference_source` path component anywhere in the command -> block.
  2. `cd|Set-Location|pushd` to an absolute path outside project and temps -> block.
  3. Tokenizer `cmd.match(/"[^"]+"|'[^']+'|[^\s;&|()]+/g)`; skips flags and non-path-like tokens (no slash and no extension) and command words; normalises (backslash -> slash, Git-Bash `/c/x` -> `c:/x`, lowercase, strip trailing slash); relative tokens joined to the project root; `reference_source` -> block; under project root -> ok; under a temp root -> ok; else block "targets a path outside the project folder".
- Temp roots: `CLAUDE_SCRATCHPAD_DIR`, `TMP`, `TEMP`, `TMPDIR`, `os.tmpdir()`, `~/AppData/Local/Temp/claude`, `/tmp`; plus ANY path containing a `/temp/claude/` or `/scratchpad` segment.
- Project root = `CLAUDE_PROJECT_DIR` or cwd.
- Output: stderr `[guard-delete] Blocked: this delete command <reason>` + first line of the command + policy text; exit 2. Empty/malformed -> allow.
- Hard-coded: `reference_source`, temp patterns, policy message.
- Weaknesses: no `..` normalisation (`rm ../outside/file` is treated as inside the project); `~`, `$HOME`, `%USERPROFILE%` not recognised as absolute and mapped under the project; relative `cd ..` followed by a delete is not flagged; unlisted destructive verbs (`mv`, `Move-Item`, `robocopy /MIR`, `xargs rm`, python/perl one-liners, `>` truncation); bare names with no slash/extension are never inspected; `/scratchpad` and `/temp/claude/` substrings are trusted anywhere on disk; the `reference_source` regex fires on any mention inside a delete-containing command (false positives); root falls back to cwd (wrong if the shell is in a subfolder); fail-open on parse errors.

### hooks/format-cpp.js (PostToolUse `Edit|Write|MultiEdit`, timeout 30)
- Acts on extensions `.cpp .cc .cxx .h .hpp .hh .inl`; skips paths matching `/(^|\/)(reference_source|build|_deps|third_party)\//i`; skips if the file does not exist.
- Finds clang-format: PATH (`clang-format --version`, 5 s), else `%ProgramFiles%` and `%ProgramFiles(x86)%` x versions `18, 2022, 2019` x editions `Community|Professional|Enterprise|BuildTools` -> `Microsoft Visual Studio\<ver>\<ed>\VC\Tools\Llvm\x64\bin\clang-format.exe`, then `C:\Program Files\LLVM\bin\clang-format.exe`; none -> silent exit 0.
- Runs `clang-format -i --style=file --fallback-style=LLVM <file>` (15 s). On error writes one stderr line `[format-cpp] clang-format skipped: ...`; always exit 0.
- Hard-coded: extension set, excluded dirs (not `build-wt`, `build-preview`), VS versions/editions, fallback style.
- Weaknesses: probes the executable on every edit (process spawn, no cache); VS versions list must be maintained; Bash-made edits not formatted; if `.clang-format` is missing in the repo LLVM default style (2-space) applies, contradicting the "4-space, 100 cols" rule.

### hooks/sync-memory.js (Stop, no matcher, timeout 15)
- Default: copy top-level `*.md` regular files from the global memory dir to `<project>/.claude/memory/`, delete destination `.md` files absent from source. `--restore` reverses direction (so it can delete global files absent from backup).
- Global dir resolution: env `CLAUDE_MEMORY_DIR`, else `~/.claude/projects/<entry>` whose name equals `path.resolve(root)` with every non-alphanumeric replaced by `-`, case-insensitive, + `/memory`.
- Safety: source must contain `MEMORY.md` else it prints a note and does nothing. Never reads stdin (deliberate). Always exit 0; errors on stderr. Prints a summary only when something changed (or on restore). Writes only files whose bytes differ.
- Weaknesses: only `.md`, no subdirectories; irreversible deletion in destination; restore silently overwrites/deletes global memory; depends on the slug heuristic matching Claude Code's directory naming; hard-coded backup path; runs every turn.

### tools/wt-slot.js (CLI)
- `acquire <tag>` (existing slot for tag, else first free/stale slot; writes `slotN/.lock` = `{tag,time}`; prints slot dir; exit 1 if none free, exit 2 usage), `release <tag>`, `status`, `reclaim` (remove stale locks). Constants `SLOTS = 8`, `STALE_HOURS = 3`, root `<project>/build-wt`.
- Weaknesses: acquire is not atomic (read then plain `writeFileSync`), two concurrent acquires can pick the same slot; re-acquire by the same tag does not refresh the timestamp so a long task can be reclaimed after 3 h; prints an absolute path although `project.md` says `build-wt/slotN`; does not configure CMake.

### tools/preview.js (CLI, domain-specific)
- Usage: `node .claude/tools/preview.js <label> [--note "..."] [--exe <path>] [--filter <gtest filter>] [--clean-export]`.
- Default exe: `<root>/build/tests/regression/Release/mtc_regression.exe`; runs it with `--preview-dir <dir>` (+ `--gtest_filter=`); expects `<suite>/<case>.png` and `summary.tsv` with columns suite, case, status, objects, golden_objects, min_score, max_score, max_pos_err, max_angle_err, max_score_err, state_mismatches, search_ms, note.
- Output: `build-preview/NNN_YYYYMMDD-HHMM_<sha>[-dirty]_<label>/` containing `run.log`, `meta.json`, `README.md` (commit, what changed, totals, reproduce command, diff vs previous version: status/object changes, best score > 0.005, position error > 0.05 px, timing beyond 1.5x, per-suite tables) and regenerates the `build-preview/README.md` index. `-dirty` if `git status --porcelain -- src include tests` is non-empty unless `--clean-export`. Label sanitised, max 40 chars. Never deletes. Console: `[preview] <dir>: N pass, N fail, N skip (exit code)`.
- Hard-coded: `build-preview`, exe path, TSV column names, legend text (green/red/cyan/yellow, clearance zones), git paths, thresholds, `\d{3}_` folder pattern.
- Weaknesses: local-time stamp; creates a version and exits 0 even when the regression exe failed or produced no summary; unguarded `JSON.parse` of meta.json; version counter not concurrency-safe; Windows exe name.

---

## 4. Agents, commands and skills in detail

### Agents (all four have an explicit `tools:` line)

**cpp-implementer** (`model: sonnet`, tools `Read, Write, Edit, Bash, Grep, Glob`)
- Role: implement exactly one scoped task (port a reference file, add a class, wire CMake), build, run targeted tests, report.
- Must: PascalCase types, camelCase methods, `m_camelCase` members, `kPascalCase` constants; ASCII only; English; no Qt/host includes; public headers OpenCV + STL only; read but never edit reference_source; no raw `_mm_malloc` outside `AlignedBuffer`; scalar twin per SIMD kernel; Doxygen on public symbols, `@param[in,out]` for in-place mutation; follow `rules/project.md` and `rules/ecc/cpp/`.
- Must not: create CLAUDE.md/AGENTS.md/design docs in the tree (modules get README.md); delete outside the project or under reference_source; commit.
- Sub-agents: "pass `model: "sonnet"` and these same rules" (but no Agent tool in its `tools:` line).
- Workflow: read brief + reference + headers -> build and run an existing test for RED -> smallest complete change (functions < 50 lines) -> build (`cmake -S . -B build ...`, cmake full-path hint) -> `ctest -R <Suite>` -> report.
- Output:
```
TASK: <brief title>
FILES: <created/modified, one per line>
BUILD: PASS/FAIL (<n> warnings)
TESTS: <suite> passed/total (skipped n)
DEVIATIONS: <anything you could not do as briefed, and why>
NOTES FOR REVIEWER: <risky spots: SIMD, Mat lifetime, angle math, ...>
```

**cpp-tester** (`model: sonnet`, tools `Read, Write, Edit, Bash, Grep, Glob`)
- Role: write and run GoogleTest tests (unit, synthetic, regression with golden JSON); RED mode and GREEN-verify mode.
- Must: GoogleTest FetchContent + `gtest_discover_tests()`; prefer unit > synthetic > regression; regression fixtures from `MTC_TEST_DATA_DIR` with `GTEST_SKIP()` if missing; tolerances (+/-1 px, +/-0.5 deg, +/-0.01) unless golden says otherwise; public API only; ASCII/English/project naming; register in `tests/CMakeLists.txt`; confirm RED fails for the intended reason.
- Must not: `EXPECT_DOUBLE_EQ` on match output; modify `reference_source/`; edit a golden to make a test pass (report instead); commit.
- Sub-agents: `model: "sonnet"` (again no Agent tool).
- Output:
```
TASK: <brief title>
TEST FILES: <created/modified>
MODE: RED / GREEN-verify
RESULT: <suite> passed/total, skipped n (why)
RED EVIDENCE: <failure message excerpt>   (RED mode only)
GAPS: <behaviors you could not test and why>
```

**cpp-reviewer** (`model: opus`, tools `Read, Grep, Glob, Bash`; no Write/Edit = read-only reviewer)
- Role: senior C++ reviewer; runs `git diff -- '*.cpp' '*.hpp' '*.cc' '*.hh' '*.cxx' '*.h' 'CMakeLists.txt'` (or reviews files named by the caller); clang-tidy/cppcheck only if available and says when skipped; starts reviewing immediately.
- Priorities: CRITICAL memory safety (raw new/delete, loose `_mm_malloc`, Mat ROI/`MatchPattern*` beyond lifetime, UAF, invalidated iterators, uninitialised members, out-of-bounds, unaligned AVX loads); CRITICAL correctness (angle wrap, ROI offset, degree/radian mix, score semantics, SIMD vs scalar divergence, OpenMP shared state); HIGH quality (RAII/Rule of Five, noexcept moves, >50-line functions, nesting >4, C-style casts, Qt includes, missing Doxygen); MEDIUM performance (allocations/clone in loops, by-value Mat/configs, missing reserve, `std::endl`); MEDIUM best practices (const, `[[nodiscard]]`, `#pragma once`, magic numbers).
- Output: per finding `[SEVERITY] file:line - issue - concrete fix`; counts per severity; verdict **Approve** (no CRITICAL/HIGH), **Warning** (MEDIUM only), **Block** (any CRITICAL or HIGH).

**cpp-build-resolver** (`model: sonnet`, tools `Read, Write, Edit, Bash, Grep, Glob`)
- Role: fix CMake configure, compile, link errors with minimal surgical changes; never refactor while fixing.
- Embeds environment facts (VS 18 paths, `BINPICK_OPENCV_DIR`, generator `Visual Studio 18 2026`) and diagnostic commands; error -> fix table (C2065, C2672/C2893, C2027, LNK2019, LNK2005, C4996, AVX2 flags, `omp.h`, `<format>`, OpenCV not found).
- Must: one error at a time; no `#pragma` warning suppression without approval; no public-signature change unless forced (then say so). Stop after 3 attempts, if a fix adds more errors, if an architectural change or missing tool is needed.
- Output: per fix `[FIXED] file:line / Error: ... / Fix: ... / Remaining errors: N`; final line `Build Status: SUCCESS/FAILED | Errors fixed: N | Files modified: <list>`.

### Commands (frontmatter only `description`; no `allowed-tools`, `argument-hint`, `model`)
- **/cpp-build** (`commands/cpp-build.md`): invokes the **cpp-build-resolver** agent. Steps: configure + build -> parse/group errors -> fix one at a time -> ctest -> report fixed/remaining/unavailable tools. Order: configure, compile, linker, warnings last. `$ARGUMENTS` = CMake config or target.
- **/cpp-review** (`commands/cpp-review.md`): invokes the **cpp-reviewer** agent (Opus via agent frontmatter) on `git diff` or on `$ARGUMENTS` files. Steps: tidy/cppcheck if available, memory-safety scan, correctness scan, modern-C++/project convention check, report by severity. Severity table: CRITICAL -> Block, HIGH -> Warn, MEDIUM -> Info.
- **/cpp-test** (`commands/cpp-test.md`): NO agent named; an inline TDD procedure (define interface in `include/mtc/`, write RED tests, build/run, implement GREEN, refactor, report), uses skills `cpp-testing` and `tdd-workflow`; includes sample tests, coverage commands, DO/DON'T; `$ARGUMENTS` = behavior or `*.plan.md`. Executed by whoever runs the slash command (in practice the lead's session).

### Skills (frontmatter `name`, `description`, `metadata.origin`; tdd-workflow also `argument-hint`)
- **architecture-decision-records**: trigger "record this decision", "ADR this", choosing between alternatives, "why did we choose X?". Steps: ask consent to initialise the dir (README index + template), identify decision, gather context, alternatives, consequences, number by scanning, present draft and write only after explicit approval, update the index. Includes ADR format, index format, signals, do/don't, lifecycle, categories. Portable after path substitution (leftover example tree `docs/adr/` with Next.js names).
- **cpp-coding-standards**: trigger writing/reviewing C++; Core Guidelines digest (P, I, F, C, R, ES, E, Con, CP, T, SL, Enum, SF/NL, Per) + quick-reference checklist. Portable except the top project-override header.
- **cpp-testing**: trigger only when writing/updating/fixing C++ tests, configuring GoogleTest/CTest, flaky tests, coverage/sanitizers. gtest/gmock/fixtures, CMake snippets, coverage, sanitizers, flaky guardrails. Portable; project note on top.
- **tdd-workflow**: trigger new feature/knob, bug fix, port a file, continuing a `*.plan.md`. Steps: plan handoff as data -> resolve commands -> state guarantees -> write tests (RED) -> confirm valid RED (runtime or compile-time) -> minimal GREEN -> confirm GREEN + full suite -> refactor -> invoke cpp-reviewer -> TDD EVIDENCE block. Bound to project: `reference_source`, `TEST_DATA_DIR`, tolerances, `tests/unit|regression`, checkpoint commits. Uses `<build>/<test>/<test-one>` placeholders (good pattern for portability).
- **verification-loop**: trigger after feature/port/refactor and before commit. Seven phases + VERIFICATION REPORT block (Configure/Build/Format/Tests/Golden/Static/Diff, `READY/NOT READY`); Continuous Mode (phases 1,2,4 after each ported file). Bound to `-DMTC_WARNINGS_AS_ERRORS`, `$BINPICK_OPENCV_DIR`, golden dir, `reference_source`.

### rules/ecc/common/code-review.md checklist (worth carrying over)
Readable/named, functions < 50 lines, files < 800, nesting <= 4, errors explicit, no cout/printf in library, no Qt/host includes, tests present (regression updated if output changes), Doxygen on new public symbols, goldens changed only with explanation, ASCII only, no CLAUDE.md/AGENTS.md/design docs staged. Memory-safety triggers list. Workflow: git diff -> memory triggers -> checklist -> build + ctest -> compare goldens -> reviewer agent. Common issues: uninitialised members, narrowing without `cvRound`, shallow vs clone, negative pyramid index, angle wrap, ROI offset, TM_SQDIFF vs NORMED semantics, order-dependent overlap filtering, clone/alloc in loops, missing reserve. Approval: Approve = no CRITICAL/HIGH; Warning = only HIGH; Block = CRITICAL.

---

## 5. Brief and ADR formats

### Brief format (docs/briefs/*; no front matter, free-form but consistent)
Briefs do NOT use the `agents.md` template headings (GOAL/CONTEXT/...); the real pattern:
1. Title: `# Brief <id>: <title>` (variants `# Brief M2 2.5: ...`, `# Brief: <title> (<review verdict>)`, `# Spike: ...`, `# Brief M4: ...`).
2. One intro paragraph: audience + status + rules, e.g. `Shared spec for the tester (RED) and the implementer (GREEN). Not tracked in git.` / `Tester task. Not tracked. Rules: ...` / `Not tracked. Base: <previous brief>, ADR-... Rules: .claude/rules/project.md (ALL sections). Never run git add/commit/stash/checkout/reset.`
3. Milestone-spec style headings (m2-2.4b, 2.5, 2.6, m3, m4): `## Goal`, `## Files`, `## API (shared contract; the tester codes against this)`, `## Algorithm (port rules; the reference line numbers are the authority)`, `## Allocation budget`, `## OpenMP`, `## Tests (tester; synthetic, no fixtures)`, `## Acceptance`. Variants: `## Semantics`, `## Public API`, `## Pipeline (match)`, `## Implementation layout`, `## Inputs`, `## Mapping ...`, `## Comparison`, `## Benchmark target`, `## Report`, `## Model notes`, `## 4.1 Schema layer (implementer A)`, `## 4.2 ...`, `## Tests (tester, RED first)`, `## Reuse first`, `## Learning (3.1)`, `## Search (3.2)`, `## Facade (3.3)`.
4. Fix-round style (corr-recall-fix, -fix-2, m4-fix-round*): `## Implementer`, `## Tester` (optional `## Golden workflow`), `## Common`.
5. Single-role style (m3-3.4): `## Mechanism`, `## Case selection`, `## Deliverables`.
6. Spike style (corr-recall-spike): `## Problem`, `## Work location`, `## Measure (...)`, `## Report`.
- `## Common` block (fix rounds): `BUILD: slots (tags ...)`, explicit configure options with `-S <project root>`, generator, `cmake --build <slot> --config <cfg> --parallel 8`, `final build --clean-first`, Acceptance (Release full ctest green, goldens unchanged), "Do not kill processes you did not start. Release slots. SUB-AGENTS: workers "sonnet", reviews "opus". Do not commit."
- Final `## Acceptance`: whole tree green in static Debug/Release and shared Debug, 0 warnings, gates clean (vocabulary, ASCII, untracked references), docs updated, Opus `cpp-reviewer` Approve/Warning, exact commit message (`Commit: feat(model): ...`).
- Style: inline cross-refs to ADRs, notes, plan sections and reference line numbers; finding IDs (M-1, L4, C1); "Not tracked" marker.

### ADR format (docs/adr/template.md = skill format)
```
# ADR-NNNN: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: proposed | accepted | deprecated | superseded by ADR-NNNN
**Deciders**: [who was involved]

## Context
## Decision
## Alternatives Considered
### Alternative 1: [Name]
- **Pros**:
- **Cons**:
- **Why not**:
## Consequences
### Positive
### Negative
### Risks
```
Real ADRs add: Status qualifier (`accepted (with plan rev 3, 2026-10-13)`), Date with revision (`2026-10-13 (revision 2, ...)`), and appended `## Amendments (date, reason)` / `## Amendment N (date, reason): <title>` sections (ADR-0004: Amendments + 2, 3, 4; ADR-0005: one) - not in the template. File name `NNNN-short-title.md`.

### ADR README index (docs/adr/README.md)
```
# Architecture Decision Records

Format and workflow: `.claude/skills/architecture-decision-records/SKILL.md`.
New ADR: copy `template.md` to `NNNN-short-title.md`, fill it in, add a row here.
This directory is not tracked in git (design-process docs stay out of the library repo).

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-....md) | <title> | accepted | 2026-10-13 |
```

### Plan file structure (docs/plan/v0.1.0-plan.md), headings only
```
# mtc v0.1.0 - Project Plan   (then Status line + Revision history list)
## 1. Goal
## 2. Scope of 0.1.0
### In
### Out (0.2+)
### Removed from the reference on purpose (ADR-0005)
## 3. Architecture decisions
### Open questions for the user
## 4. Result pipeline (both modes)
## 5. Target layout
## 6. Milestones and tasks
### M0 - Bootstrap
### M1 - Core types, data model, reference harness
### M2 - Edge-based pipeline port
### M3 - Correlation mode
### M4 - Persistence and manager
### M5 - Release 0.1.0
## 6b. Notes for the regression suite (recorded during M1)
## 7. Risks and mitigations
## 8. Tolerances
## 9. Definition of done (0.1.0)
## 10. Lead's execution protocol
## 11. Progress
```
Milestone sections: tables `# | Task | Agent | Acceptance` + a "Commit: `<message>`" line. Progress: checkbox list `- [x] Mx name (done date; commits; review verdicts; test counts)`. `docs/notes/*.md` are free-form dated notes.

### Memory file format
```
---
name: <slug>
description: "<one-line summary>"
metadata:
  node_type: memory
  type: feedback|project|user
  originSessionId: <uuid>
  modified: <ISO>
---
<fact paragraph>
**Why:** ...
**How to apply:** ...  (links like [[other-memory]])
```
`MEMORY.md` lines: `- [Title](file.md) - one-line hook`.

---

## 6. Parameterization candidates

| value | where it appears | notes |
|---|---|---|
| Git identity `dev28 <devgbit@gmail.com>` + "no AI trailer" | `rules/project.md`, `CLAUDE.md` (workflow 5), `rules/ecc/common/git-workflow.md`, `memory/feedback-repo-conventions.md`, `memory/MEMORY.md`, plan DoD | |
| Project folder `C:\DGB\Project\image_matching` | `rules/project.md` (deletion policy "Root"), `memory/feedback-repo-conventions.md`, briefs (`-S C:/DGB/Project/image_matching`, `-DMTC_TEST_DATA_DIR=...`) | use `CLAUDE_PROJECT_DIR` |
| Protected read-only dir `reference_source/` (+ fixtures `reference_source/Test Images`) | `hooks/protect-reference.js`, `hooks/guard-delete.js` (twice + message), `hooks/format-cpp.js`, `CLAUDE.md`, `project.md`, agents, rules, skills | make a list of protected dirs |
| Format-exclusion dirs `reference_source|build|_deps|third_party` | `hooks/format-cpp.js` | config list |
| C++ extensions `.cpp .cc .cxx .h .hpp .hh .inl` | `hooks/format-cpp.js`; `rules/ecc/cpp/*` `paths:` globs (`**/*.cpp ... CMakeLists.txt, *.cmake, tests/**`) | |
| ASCII-only file types `.cpp/.h/.cmake/CMakeLists.txt/README.md` | `project.md`, implementer, code-review checklist | text only, no hook |
| clang-format search: VS versions `18,2022,2019`, editions, `C:\Program Files\LLVM\bin`; `--fallback-style=LLVM` | `hooks/format-cpp.js` | |
| Delete verbs list; temp roots (`CLAUDE_SCRATCHPAD_DIR`, TMP, `~/AppData/Local/Temp/claude`, `/tmp`, `/scratchpad`, `/temp/claude/`) | `hooks/guard-delete.js` | |
| Memory dirs: backup `.claude/memory`, global `~/.claude/projects/<slug>/memory`, env `CLAUDE_MEMORY_DIR`, required `MEMORY.md` | `hooks/sync-memory.js`, `project.md`, memory notes | slug rule `[^A-Za-z0-9]` -> `-`, lowercase |
| Build slots: dir `build-wt`, count 8, stale 3 h, tag naming | `tools/wt-slot.js`, `project.md`, `agents.md` brief template | lead tree `build`; `build-*` gitignore |
| Preview dir `build-preview`, exe `build/tests/regression/Release/mtc_regression.exe`, flag `--preview-dir`, TSV columns, thresholds | `tools/preview.js`, `project.md`, memory | domain-specific; drop or generalise |
| Golden paths `tests/golden/`, `tests/golden/library/<suite>/<case>.json`, flag `--update-golden`, `*_cases.json` | `project.md`, testing rules, tester agent, verification-loop, briefs | |
| Test-data variable `MTC_TEST_DATA_DIR` (default `reference_source/Test Images`) vs `TEST_DATA_DIR` | `project.md`, tester agent, briefs vs testing.md, cpp-testing, tdd-workflow, /cpp-test, ecc/cpp/testing | inconsistent |
| Tolerances (1 px, 0.5 deg, 0.01; tight 0.25 px/0.1 deg/0.005) | `ecc/common/testing.md`, tester, tdd-workflow, plan section 8, briefs | |
| Toolchain env `BINPICK_OPENCV_DIR` (`C:\build_packages\opencv\build`), `OpenCV_DIR` | `CLAUDE.md`, `project.md`, implementer, build-resolver, 3 commands, skills, `ecc/cpp/hooks.md`, `ecc/cpp/testing.md`, briefs | name inherited from old app |
| VS install path `C:\Program Files\Microsoft Visual Studio\18\Community\...` (cmake bin, `VC\Tools\Llvm\x64\bin`) | `project.md`, `CLAUDE.md`, implementer, reviewer, build-resolver | |
| Generator `Visual Studio 18 2026 -A x64` / MSVC 14.51 | build-resolver, briefs, CLAUDE.md; `project.md` says "MSVC 2022" | |
| Configure/build/test commands (`cmake -S . -B build ...`, `--config Debug`, `ctest --test-dir build -C Debug -R`, `--parallel 8`, `--clean-first`) | CLAUDE.md, agents, 3 commands, tdd/verification/cpp-testing skills, `ecc/cpp/*`, briefs | parameterise as `<configure>/<build>/<test>/<test-one>` like tdd-workflow |
| CMake option names `MTC_*` | commands, skills, briefs, plan | |
| Library layout: namespace `mtc`, `include/mtc/`, `src/`, `tests/unit|synthetic|regression|bench`, `docs/`, `examples/` | project.md "Where things live", agents | |
| Naming convention table | `project.md`, implementer | swap for another style |
| Vocabulary gate regex + exemption `src/model/legacy_keys.cpp` | `project.md`, plan DoD, briefs | |
| Model names `sonnet` (workers) / `opus` (reviewers) | agent frontmatter, `project.md`, `agents.md`, memory, CLAUDE.md, every brief | |
| Agent names `cpp-*` and commands `/cpp-*` | everywhere | |
| Doc dirs `.claude/docs/adr|plan|briefs|notes` | ADR skill, project.md, CLAUDE.md, README | |
| Docs policy: allowed tracked markdown (`README.md`, `CHANGELOG.md`, `docs/`), forbidden `CLAUDE.md/AGENTS.md/AGENT.md` | `project.md`, code-review checklist | |
| `.claude/` ignore mechanism (global `~/.config/git/ignore`) | `project.md`, CLAUDE.md, memory | |
| User language Vietnamese | `memory/user-language-vietnamese.md`, `project.md` | |
| Perf budgets (zero steady-state allocation, AVX2/OpenMP) | `project.md`, `ecc/common/performance.md`, briefs | |
| Angle convention | `project.md`, briefs, reviewer | |
| Size limits: function 50 lines, file 800, nesting 4, coverage 80% | `ecc/common/*`, reviewer, implementer | |
| Hook timeouts 10/10/30/15 s; hook paths `.claude/hooks/*.js` | `settings.json` | prefer `$CLAUDE_PROJECT_DIR` |
| Slot line in brief template (`SLOT=$(node .claude/tools/wt-slot.js acquire <tag>)`) | `ecc/common/agents.md`, `project.md` | |
| Version/milestone tags (`v0.1.0`, M0-M5), commit scopes | plan, briefs, CLAUDE.md, git-workflow | |

---

## 7. Issues spotted

Contradictions / stale content
1. `CLAUDE.md` "Status (2026-10-13)" is stale: says only M0 done and "plan rev 3 awaits approval"; memory/plan show M0-M4 + recall fix done and plan/ADRs approved. Its "Next:" port list describes finished work. CLAUDE.md does not mention `tools/` (wt-slot, preview), build slots, preview versions or memory; only `project.md` does.
2. ADR status contradictions: ADR README and ADR files say `accepted`; plan section 3 and `memory/project-image-matching-library-goal.md` and the `MEMORY.md` line say ADRs 0001-0005 "proposed".
3. Reviewer verdict conflict: `agents/cpp-reviewer.md` = Block on any CRITICAL or HIGH, Warning for MEDIUM only; `rules/ecc/common/code-review.md` = Block only on CRITICAL, Warning on HIGH; `commands/cpp-review.md` = HIGH -> Warn; `agents.md` says reviewer must give Approve or Warning.
4. Commit authority: agents and briefs say only the lead commits; `skills/tdd-workflow` prescribes checkpoint commits for RED/GREEN/refactor.
5. Build directory conflict: `project.md` says agents never create build dirs and must use `wt-slot` slots, but `cpp-implementer`, `cpp-build-resolver`, `/cpp-build`, `/cpp-test`, `verification-loop`, `tdd-workflow`, `ecc/cpp/*` all use `build/` (the lead's tree). The slot protocol appears only in `project.md`, the brief template and briefs, not in agent definitions.
6. `/cpp-test` names no agent while the lead may not write tests; unclear who runs it. Its examples use reference API names (`matched_Angle`, `computeMatchAngle`).
7. Test-data variable inconsistent: `MTC_TEST_DATA_DIR` (project.md, tester, briefs) vs `TEST_DATA_DIR` (ecc/common/testing.md, tdd-workflow, cpp-testing note, /cpp-test, ecc/cpp/testing.md).
8. `ecc/common/coding-style.md` YAGNI says "`MatchingType::Correlation` is reserved; do not implement it", contradicting the 0.1.0 scope. `ecc/common/patterns.md` and `coding-style.md` still mention `IRobotPickingChecker`, `WorldPickPose`, `hasCollision`, contradicting the vocabulary ban / "not ported" (not caught by the grep gate since under `.claude/`).
9. Plan section 2 says angle is "counter-clockwise positive"; `project.md` (decided later) says positive = CLOCKWISE. Plan not updated.
10. `project.md` says "MSVC 2022 (x64)" while CLAUDE.md/agents/briefs use Visual Studio 18 / MSVC 14.51 / "Visual Studio 18 2026"; `ecc/cpp/coding-style.md` says "MSVC 2022 and GCC 12".
11. `ecc/common/hooks.md` says to configure `permissions.allow` in settings.json but there is no permissions block; says hooks "<2 s" while timeouts are 10/10/30/15 s (clang-format itself up to 15 s).
12. `ecc/common/hooks.md` and `project.md` describe guard-delete as blocking deletes outside the project, but the implementation has bypasses (item 22).
13. Implementer/tester/resolver say "if you spawn a sub-agent pass model sonnet" but their `tools:` lines contain no Agent tool, so the instruction is dead; "applies at every depth" cannot be enforced.
14. Memory frontmatter inconsistent: `feedback-preview-versions.md` lacks `node_type`, `originSessionId`, `modified`. Memory duplicates rules held in `project.md`/`agents.md` (3-4 copies of lead/model policy and repo conventions: drift risk; `project-image-matching-library-goal.md` still says IRobotPickingChecker is kept as a port and ADRs "proposed", contradicting ADR-0005).
15. ADR skill leftovers: example tree still shows `docs/adr/` with Next.js/Postgres sample names; "Planner agent"/"Code reviewer agent" integration points refer to agents not installed. ADRs carry Amendments sections and free-text Status qualifiers that the template does not define.
16. `cpp-coding-standards` and `cpp-testing` are labelled "verbatim" but have prepended project notes; `cpp-coding-standards` still teaches immutability-by-default and `underscore_style`, which the project overrides (header says so).
17. `ecc/cpp/hooks.md` and `ecc/cpp/testing.md` use `%BINPICK_OPENCV_DIR%` (cmd) while everything else uses `$BINPICK_OPENCV_DIR` (bash); `paths:` globs differ between cpp rule files (coding-style/testing include CMake files; patterns/security omit them).
18. `ecc/cpp/coding-style.md` requires a repo `.clang-format` (LLVM base, 4-space, 100 cols) that is not part of `.claude`; the hook falls back to default LLVM style when missing.
19. Briefs ignore the `agents.md` brief template headings; three brief naming styles (`mX-...`, `corr-recall-*`, `preview-and-src5-...`).
20. Briefs contain hard-coded scratchpad paths with session UUIDs (`corr-recall-impl.md`, `corr-recall-spike.md`, `m4-fix-round*.md`) and the absolute project path; not reusable.
21. `project.md` says `wt-slot.js acquire` prints `build-wt/slotN`; it prints an absolute path.

Hook/tool bugs and weaknesses
22. `guard-delete.js`: no `..` normalisation (`rm ../x` is treated as inside the project); `~`, `$HOME`, `%VAR%` paths not recognised as absolute; relative `cd ..` then delete not flagged; many destructive verbs unlisted (`mv`, `Move-Item`, `robocopy /MIR`, `xargs rm`, interpreter one-liners, redirect truncation); bare names without slash/extension never inspected; `/scratchpad` and `/temp/claude/` substrings trusted anywhere; the `reference_source` regex fires on any mention in a delete-containing command (false positives); root falls back to cwd; fail-open on parse errors.
23. `protect-reference.js`: only Edit/Write/MultiEdit; Bash writes, NotebookEdit and moves into/out of the directory unprotected; substring regex without `..`/symlink resolution.
24. `format-cpp.js`: spawns `clang-format --version` on every edit (no caching), hard-coded VS version list, excludes `build/` but not `build-wt/`/`build-preview/`, `.inl` formatted but `.cmake` not.
25. `sync-memory.js`: runs every turn; `--restore` can delete global memory files; top-level `.md` only; relies on the project-dir slug heuristic; no locking.
26. `wt-slot.js`: acquire race (non-exclusive write); timestamps never refreshed (long tasks reclaimable after 3 h while still running).
27. `preview.js`: exits 0 and creates a version even if the regression exe failed or wrote no summary; unguarded `JSON.parse` of meta.json; domain-specific legend; hard-coded Release exe path.
28. `settings.json`: relative hook commands depend on cwd (no `$CLAUDE_PROJECT_DIR`); matchers omit `NotebookEdit`; no permissions/env sections; no `$schema`.
29. Reviewer has `Bash` while documented as read-only; implementer/tester/resolver have Write/Edit/Bash with no path restriction beyond the hooks (golden files are protected only by prose, not by a hook).
30. No hook enforces the textual policies: ASCII-only, English-only, vocabulary gate, no CLAUDE.md in tree, commit identity/trailers, golden edits.
