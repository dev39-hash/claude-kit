# Inventory of `reference/claude5/` (a `.claude/` snapshot of the `mc_protocol` project)

All paths are relative to `C:\DGB\Project\setup-project\reference\claude5\`. Nothing under `reference/` was modified; `.claude\temp\` was not read.

Orientation: the snapshot is the project's `.claude/` folder, but `agent-team/` lives at the PROJECT ROOT in the original repo (`settings.json` hook points at `$CLAUDE_PROJECT_DIR/agent-team/project/hooks/...`, agent shims point at `agent-team/core/roles/...`). `agent-skills/` is a full clone of the upstream repo (addyosmani/agent-skills v0.6.10, MIT) dropped in as reference material. It is not live: no hook wiring, no settings, its own CLAUDE.md/AGENTS.md say "do not copy into other projects". Top-level `skills/ agents/ commands/ references/` ARE the live, trimmed copies (owner decision 2026-09-27).

Byte-comparison results (cmp / diff run):
- `references/*.md` (7): byte-identical to `agent-skills/references/*`.
- `skills/*` (15 skills, 20 files incl. subfiles): byte-identical to `agent-skills/skills/*`.
- `agents/code-reviewer.md`, `security-auditor.md`, `test-engineer.md`: byte-identical to upstream.
- `commands/*.md` (8): NOT identical to `agent-skills/.claude/commands/*.md`; the only diff is that the `agent-skills:` namespace prefix was stripped from skill names (e.g. "Invoke the agent-skills:test-driven-development skill" -> "Invoke the test-driven-development skill"). `webperf.md` omitted.
- `agent-team/project/skill-pack/**` (LICENSE, 6 skills, orchestration-patterns.md): byte-identical to upstream.
- Owner-written: `agent-team/**` (except skill-pack), `agents/team-*.md`, `memory/*.md`, `settings.json`, `agent-team/project/hooks/subagent-model-guard.ps1`.

---

## 1. Inventory table

| path | kind | purpose | model | hook event + matcher | origin |
|---|---|---|---|---|---|
| `settings.json` | settings | env vars forcing every subagent to Sonnet + PreToolUse hook on `Agent` | - | PreToolUse, matcher `Agent` -> `subagent-model-guard.ps1` | owner-written (content duplicated verbatim in `agent-team/project/rules.md`) |
| `agent-team/README.md` | doc | layout table (core / project / memory / agents / tasks / CLAUDE.md) + 5-minute reading order | - | - | owner-written |
| `agent-team/core/WORKFLOW.md` | rule | task lifecycle, 5 ground rules, 2 human gates, rework loop, session recovery | - | - | owner-written (GENERIC) |
| `agent-team/core/PORTING.md` | doc | 5-step guide to port the core to a new project + generic/project checklist | - | - | owner-written (GENERIC) |
| `agent-team/core/roles/team-leader.md` | rule (role) | main-session role: intake, plan, gates, spawn, route bounces, memory | main session's own model | - | owner-written (GENERIC) |
| `agent-team/core/roles/developer.md` | rule (role) | developer contract + what "Dev notes filled in" means | Sonnet (forced by env) | - | owner-written (GENERIC) |
| `agent-team/core/roles/tester.md` | rule (role) | tester contract, biased read order, Test report definition | Sonnet | - | owner-written (GENERIC) |
| `agent-team/core/roles/reviewer.md` | rule (role) | reviewer contract, read order, severity scale, Review verdict | Sonnet | - | owner-written (GENERIC) |
| `agent-team/core/templates/task.md` | template | baton file `tasks/active/T-xxx.md` | - | - | owner-written |
| `agent-team/core/templates/project-context.md` | template | -> `project/project-context.md` | - | - | owner-written |
| `agent-team/core/templates/project-rules.md` | template | -> `project/rules.md` | - | - | owner-written |
| `agent-team/core/templates/task-classification.md` | template | -> `project/task-classification.md` (4 default classes) | - | - | owner-written |
| `agent-team/core/templates/decisions.md` | template | -> `memory/decisions.md` | - | - | owner-written |
| `agent-team/core/templates/lessons.md` | template | -> `memory/lessons.md` | - | - | owner-written |
| `agent-team/project/project-context.md` | doc (project) | what the project is, key docs, build/test commands, layout, current state | - | - | owner-written (PROJECT, mc_protocol) |
| `agent-team/project/rules.md` (296 lines, ~20 KB) | rule (project) | hard rules + a long log of owner delegations; subagent-model rule; skill-pack mapping; HIL gates; engineering rules | - | - | owner-written (PROJECT, mixed with GENERIC patterns) |
| `agent-team/project/task-classification.md` | rule (project) | classes full/docs/trivial/protocol-core/hil | - | - | owner-written (PROJECT) |
| `agent-team/project/definition-of-done.md` | rule (project) | standing DoD checklist tailored for C++17/Qt6 library from upstream `references/definition-of-done.md` | - | - | owner-written (adapted from upstream, PROJECT) |
| `agent-team/project/build-env.md` (372 lines, ~24 KB) | doc (project) | proven build/test commands and gotchas for this Windows PC (CMake, MSVC, MinGW, qmake, Qt 5/6, serial pairs) | - | - | owner-written (PROJECT / machine) |
| `agent-team/project/hooks/subagent-model-guard.ps1` | hook | blocks `fork` subagents and any explicit non-sonnet `model` | - | PreToolUse, `Agent` (wired from `settings.json`) | owner-written |
| `agent-team/project/skill-pack/README.md` | doc | explains the vendored subset (6 skills + orchestration-patterns), byte-identical rule, unresolved links | - | - | owner-written |
| `agent-team/project/skill-pack/LICENSE` | doc | MIT, (c) 2025 Addy Osmani | - | - | copy of upstream |
| `agent-team/project/skill-pack/skills/{test-driven-development,incremental-implementation,source-driven-development,debugging-and-error-recovery,code-review-and-quality,doubt-driven-development}/SKILL.md` | skill (6) | role-advisory techniques | - | - | copy of upstream |
| `agent-team/project/skill-pack/references/orchestration-patterns.md` | doc | linked from doubt-driven-development | - | - | copy of upstream |
| `agent-team/memory/decisions.md` (59 entries, ~21 KB) | memory | curated project decisions, newest first | - | - | owner-written (living) |
| `agent-team/memory/lessons.md` (35 entries, ~12 KB) | memory | curated lessons learned, newest first | - | - | owner-written (living) |
| `agents/team-developer.md`, `team-tester.md`, `team-reviewer.md` | agent (shim) | thin Claude Code subagent definitions that point to core role files; frontmatter only `name`, `description` (no `model`, no `tools`) | forced Sonnet via env | - | owner-written (GENERIC, copied verbatim to new projects) |
| `agents/code-reviewer.md` | agent | five-axis reviewer persona (verdict APPROVE / REQUEST CHANGES) | none set (forced Sonnet by env) | - | copy of upstream |
| `agents/security-auditor.md` | agent | security/threat-model persona incl. LLM Top 10 | none set | - | copy of upstream |
| `agents/test-engineer.md` | agent | QA / coverage / Prove-It persona | none set | - | copy of upstream |
| `commands/{spec,plan,build,test,review,code-simplify,ship,constraints}.md` | command (8) | slash commands (see section 5) | - | - | upstream with `agent-skills:` prefix removed (modified copy); NOT used per `rules.md` |
| `memory/MEMORY.md` | memory (index) | one-line pointers to 6 memory files | - | - | owner-written |
| `memory/ask-before-reading-outside-project.md` | memory (feedback) | ask before reading outside project root | - | - | owner-written (PROJECT paths) |
| `memory/memory-dual-copy-sync.md` | memory (feedback) | keep Claude memory dir and `.claude/memory` identical | - | - | owner-written |
| `memory/git-commit-identity-no-ai-trailer.md` | memory (feedback) | commit identity `dev28`, no AI trailers, also for PRs | - | - | owner-written |
| `memory/agent-team-system-staged.md` | memory (project) | team workflow in use; progress bookkeeping at each commit | - | - | owner-written |
| `memory/fresh-subagent-per-task-when-context-heavy.md` | memory (feedback) | spawn a new subagent per task | - | - | owner-written |
| `memory/hil-capture-prerequisites-open.md` | memory (project) | HIL capture state log; Phase 9 waits | - | - | owner-written (PROJECT) |
| `references/{accessibility,observability,performance,security}-checklist.md`, `testing-patterns.md`, `definition-of-done.md`, `orchestration-patterns.md` | doc (7) | upstream checklists (web/JS oriented except DoD and orchestration) | - | - | copy of upstream |
| `skills/<15 skills>/SKILL.md` (+ `constraint-driven-development/references/floor-guard.md`, `idea-refine/{examples,frameworks,refinement-criteria}.md`, `idea-refine/scripts/idea-refine.sh`) | skill (15) | see section 5 | - | - | copy of upstream |
| `agent-skills/README.md` | doc | upstream README (25 skills, 9 commands, install per host) | - | - | agent-skills upstream |
| `agent-skills/CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md` | doc | rules for contributing to the upstream repo itself ("do not copy into other projects") | - | - | agent-skills upstream |
| `agent-skills/.claude/rules/skills-contributing.md` | rule | path-scoped (`paths: skills/**`) anti-duplication guardrail for adding skills | - | - | agent-skills upstream |
| `agent-skills/.claude/commands/*.md` (9 incl. `webperf.md`) | command | upstream originals with `agent-skills:` prefixes | - | - | agent-skills upstream |
| `agent-skills/commands/*.toml` (build, code-simplify, constraints, planning, review, ship, spec, test, webperf) | command (Antigravity legacy TOML) | names only | - | - | agent-skills upstream |
| `agent-skills/agents/{code-reviewer,security-auditor,test-engineer,web-performance-auditor}.md` | agent (4) | personas; the web-performance-auditor (12 KB) exists only here | none set | - | agent-skills upstream |
| `agent-skills/hooks/session-start.sh` (+ `session-start-test.sh`) | hook | injects `using-agent-skills` meta-skill at session start | - | SessionStart (documented, not wired) | agent-skills upstream |
| `agent-skills/hooks/sdd-cache-pre.sh` | hook | WebFetch cache revalidation, blocks fetch on HTTP 304 | - | PreToolUse `WebFetch` (documented, not wired) | agent-skills upstream |
| `agent-skills/hooks/sdd-cache-post.sh` | hook | stores WebFetch result + ETag/Last-Modified | - | PostToolUse `WebFetch`, async (documented, not wired) | agent-skills upstream |
| `agent-skills/hooks/simplify-ignore.sh` (+ `simplify-ignore-test.sh`) | hook | hides `simplify-ignore-start/end` blocks from the model during `/code-simplify` | - | PreToolUse `Read`, PostToolUse `Edit\|Write`, `Stop` (documented, not wired) | agent-skills upstream |
| `agent-skills/hooks/SDD-CACHE.md`, `SIMPLIFY-IGNORE.md` | doc | setup JSON + limitations of those hooks | - | - | agent-skills upstream |
| `agent-skills/plugin.json`, `.claude-plugin/{plugin,marketplace}.json`, `.agents/plugins/marketplace.json`, `.gitignore`, `.gitattributes`, `.opencode/skills` (a symlink-like text file `../skills/`), `LICENSE` | settings/doc | plugin manifests (v0.6.10, MIT, Addy Osmani) | - | - | agent-skills upstream |
| `agent-skills/references/*.md`, `skills/**` (25 skills) | skill/doc | full upstream set (adds browser-testing-with-devtools, ci-cd-and-automation, frontend-ui-engineering, shipping-and-launch + the 6 in skill-pack) | - | - | agent-skills upstream |
| `agent-skills/{evals,docs,scripts,.gemini,.codex-plugin,.github}/` | skipped | not read per instructions (docs has 16 setup guides; scripts has validate-*.js / run-evals.js) | - | - | agent-skills upstream |

---

## 2. The agent-team system in full

### 2.1 Concept and layering
A markdown-only workflow for a four-role team in Claude Code: **team leader** (= the main session) plus three subagents **developer, tester, reviewer** (spawned from `.claude/agents/team-*.md`). One task at a time. The single source of truth for task state is a per-task "baton" file `tasks/active/T-xxx.md` (never the conversation).

Layers (physical split, "the boundary is the directory tree, not naming discipline", decision 2026-09-27):

| Where | What | Layer |
|---|---|---|
| `agent-team/core/` | WORKFLOW, PORTING, roles, templates | GENERIC, copy verbatim, never edit per project |
| `agent-team/project/` | project-context, rules, task-classification (+ here: build-env, definition-of-done, hook, skill-pack) | PROJECT, written fresh |
| `agent-team/memory/` | decisions.md, lessons.md | PROJECT living files, curated by leader |
| `.claude/agents/team-*.md` | subagent shims | GENERIC |
| `tasks/active/`, `tasks/done/` | baton files | PROJECT living |
| `CLAUDE.md` (root) | snippet pointing main session to the leader role | GENERIC snippet in a project file |

Precedence: "Project layer wins" (WORKFLOW ground rule 5; project templates say "Where a rule here contradicts `agent-team/core/`, this file wins").

### 2.2 WORKFLOW.md step by step
Ground rules:
1. The task file is the baton: a role that has not written its section has not finished; an empty section proves a step was skipped.
2. Subagents never talk to the human: a blocked subagent writes its question into its section, sets `Status: blocked`, returns to the leader.
3. Two human gates, always: Gate 1 = plan approved (no implementation before; `hil` tasks also wait for hardware prep); Gate 2 = commit approved (no commit before the human saw diff + completed task file; commit per `project/rules.md`).
4. Classification decides the path (per `project/task-classification.md`, recorded in the task file); skipping tester/reviewer is legal only when the class allows it.
5. Project layer wins; core files are never edited per project.

Lifecycle: `intake -> plan -> [GATE 1] -> develop -> test -> review -> [GATE 2] -> commit -> close`, FAIL loops back (test FAIL -> develop; review FAIL -> develop).
1. Intake: leader creates `tasks/active/T-xxx.md` from `core/templates/task.md`; sequential IDs; `Plan ref` links the project's own plan item.
2. Plan: leader writes goal, approach, files expected to change, acceptance criteria, verification commands, classification.
3. Gate 1: human approves/edits; leader records approval in the task file.
4. Develop: leader spawns `team-developer` with the task file path; developer implements exactly the Plan, fills Dev notes.
5. Test (unless class skips): `team-tester` verifies the criteria independently, fills Test report PASS/FAIL. FAIL -> leader sends back to develop with the report.
6. Review (unless class skips): `team-reviewer` judges the diff, fills Review verdict PASS/FAIL. Reviewers never fix code.
7. Gate 2: human reviews diff + task file; on approval leader commits per project rules and fills Commit record.
8. Close: move file to `tasks/done/`; distill decisions/lessons into `agent-team/memory/` (one or two lines, linked to the task ID).

Rework loops: bounces go THROUGH the leader, never subagent-to-subagent; leader re-spawns developer with the failing report quoted; flow re-enters at the failed step (test re-runs before review; review FAIL -> develop then test again if class needs it). Two consecutive FAILs on the same step -> leader stops and consults the human.

Session recovery: read in order `CLAUDE.md` -> `core/roles/team-leader.md` -> `project/*.md` -> `memory/*.md` -> `tasks/active/*.md`; the first empty section of an active task is where work resumes.

### 2.3 Roles

**Team leader** (`core/roles/team-leader.md`; main session, not an agent file; wired via the CLAUDE.md snippet)
- Session start reads: `project/project-context.md`, `project/rules.md`, `project/task-classification.md`, `memory/decisions.md`, `memory/lessons.md`, then every file in `tasks/active/`. Resume at first empty section; do not ask the human to re-explain what the files answer.
- Responsibilities: Intake & plan (concrete plans: files, acceptance criteria, verification commands; classify and write the class + consequences); Hold Gate 1 (record approval verbatim with date + conditions before spawning anyone; `hil` additionally confirms hardware prerequisites); Spawn in sequence developer -> tester -> reviewer as class requires, each given "the task file path and nothing else about the solution" (never paste own opinion of the code into the reviewer prompt); Route bounces (re-spawn developer with report quoted; 2 consecutive FAILs -> ask human); Hold Gate 2 (show diff summary + task file; only after approval commit exactly per rules, fill Commit record, move file to `tasks/done/`); Keep memory (after close distill to decisions.md / lessons.md, 1-2 lines prefixed with task ID; "Memory is curated, not a log").
- Boundaries: never commit without Gate 2 approval even for a one-character change; never edit `agent-team/core/`; trivial-class tasks the leader may implement itself but both gates still apply; if the human's request conflicts with project rules, say so before acting. Does not implement/test/review non-trivially itself.

**Developer** (`core/roles/developer.md`, shim `agents/team-developer.md`; Sonnet)
- Implements exactly what the approved Plan says, nothing more. Done only when Dev notes is filled.
- Read order: task file (Plan = contract), `project/project-context.md`, `project/rules.md` ("hard rules; they override your habits"), any spec the Plan links.
- If Plan ambiguous/infeasible: do not improvise; write the question into Dev notes, `Status: blocked`, return.
- While implementing: stay inside the Plan's file list (unlisted file allowed only if the approach obviously requires it; record with reason); tests named in acceptance criteria are part of the implementation (write, run, make pass); run Plan's verification commands before declaring done; never commit, never push, never move the task file.
- Dev notes must contain: files changed (path + what, one line each); deviations from Plan with reasons (none is normal); commands run + outcomes (not full logs); anything the tester needs to verify honestly (setup, fixtures, gotchas) but NOT "it works, no need to check X"; `Status: ready-for-test` (or `blocked` + question).
- Shim non-negotiables: implement only the Plan; never commit/push; blocked -> write question, finish reply with the question.

**Tester** (`core/roles/tester.md`, shim `agents/team-tester.md`; Sonnet)
- Verifies acceptance criteria actually hold; "adversary of 'it works on my machine'".
- Read order deliberately biased: (1) Plan only (goal + criteria) and form own verification idea BEFORE reading Dev notes; (2) project-context; (3) rules (esp. hardware gates); (4) only then Dev notes, "for setup, not reassurance".
- Does: verify every criterion by RUNNING something (Plan's verification commands, tests the developer touched, plus at least one probe the developer did not write when the change class warrants); criteria not verifiable here (e.g. real hardware behind a human gate) -> `unverifiable here` with reason, never guess; may write new tests to close gaps (put per project test layout, state in report); never fixes implementation (a describable bug = FAIL with reproduction).
- Test report must contain: one line per criterion (how verified, PASS/FAIL/unverifiable); commands + outcomes; for each FAIL smallest repro, expected vs actual; new tests added; Verdict `PASS` (all pass) or `FAIL` (anything else); `Status: ready-for-review` or back to leader.

**Reviewer** (`core/roles/reviewer.md`, shim `agents/team-reviewer.md`; Sonnet)
- "Last technical gate before the human"; judges with fresh eyes, deliberately given no account of how the code came to be.
- Read order: Plan; the diff (`git diff` or files in Dev notes); `project/rules.md` + linked spec; Dev notes and Test report LAST (to check claims, not adopt conclusions).
- Judges: correctness vs Plan/spec (and nothing unapproved); test adequacy (would fail on regression; no empty assertions; not happy-path-only); project-rule compliance "mechanically"; simplicity (dead code, speculative generality, 3-line fix in 300-line refactor); blast radius (public contract touched without Plan saying so).
- Never edits code; findings written for the developer.
- Review verdict: findings each with severity `blocker | should-fix | nit`, file:line, what and why; zero findings is legitimate, do not invent nits; explicit statement of what was checked and not checked; Verdict `PASS` (no blockers; nits may ride) or `FAIL` (any blocker); `Status: ready-for-commit-gate` or back to leader.

Hand-off format: all hand-offs are through the task file sections + a `Status:` value; the leader passes only the task file path (plus, in rework, the quoted failing report). Status vocabulary used by roles: `ready-for-test`, `ready-for-review`, `ready-for-commit-gate`, `blocked` (see issue 7.8: the template's Status list differs).

### 2.4 Templates (exact headings)

`core/templates/task.md` (baton; filename `tasks/active/T-xxx.md`):
```
# T-xxx: <title>
- **Created:** <date>  ·  **Plan ref:** <item in project plan, or "—">
- **Class:** <per agent-team/project/task-classification.md> → tester: yes/no · reviewer: yes/no
- **Status:** planning | awaiting-gate-1 | developing | testing | reviewing | awaiting-gate-2 | blocked | done
## Plan  *(leader writes; Gate 1 approves)*
- **Goal:** / **Approach:** / **Files expected to change:** / **Acceptance criteria:** (numbered — the tester verifies these one by one) / **Verification commands:** / **Gate 1 approval:** <date, by whom, conditions — empty means NOT approved>
## Dev notes  *(developer writes)*
- Files changed: / Deviations from plan (+ reason): / Commands run / outcomes: / Notes for the tester:
## Test report  *(tester writes — skipped only if Class says so)*
- Per-criterion: #n — how verified — PASS/FAIL/unverifiable / Commands run / outcomes: / Failures (smallest repro, expected vs actual): / New tests added: / **Verdict:** PASS / FAIL
## Review verdict  *(reviewer writes — skipped only if Class says so)*
- Findings (severity · file:line · what/why): / Checked / not checked: / **Verdict:** PASS / FAIL
## Commit record  *(leader writes after Gate 2)*
- **Gate 2 approval:** <date — empty means NOT approved, do not commit> / **Commit:** <hash · message first line> / **Distilled to memory:** <what went to decisions.md / lessons.md, or "nothing">
```
(Project observed additions in practice, not in the template: "Env notes" subsection in a role's section for new environment facts; "Gate 1/2: leader, under owner delegation <date>"; "Test report / Review verdict: deferred to the checkpoint task" under phase batching.)

`core/templates/project-context.md`: title `# Project Context — <project name>`; sections `## What this project is`, `## Key documents` (table What | Where: Spec(s), Implementation plan, Task details / backlog, Reference material), `## How to build and test`, `## Layout in ten lines`, `## Current state`. Guidance: keep under two screens; copy commands from project docs, do not paraphrase.

`core/templates/project-rules.md`: `# Project Rules — <project name>`; `## Version control` (Commit identity, Attribution trailers allowed/forbidden, Commit cadence, Branching), `## Access boundaries`, `## Hardware / environment gates  *(delete section if none)*`, `## Code conventions the reviewer enforces`, `## Anything else non-negotiable`.

`core/templates/task-classification.md`: `# Task Classification — <project name>`; table Class | What qualifies | Tester | Reviewer with defaults: `full` (default; any change to source/build wiring/tests; tester+reviewer required), `docs` (doc/comment-only; tester skip, reviewer required), `trivial` (typo/whitespace in docs, mechanical renames with zero logic; both skip), `hil` (real hardware/gated environments; both required + human hardware-prep confirmed BEFORE Gate 1). Rules of thumb: when in doubt take the stricter class; `docs` that grows a code change is reclassified `full` immediately; `trivial` still passes both human gates ("Nothing skips the human"); add project classes below the line rather than editing the four.

`core/templates/decisions.md`: `# Decisions — <project name>`; format line `- [T-xxx or date] Decision — why. (supersedes: entry, if any)`; one entry one decision, newest first.

`core/templates/lessons.md`: `# Lessons — <project name>`; format `- [T-xxx] What happened → what to do instead.`; newest first.

### 2.5 PORTING.md (5 steps, ~15 min)
1. Copy generic layer: whole `agent-team/core/` unmodified (improvements go back to origin copy and are re-copied forward) + `.claude/agents/team-developer.md`, `team-tester.md`, `team-reviewer.md`.
2. Create `agent-team/project/` and fill three templates: `project-context.md`, `rules.md` (from `project-rules.md`), `task-classification.md`.
3. Create live folders: `agent-team/memory/decisions.md` + `lessons.md` from templates; empty `tasks/active/`, `tasks/done/`.
4. Wire the leader: add to project `CLAUDE.md` a section "## Agent team" saying: "This project runs the agent-team workflow. At session start read `agent-team/core/roles/team-leader.md` and act as team leader. Workflow: `agent-team/core/WORKFLOW.md`."
5. Dry-run one small real task end to end (plan -> gates -> done); check each subagent actually read the project layer (its section in the task file shows whether it followed project commands).
Closing table: Generic = `core/WORKFLOW.md`, `core/roles/*`, `core/templates/*`, PORTING.md, `.claude/agents/team-*.md`, the CLAUDE.md snippet; Project = `project/*.md`, `memory/*.md` (live), `tasks/`, rest of CLAUDE.md.
PORTING.md does NOT cover: `settings.json` env/hook, model-guard script, skill-pack, definition-of-done, build-env (all project-layer extras that exist in this instance).

### 2.6 Project layer in this instance

**task-classification (mc_protocol)**: classes
- `full` (default): library source, tests, build wiring (`CMakeLists.txt`, `.pri`), scripts, tools, examples -> tester + reviewer required.
- `docs`: under `docs/`, README, comments only -> tester skip, reviewer required.
- `trivial`: typo/whitespace in docs or comments -> both skip.
- `protocol-core` (added): codec encode/decode paths, golden vectors (`.vec`), `Parser`/`McProtocol` contract -> both required; reviewer must diff against the relevant `docs/mc_reference/` section, not just the spec.
- `hil`: anything executing against real hardware or changing capture tool's safety gate -> both required + owner hardware-prep confirmed before Gate 1.
Notes: T-tasks map to `full` unless codec/vectors or hardware; golden-vector edits are never `trivial`/`docs` (always `protocol-core`); checkpoint tasks additionally require both compilers green before Gate 2.
What changes per class = which of tester/reviewer run, extra reviewer duty (reference diff), and extra pre-Gate-1 human step (hil).

**definition-of-done.md** (project-tailored from upstream `references/definition-of-done.md`; dropped deploy/rollout/flags/migrations/service observability; added build wiring, library contract, allocation and protocol rules). Opening principle: acceptance criteria answer "did we build this thing?"; DoD answers "is it finished to this project's standard?"; done only when both hold. Who checks what: developer self-checks every section (Dev notes); tester re-verifies Correctness by running; reviewer checks Build, Library contract, Quality, Documentation against the diff; leader checks Process at Gate 2; non-applicable items marked "n/a" with a reason, never silently skipped. Sections: Correctness (criteria verified by running; tests fail-without/pass-with, spec test IDs in test names; error paths tested; task label green in MSVC build + full ctest no regression), Build (warning-free with `MC_WARNINGS_AS_ERRORS=ON`; new source added to CMakeLists AND `.pri`; new test binary gets qmake `.pro`; core/mock headers include nothing from Qt/OS; checkpoint tasks both compilers + `scripts/check.ps1`), Library contract (public headers change only per spec; zero-alloc guarantees ship with ALC tests; complexity per spec; no exception across public boundary, `noexcept` where required; Qt 5.15 + 6.2+ compile; no golden vector edited to make a test pass), Quality (scoped; no dead code/debug output/commented-out blocks; naming per spec + `.clang-format`; no duplicated logic), Documentation (Doxygen style; deviations recorded and raised; `CHANGELOG.md` Unreleased line; docs describe current state, not history), Process (Dev notes/Test report/Review verdict filled per class; nothing committed/pushed by a subagent; nothing read/written outside project folder without owner permission; no real PLC outside approved `hil` task).

**project-context.md**: mc_protocol = C++/Qt library `mc` for Mitsubishi MC protocol (3E, 1E, 3C, 1C), sans-I/O `Session`, mock PLC, Qt device layer, HIL capture toolchain, GUI `mc_workbench`. Key-docs table (docs/spec, tasks/plan.md, tasks/todo.md, docs/hil, doc comment style, DoD, skill pack, intent, mc_reference). Build section points to `build-env.md` FIRST, gives CMake/Ninja/MSVC/MinGW commands and test labels (`build, core_model, core_protocol, core_session, mock, integration, device, replay, hil_tool`). Current state (updated 2026-10-04): Phases 0-8 done; waiting on Checkpoint H demo and Phase 9.

**rules.md** structure (`##` headings): Version control; Phase-batched verification (owner decision 2026-09-27); Access boundaries; Subagents; Skill pack; Definition of Done; Hardware / environment gates; Engineering rules the reviewer enforces. About 55 percent of the file is a chronological log of per-phase "delegation extended to Phase N" paragraphs (owner quotes in Vietnamese). See section 3 for atomic rules.

**build-env.md**: "proven commands for this machine; do not rediscover"; sections: Toolchain (paths table), Rules that save time (7), Parallel builds always (32 cores; jom/-j32; ctest -j 8; worktree slots `.wt/wt1..4` + `scripts/wt-sync.ps1`), MSVC daily loop, MinGW checkpoints, qmake, qmake gotchas, Coverage, CMake script gotchas, GUI tool, Qt Creator, Qt 5.15 (+ x86), Other tools, Tests (doctest, virtual COM pairs COM54/55, mutation-run gotchas). Roles report new env facts under "Env notes" in their task-file section; the leader folds them into this file.

### 2.7 Memory design

`agent-team/memory/decisions.md` - written by the leader (not by subagents) at task close. One entry = one decision, newest first, format `- [T-xxx or date] Decision — why. (supersedes: ...)`. Purpose: stop decisions being re-litigated; read at every session start by the leader. In practice mixes: owner decisions with quotes/dates, leader decisions within delegation, publish/release events, spec amendments, experiment results (skill-pack experiment T-081..T-083). Contains "(supersedes ...)" markers and a few stale/never-used IDs (e.g. "The T-078 id below was never used").
`agent-team/memory/lessons.md` - format `- [T-xxx] What happened -> what to do instead.` newest first; each lesson is a generalizable rule (e.g. "a guard pattern rewritten must be re-run against all inputs the old pattern caught"; "stop only processes you started by PID"; "design safety checks as allow-lists").
Intended use: curated after task close, 1-2 lines, linked to the task ID; "Memory is curated, not a log". Leader reads both at session start.
The two are DISTINCT from `memory/*.md` in `.claude/` (Claude auto-memory style: frontmatter `name`, `description`, `metadata{node_type, type: feedback|project, originSessionId, modified}`; body = rule + `**Why:**` + `**How to apply:**`; `[[wiki-links]]`; index `MEMORY.md` with one-line pointers). Those hold owner preferences/feedback and are dual-copied (Claude's project memory dir and `<project>/.claude/memory/`) by the `memory-dual-copy-sync` rule. So the kit would have TWO memory mechanisms: (a) project `agent-team/memory/{decisions,lessons}.md` (leader-curated, in git) and (b) Claude auto-memory (`.claude/memory/*` with index).

### 2.8 What the vendored skill-pack adds
`agent-team/project/skill-pack/` = 6 byte-identical upstream skills (test-driven-development, incremental-implementation, source-driven-development, debugging-and-error-recovery, code-review-and-quality, doubt-driven-development) + `references/orchestration-patterns.md` + MIT LICENSE + README. Vendored so skills are git-tracked while `.claude/` stays untracked. They are **advisory techniques**: `rules.md`, role contracts and the task's approved Plan win over any skill step. Role mapping (rules.md): developer = TDD, incremental-implementation, source-driven-development (Qt "since" version checks), debugging-and-error-recovery; tester = TDD (Prove-It); reviewer = code-review-and-quality, plus doubt-driven-development on `protocol-core` tasks. Each role reads its skills' SKILL.md before starting. Void steps: anything that commits, pushes, opens/merges PRs, installs tools, or asks for one approval covering many tasks; `incremental-implementation` step 4 "Commit" becomes "record the slice in Dev notes". Fresh-context reviewers spawned by doubt-driven-development are subagents -> Sonnet rule applies. The pack's slash commands are not used (`/build` and `/build auto` self-commit, `/constraints` installs npm tooling, `/ship` is a deploy checklist). Unresolved links: `../../references/definition-of-done.md` -> `agent-team/project/definition-of-done.md`; testing-patterns / security-checklist / performance-checklist are JS/web and not applicable; other skills named in the text are intentionally absent. Experiment (owner 2026-10-08): developers after T-081 do NOT read skill-pack skills, to compare time/quality (results in decisions.md: with skills 30.1 min/193k tokens; without 35.1 and 27.1 min; no conclusion).

---

## 3. Rules as atomic statements

Tags: [GENERIC] reusable across projects; [PROJECT] mc_protocol-specific. Source file in parentheses where useful.

### (a) Roles, delegation, models
1. [GENERIC] The leader is the main session; developer, tester, reviewer are subagents spawned from `.claude/agents/team-*.md`. (core roles)
2. [GENERIC] Only the leader spawns other roles and talks to the human; subagents never talk to the human.
3. [GENERIC] A blocked subagent writes its question into its own section of the task file, sets `Status: blocked`, and returns to the leader.
4. [GENERIC] The leader gives each subagent the task file path and nothing else about the solution; never paste the leader's opinion of the code into the reviewer's prompt.
5. [GENERIC] Spawn order is developer -> tester -> reviewer, as the class requires.
6. [GENERIC] FAIL bounces go through the leader (re-spawn developer with the failing report quoted), never subagent-to-subagent.
7. [GENERIC] Two consecutive FAILs on the same step: leader stops and consults the human.
8. [GENERIC] The leader does not implement, test, or review non-trivially; trivial-class tasks it may implement itself but both human gates still apply.
9. [GENERIC] The tester reads Plan first and forms its own verification idea before reading Dev notes; Dev notes only for setup, not reassurance.
10. [GENERIC] The reviewer is given no account of how the code came to be; reads Dev notes and Test report last, to check claims.
11. [GENERIC] The developer never commits, never pushes, never moves the task file; the tester and reviewer never fix code.
12. [GENERIC] Developer stays within the Plan's file list; an unlisted file only if the approach obviously requires it, recorded with reason.
13. [GENERIC] Dev notes must not say "it works, no need to check X"; the tester decides what to check.
14. [GENERIC] The reviewer must not invent nits; zero findings is a legitimate outcome; any `blocker` = FAIL.
15. [GENERIC] A criterion that cannot be verified by running something available is marked `unverifiable here`, never guessed.
16. [GENERIC] Every subagent at every nesting level runs on Sonnet; enforced by config (env `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` + `..._FORCE=1`) and the PreToolUse `Agent` hook, not by discipline. Spawns omit `model` or pass `sonnet`. Do not edit or bypass those two files; changing them is an owner decision. The leader (main session) keeps its own model. (rules.md "Subagents")  [mechanism GENERIC, the model name is a parameter]
17. [PROJECT] Exception (owner 2026-10-07): for the Qt 5.15 batch (T-078, T-079 + their tester/reviewer) subagents ran on Opus; owner edited settings.json himself; owner decides when to switch back. (settings.json currently says sonnet.)
18. [PROJECT] Delegation: Gates 1-2 may be delegated per phase by the owner (T-003..T-005, Phases 1-8, follow-ups T-075..T-089, with explicit exclusions); each task file then records "Gate 1/2: leader, under owner delegation <date>". Never delegated: any `hil` work (narrowed for Phase 7 tooling), anything the specs list under "Ask first" (third-party code, raising minimums, `.gitignore`, public layout changes), any change to `.claude/settings.json` or the model guard, and the next phase until the owner says so.  [pattern GENERIC, contents PROJECT]
19. [PROJECT] In delegated phases the leader decides how many developers to spawn and when; tester and reviewer stay one fresh agent each per phase/batch.
20. [GENERIC] Fresh agents per phase: new developer/tester/reviewer each phase; reused within the phase; no agent ever holds two roles. (owner 2026-09-27)
21. [GENERIC] Fresh agent per task when context is heavy: a new task gets a newly spawned developer; resume (SendMessage) only for the current task's rework/re-checks; task files and project docs must carry everything a new agent needs. (rules.md + memory `fresh-subagent-per-task-...`; overrides "re-used between tasks")
22. [GENERIC] When a subagent hands back saying "background work still running", stop it with TaskStop once its report is in; ask every agent to leave no background process. (lessons T-086)
23. [PROJECT] Skill-pack skills per role are mandatory reading for that role (developer: TDD, incremental, source-driven, debugging; tester: TDD Prove-It; reviewer: code-review-and-quality + doubt-driven on `protocol-core`); skills are advisory and lose to rules/role contract/Plan.  [pattern GENERIC]
24. [PROJECT] Experiment: developers after T-081 do not read skill-pack skills (spawn prompt says so); leader records wall time, tokens, tool calls, findings per developer.

### (b) Git and identity
25. [PROJECT] Commit identity `dev28 <devgbit@gmail.com>` (repo-local config; global identity `DGB` untouched); before committing check `git config --local user.name` is `dev28`, otherwise set it or use `--author`.  [pattern GENERIC: identity is a parameter]
26. [GENERIC pattern] No AI attribution of any kind in commits or PRs: no `Co-Authored-By`, no "Generated with" lines, no AI trailers, in PR title/description too. Overrides Claude Code's default attribution reminder. Verify with `git log -1 --format=%B`.
27. [GENERIC] Commit only after Gate 2 (human approval) given per task; never commit without it, even a one-character change; subagents never commit/push. Exception only under a recorded owner delegation.
28. [GENERIC] Work on `main` unless the owner says otherwise.
29. [PROJECT] Phase-batched commits: no commit per task within a phase; one commit per phase/batch after the checkpoint passes; commit body lists the tasks; every task's Commit record gets that commit; task files moved to `tasks/done/`. (owner 2026-09-27, overrides WORKFLOW's per-task commit)
30. [GENERIC] At every commit (Gate 2) update progress bookkeeping in the same commit: `tasks/todo.md`, `tasks/plan.md` (phase checklist and checkpoint "Done" lines) and, at phase ends, `project-context.md` "Current state"; grep plan.md for the tasks being committed. (memory + lessons 2026-10-04)
31. [PROJECT] Publishing (push tag / GitHub pre-release / bundle) only when the owner explicitly allows it, using the owner's named account; switch `gh` back afterwards; git credential helper untouched. (decisions 2026-10-08, 10-09, 10-12, 10-15)
32. [GENERIC] An owner-gated file (e.g. `.gitignore` "Ask first") may not be changed without owner approval recorded in the task file first. (lessons T-002)
33. [PROJECT] Worktree slots `.wt/wt1..wt4` (git-ignored) mirror the main tree for parallel builds via `scripts/wt-sync.ps1`; nobody edits sources in a slot; one agent per slot; never commit/push from a slot; agents never delete slots; use `git diff --stat` in a slot (CRLF noise).

### (c) Repo hygiene and docs
34. [GENERIC] The task file is the baton; an empty section is proof a step was skipped; all workflow state lives there.
35. [GENERIC] Scratch/temporary documents go to a project scratch folder (`temp-docs/`), never `%TEMP%` or outside the project; scratch experiments in `build/_scratch-<task>/` and deleted before finishing; every spawn brief repeats this. (rules, build-env, lessons T-051)
36. [GENERIC] Documentation describes the current state, not the history of the change. (DoD)
37. [GENERIC] Memory (decisions/lessons) is curated, 1-2 lines per entry prefixed with task ID; not a log.
38. [GENERIC] When a Plan asks for changed text, write the exact target text in the Plan. (lessons T-001)
39. [GENERIC] When planning, check that the spec's sketch compiles as declared (constexpr/inline/template bodies visible to callers). (lessons T-007)
40. [PROJECT] Doc comments follow `docs/rules/doc_comment_style.md`: Doxygen `/** */` + tags; each header under `include/mc/` has a `@file` block; every public symbol has `@brief` and directed `@param[in|out|in,out]`; every public `core-*` function has `@par Complexity`; no `@throws`; no icons or emoji in any comment; no doc comments in `.cpp` files.
41. [PROJECT] A consumer-visible change gets a line under `Unreleased` in `CHANGELOG.md` (from T04 on).
42. [PROJECT] Spec changes only by owner decision; any deviation from spec is recorded in Dev notes and raised to the leader.
43. [PROJECT] Plan/todo use baton IDs only (T-xxx); `Plan ref` links the plan item.

### (d) Language and encoding
44. [PROJECT] Rules text is English; owner quotes are kept verbatim in Vietnamese in rules.md/decisions (no explicit language policy rule exists).
45. [PROJECT] No icons or emoji in code comments (see 40).
46. [PROJECT/machine] Repo uses `core.autocrlf=true` + `.gitattributes`; "LF will be replaced by CRLF" warnings are expected; `mc_core.pri` has CRLF line endings: edit `.pri`/`.pro` files with the Edit tool, not perl `-0pi`/`s///` substitutions (silently match nothing or write literal `\n`).
47. [PROJECT/machine] Write files whose content has apostrophes via the Write tool, not Bash heredocs (tool parsing can break). Long repetitive vector lines are generated by a one-line perl command, not copied from a terminal (truncation risk).
48. [PROJECT] `.vec` golden-vector files accept no free comment lines; explanations go in tests or a `source:` metadata key.

### (e) File and process safety
49. [PROJECT] Never read or write outside `C:\DGB\Project\mc_protocol` without asking the owner first, including read-only "just to check" reads; toolchain binaries under `C:\Qt\...` and the VS shell are exempt. Disk-wide name-only searches may be proposed; opening files needs consent. (rules + memory `ask-before-reading-outside-project`)  [pattern GENERIC: project-root boundary is a parameter]
50. [GENERIC] Stop only processes you started, by the PID recorded at launch (`Start-Process -PassThru`); never by image name or guess; check executable path is inside your own slot before stopping anything. (lessons T-083, T-089)
51. [PROJECT] Agents never build `build/qtc-*` or `build/Desktop_Qt_*` (the owner's IDE); the owner's IDE must not use `build/qmake-*`, `build/check-*`, `build/cmake-*`. Never delete the existing `build/cmake-debug`, `cmake-mingw`, `qmake-debug` folders.
52. [PROJECT] Never install, reconfigure or repair serial/virtual-COM software (owner only); `COM50<->COM51` is retired for good, never use it; default pair `COM54,COM55`, second `COM52,COM53`.
53. [PROJECT] Real-PLC anything (even read-only smoke) is proposed at Gate 1 and run only with explicit owner approval for that task; HIL captures are owner-gated (scratch areas decided, FX3 manual checks done), reminder at capture time; nothing touches a real PLC before Phase 8 (T54). A real PLC disagreeing with the reference spec is a finding (log, tag `known-divergence`, owner decides), never a silent library change.
54. [GENERIC] Mutation tests go only into a slot/scratch copy with absolute paths; save the main tree's `git diff` before and compare after. (lessons T-089)
55. [PROJECT] Only one agent at a time sets `MC_TEST_SERIAL_PAIR`; serial-pair tests run in one tree only; `RESOURCE_LOCK` only works within one ctest invocation.
56. [GENERIC] Do not kill build processes by broad name match (jom/cl may belong to the owner's IDE).
57. [GENERIC] Never use `Remove-Item` pipelines on `Get-ChildItem` where the tool guard blocks; use Git Bash `rm -f` for deleting Makefiles/scratch. (build-env, T-036)

### (f) Memory
58. [GENERIC] After task close, the leader distills decisions to `memory/decisions.md` and lessons to `memory/lessons.md` (format above).
59. [PROJECT-ish, GENERIC pattern] Project Claude-memory is kept in two identical copies (Claude's own project memory dir + `<project>/.claude/memory/`); every create/update/delete incl. `MEMORY.md` applied to both in the same turn; if copies differ, ask the owner which wins.
60. [GENERIC] Memory file format: frontmatter (`name`, `description`, `metadata`), body with rule + **Why** + **How to apply**, `[[links]]`, one-line entries in `MEMORY.md`.
61. [GENERIC] Leader reads `project-context`, `rules`, `task-classification`, `decisions`, `lessons`, then `tasks/active/*` at session start and does not ask the human to re-explain what they answer.

### (g) Code quality and testing
62. [GENERIC] New behaviour covered by tests that fail without the change and pass with it; error paths tested, not only the happy path; a test asserting a number takes it from the reference spec or a literal, not from the code under test; a smoke test checks a success marker, not just exit 0. (DoD, lessons T-034)
63. [GENERIC] Tests named in acceptance criteria are part of the developer's implementation.
64. [GENERIC] Scope discipline: no unrelated refactors or drive-by reformatting; no dead code, debug output, commented-out blocks; no duplicated logic an existing primitive provides.
65. [PROJECT] Spec test IDs (e.g. `SES-12`, `PLN-03`) appear in test names.
66. [PROJECT] Zero-allocation guarantees ship with their ALC tests in the same task; complexity matches the spec table; no exception crosses a public boundary; `noexcept` where required.
67. [PROJECT] Qt code compiles on Qt 5.15 and Qt 6.2+ (GUI: Qt 5.15 or 6.5+); the reviewer checks the "since" version in Qt docs for every new Qt class/function/enum.
68. [PROJECT] Golden vectors (`.vec`) are never edited to make a test pass; a vector change is its own `protocol-core` task citing `docs/mc_reference/`.
69. [PROJECT] Public headers under `include/mc/` change only as the spec says; an undocumented public API change is a blocker.
70. [GENERIC] Load/latency tests run `RUN_SERIAL`, flood until enough traffic seen (with a cap), are proven with a repeated full parallel run; a timing test that fails while others run is re-run alone before being reported. Counts owned by another thread are polled with timeout (`QTRY_COMPARE`).
71. [GENERIC] Safety checks are allow-lists over everything the input can contain ("default deny"); path rules are checked on the exact OS-resolved folder.
72. [GENERIC] A guard whose pattern is rewritten is re-run against every input the old pattern caught; name-matching guards are proven with every spelling; table-driven functions tested on every frame family/op from the start; state split per owner is listed member-by-member; a program target gets a test that starts it.
73. [GENERIC] When comparing build systems compare test-case lists (`--list-test-cases`), not pass counts; tests sharing an object dir can silently not run.
74. [PROJECT] Every executable linking an instrumented library needs `mc_apply_coverage(<target>)`; the coverage tool has its own sanity test.
75. [PROJECT] Every task adding a source file updates `CMakeLists.txt` AND the matching `.pri` in the same change (BLD-04); every new test binary gets `tests/qmake/*.pro` listed in `tests/qmake/tests.pro` (BLD-03); core/mock headers include nothing from Qt/OS (BLD-05).

### (h) Build and environment
76. [PROJECT/machine] Every tool call is a fresh shell: put `. scripts/vsdev.ps1` and the build commands in the SAME PowerShell call; one PowerShell call per build.
77. [PROJECT] Reuse existing build folders; incremental builds; configure from scratch only when the Plan asks.
78. [PROJECT/machine] Use all 32 cores: `cmake --build ... --parallel 32`, `jom -j 32` (never plain nmake), `mingw32-make -j32`, `ctest -j 8`. `check.ps1 -Jobs`, `check.sh MC_CHECK_JOBS`.
79. [PROJECT] Multiple toolsets/kits: start builds concurrently as separate background processes, each with its own fresh shell env and own tree, splitting cores (e.g. `--parallel 8`); never two processes on one tree; never two `check.ps1` runs sharing a tree (use worktree slots); logs in the agent's `build/_scratch-*`.
80. [PROJECT/machine] Do not merge native stderr in PowerShell 5.1 (`2>&1`, `*>&1`) on cmake/ctest/check scripts (false NativeCommandError).
81. [PROJECT] Checkpoints build with both compilers (MSVC + MinGW GCC 13.1); daily loop is MSVC `build/cmake-debug`; v1 verified on Windows only. Qt 5 trees use MSVC toolset 14.44 (never 14.51) in a fresh shell via `scripts/vsdev.ps1 -VcVarsVer 14.44` (`-Arch x86` for 32-bit).
82. [PROJECT] Run `check.ps1`/`check.sh` with `MC_TEST_SERIAL_PAIR` unset.
83. [PROJECT/machine] Toolchain paths: CMake `C:\Qt\Tools\CMake_64`, Ninja `C:\Qt\Tools\Ninja`, MinGW `C:\Qt\Tools\mingw1310_64`, Qt 6.11.1 `msvc2022_64`/`mingw_64`, Qt 5.15.0 `msvc2019_64`/`msvc2019`, VS 2026 Community `...\Microsoft Visual Studio\18\Community`; no Python on the machine originally (later Python 3.12 noted).
84. [PROJECT] Roles report new environment facts under "Env notes" in their task-file section; the leader folds them into `build-env.md`.
85. [PROJECT] qmake gotchas: delete stale `Makefile.*` after changing SUBDIRS/SOURCES/DEFINES/`.pri`; every test `.pro` sets its own OBJECTS_DIR/MOC_DIR/RCC_DIR/UI_DIR; test `.pro` needs `DEFINES += DOCTEST_CONFIG_USE_STD_HEADERS`; never name a source `main.cpp` in a qmake project including another tool's `.pri`.

### (i) Workflow and pipeline
86. [GENERIC] Two human gates always: Gate 1 plan approval (approval recorded verbatim with date/conditions; empty field = NOT approved); Gate 2 commit approval.
87. [GENERIC] Classification at intake decides tester/reviewer; stricter class when in doubt; reclassify immediately when a task outgrows its class; never loosen silently mid-project (a Gate 1 conversation); nothing skips the human.
88. [GENERIC] Project layer overrides core where they contradict; core is never edited per project; improvements go to the origin copy and re-copied.
89. [PROJECT] Phase-batched verification (from T-008): developer implements task by task; per task the leader re-runs the verification command itself and marks the task `implemented` (no commit; Test report/Review verdict say "deferred to the checkpoint task"); at the checkpoint the tester verifies every criterion of every task in the phase and the reviewer reviews the whole phase diff incl. `protocol-core` reference diffs; findings go back as rework; checkpoint closes only when both pass. Checkpoint tasks require both compilers green.
90. [GENERIC] Phase 6 style batching: large phases split into batches treated like phases (fresh tester/reviewer, one commit per batch).
91. [GENERIC] Rework: after a fix, re-enter at the failed step; test re-runs before review.
92. [PROJECT] The leader chooses; "Ask first" items (third-party code, raising minimums, `.gitignore`, public layout changes) need owner approval.
93. [GENERIC] Process DoD (leader checks at Gate 2): Dev notes/Test report/Review verdict filled per class with commands + outcomes; nothing committed by a subagent.
94. [GENERIC] Recovery: a new session resumes at the first empty section of an active task.

### (j) Project-domain-specific (all [PROJECT])
95. MC protocol frames 3E/1E/3C/1C; sans-I/O `Session` engine in `mc_core`; no fallback to direction B (Checkpoint C "go").
96. Safety gate of the HIL capture tool: every command at every frame start must be an allowed read or a mock-decoded write inside scratch; a `mutate` of a write is never `readOnly`; every `readOnly` frame needs `recover: reconnect|eot`; `--yes` does not skip confirmation when `readOnly` frames exist; poll writes must lie in scratch; polls outside scratch marked `"input": true`.
97. Scratch areas: Q CPU `D100-D2099`; FX3/FX5 X/Y numbered octal; QJ71C24N I/O starts at Y0.
98. No automatic reconnect and no Ethernet resend in v1 (3E has no serial number); `maxConsecutiveLinkErrors` default 3, `validate()` rejects 0.
99. GUI `mc_workbench` conventions: core links Qt Core+Network only; mock tabs serve up to 32 TCP clients over one shared `MockPlc`; workspace files refuse unknown keys; export under `tests/vectors/captured` only for Real PLC checked on OS-resolved final folder; `qt_compat.h` holds all Qt version checks.
100. Serial: DTR/RTS on by default with a setting; receive-buffer bound counts only bytes from the frame start byte; junk skipped.
101. Release rule: `Unreleased` changelog; Phase 9 (bench and release) waits for the owner's HIL captures; release/tag only on explicit owner permission.

---

## 4. Hooks and settings

### 4.1 `settings.json` (also verbatim in `agent-team/project/rules.md`, "Subagents")
```json
{
  "env": {
    "CLAUDE_CODE_SUBAGENT_MODEL": "sonnet",
    "CLAUDE_CODE_SUBAGENT_MODEL_FORCE": "1"
  },
  "hooks": {
    "PreToolUse": [ { "matcher": "Agent", "hooks": [ {
      "type": "command",
      "command": "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File \"$CLAUDE_PROJECT_DIR/agent-team/project/hooks/subagent-model-guard.ps1\""
    } ] } ]
  }
}
```
- `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` + `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`: per rules.md, overrides the per-call `model` parameter, agent frontmatter and inheritance, at every nesting level and for Workflow agents. Verified by owner 2026-09-27 (general-purpose and claude-code-guide, normally Haiku, reported Sonnet); and 2026-10-07 with `opus` ("probe agent reported claude-opus-5-5").
- No `permissions`, no `model` (main session), no `statusLine`, no other hooks. The only hook is the Agent guard.
- `.claude/` is untracked in the source project (owner decision); rules.md therefore stores the required settings.json content so the leader recreates it on a fresh clone and restarts the session.
- Self-modification: leader's own edit of settings.json was blocked as self-modification (decisions 2026-10-07); owner edits it.

### 4.2 `agent-team/project/hooks/subagent-model-guard.ps1` (PowerShell 5.1 compatible, ASCII, no BOM)
- Event: PreToolUse, matcher `Agent` (fires inside subagents too, so it covers nested spawns).
- Input: reads all of stdin (`[Console]::In.ReadToEnd()` with UTF-8 InputEncoding) and `ConvertFrom-Json`. `$ErrorActionPreference='Stop'`.
- Checks (in order):
  1. JSON not parseable -> block ("could not be parsed as JSON").
  2. `tool_input` is `$null` -> block.
  3. `tool_input.subagent_type -eq 'fork'` -> block (fork always inherits the parent's model).
  4. `tool_input.model` present, non-empty and `-ne 'sonnet'` (PowerShell `-ne` is case-insensitive, so `Sonnet` passes) -> block.
  5. Otherwise `exit 0`.
- Output: on block writes to stderr "Blocked by agent-team/project/hooks/subagent-model-guard.ps1: <reason> Every subagent must run on Sonnet (agent-team/project/rules.md, 'Subagents')." and `exit 2` (stderr is returned to the calling agent as the reason). Fails closed on unreadable input. No stdout JSON, no `permissionDecision` use.
- Design: second layer; first layer is the env block. Hook closes what env cannot: `fork` type and explicit other-model requests.
- Weaknesses / notes:
  - Hard-codes "sonnet" and the literal text in the error message; switching to Opus (as in 2026-10-07) requires editing the script, not just env; the script and env can disagree (env=opus + hook rejecting `model:'opus'` explicit passes - only matters if a spawn passes the model).
  - Does not read or validate the env vars themselves (if settings.json loses the env block the hook alone will still allow omitted `model`, which then inherits).
  - Over-strict: any explicit `model` other than the word `sonnet` blocks, including full Sonnet model IDs or aliases such as `sonnet[1m]`.
  - Matcher is the tool name `Agent`; if the harness names the tool `Task` (older versions) the hook never fires.
  - Command uses `$CLAUDE_PROJECT_DIR` unquoted-style expansion inside a shell string: works when hooks run through Git Bash/sh; under a pure cmd/PowerShell hook runner the variable would not expand (Windows-specific fragility). Requires `powershell.exe` (Windows only) - no `.sh` twin for macOS/Linux.
  - PowerShell startup (~hundreds of ms) on every Agent call.
  - Does not cover other spawn routes (Workflow tool, agent teams, `run_in_background` variants) beyond what the env var forces.
  - No logging/audit trail; no allow-list of `subagent_type` values.

### 4.3 `agent-skills/hooks/*.sh` (upstream; none wired anywhere in this snapshot - no hook entries in `agent-skills/.claude-plugin/plugin.json`, no settings.json inside `agent-skills/`, top-level `settings.json` has only the model guard)
- `session-start.sh` (SessionStart): builds the standard envelope `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext": "agent-skills loaded. ... " + contents of skills/using-agent-skills/SKILL.md}}` via `jq`. If `jq` missing, emits the same envelope with an install hint, exit 0. Header says explicitly: NOT wired by the plugin, because hosts with native skill routing (Claude Code, Codex) would get a second router; wire only on hosts without native routing. `session-start-test.sh` validates the JSON payload with node.
- `sdd-cache-pre.sh` (PreToolUse, `WebFetch`) and `sdd-cache-post.sh` (PostToolUse, `WebFetch`, `async: true`): cross-session cache for source-driven-development. Cache dir `${CLAUDE_PROJECT_DIR:-$PWD}/.claude/sdd-cache/<sha256(url)[0:32]>.json` storing url, prompt, etag, last_modified, content, fetched_at. Post: after a WebFetch, `HEAD` request for ETag/Last-Modified (entries without validators are never cached / stale entry removed); content taken from `tool_response.result` (fallbacks output/text/content/body or string). Pre: if an entry exists, sends conditional `HEAD` (If-None-Match / If-Modified-Since, 5 s timeout); only on HTTP `304` it blocks WebFetch with `exit 2` and writes the cached body (with the original prompt) to stderr, which Claude Code returns to the agent; otherwise `exit 0`. Needs `jq`, `curl`, `shasum`/`sha256sum`; degrades to exit 0 if missing. Debug via `SDD_CACHE_DEBUG=1` or `.claude/sdd-cache/.debug`. Setup JSON is in `hooks/SDD-CACHE.md`.
- `simplify-ignore.sh` (one script, three events: PreToolUse `Read`, PostToolUse `Edit|Write`, `Stop`): blocks marked `simplify-ignore-start[: reason]` ... `simplify-ignore-end` are replaced in place by `BLOCK_<8-hex hash>` placeholders on Read (backup in `.claude/.simplify-ignore-cache/`), expanded and re-filtered after Edit/Write, and fully restored at Stop (falls back to backup, writes `.recovered` file on wholesale rewrite). Needs `jq`, `shasum`/`sha1sum`. Crash recovery: `echo '{}' | bash hooks/simplify-ignore.sh`. Setup JSON in `hooks/SIMPLIFY-IGNORE.md`. Risk: it mutates the user's source files on disk while a session is active.
- All three `.sh` hooks are bash+jq; on Windows they need Git Bash and jq (not noted as present in the machine's toolchain table).

---

## 5. The agent-skills pack (addyosmani/agent-skills, v0.6.10)

License: MIT, "Copyright (c) 2025 Addy Osmani" (`agent-skills/LICENSE`; `skill-pack/LICENSE` identical). plugin.json author Addy Osmani, repo https://github.com/addyosmani/agent-skills.

### 5.1 Skills (25 upstream = 15 live in top-level `skills/` + 6 in `agent-team/project/skill-pack/` + 4 web skills dropped)
Verified by directory count: top-level `skills/` has 15 skill directories (20 files counting the subfiles of `idea-refine` and `constraint-driven-development`); the 6 pack skills are NOT in `skills/`; browser-testing-with-devtools, ci-cd-and-automation, frontend-ui-engineering, shipping-and-launch exist only in `agent-skills/skills/` (owner decision 2026-09-27).

One-line descriptions (from frontmatter) and fit:

| skill | description (shortened) | where | generic vs web/JS |
|---|---|---|---|
| using-agent-skills | meta-skill: discover and invoke skills (flowchart) | live | generic |
| interview-me | one-question-at-a-time interview until ~95% confidence; needs live user | live | generic |
| idea-refine | divergent/convergent refinement of vague ideas -> one-pager in `docs/ideas/`; has `scripts/idea-refine.sh` (mkdir docs/ideas) | live | generic |
| spec-driven-development | write structured spec (PRD) before code; Phase 0 capability map; 4 gated phases; saves SPEC.md | live | generic |
| constraint-driven-development | CONSTRAINTS.md quality bar, interview, detects weakened bar; installs tools (Semgrep, gitleaks, osv-scanner, axe, Lighthouse, size-limit, dependency-cruiser, Stryker) | live | semi-generic (tools/web-leaning: package.json check:* scripts) |
| planning-and-task-breakdown | break work into ordered tasks with acceptance criteria -> `tasks/plan.md`, `tasks/todo.md` | live | generic |
| context-engineering | feed agents right context; rules files, context hierarchy | live | generic |
| code-simplification | simplify while preserving behavior (Chesterton's Fence, Rule of 500) | live | generic |
| security-and-hardening | OWASP/threat model/STRIDE, auth, secrets, deps | live | mostly web/app-security oriented; principles generic |
| performance-optimization | measure first; Core Web Vitals; N+1 | live | web/JS-specific |
| git-workflow-and-versioning | trunk-based, atomic commits, ~100-line changes, releases/semver | live | generic (conflicts with this owner's no-trailer/commit-only-at-gate rules where it says "commit early, commit often") |
| deprecation-and-migration | code as liability, deprecation, migrations | live | generic |
| documentation-and-adrs | ADRs, docs, document the why | live | generic |
| observability-and-instrumentation | structured logging, RED metrics, OTel | live | service/web oriented |
| api-and-interface-design | contract-first, Hyrum's Law, One-Version Rule | live | generic (examples TS) |
| test-driven-development | red-green-refactor, Prove-It, "Discover the Stack First" | skill-pack | generic (TS examples) |
| incremental-implementation | thin vertical slices | skill-pack | generic (step 4 commits - voided here) |
| source-driven-development | ground decisions in official docs (DETECT, FETCH, IMPLEMENT, CITE); optional sdd-cache hook | skill-pack | generic (needs WebFetch/web access) |
| debugging-and-error-recovery | stop-the-line, 5-step triage | skill-pack | generic |
| code-review-and-quality | five-axis review, severity labels Nit/Optional/FYI, change sizing | skill-pack | generic |
| doubt-driven-development | fresh-context adversarial review CLAIM-EXTRACT-DOUBT-RECONCILE-STOP | skill-pack | generic |
| browser-testing-with-devtools | Chrome DevTools MCP runtime verification | removed (agent-skills only) | web-specific |
| frontend-ui-engineering | accessible, responsive UI, components, state | removed | web-specific |
| ci-cd-and-automation | quality gate pipelines, feature flags, deploy | removed | web/CI-specific (npm-oriented) |
| shipping-and-launch | pre-launch checklist, staged rollout, rollback | removed | deploy-oriented (service/web) |

Every SKILL.md follows the anatomy: frontmatter `name` + `description` ("Use when..."), Overview, When to Use, Process, Common Rationalizations, Red Flags, Verification. Most skills also contain "Loading Constraints"/non-interactive guards (interview-me, constraint-driven).

### 5.2 Upstream agents (4; `agent-skills/agents/`; none sets `model`)
- `code-reviewer`: Senior Staff Engineer, five-axis review (correctness, readability, architecture, security, performance), severity Critical/Required/Optional/Nit, verdict APPROVE | REQUEST CHANGES, template with "What's Done Well" + "Verification Story". Copy live in `agents/`.
- `security-auditor`: Security Engineer; scope input handling, authn/z, data protection, infrastructure, third-party, AI/LLM features; severities Critical/High/Medium/Low/Info; STRIDE; PoC for Critical/High. Copy live.
- `test-engineer`: QA; analyze before writing; test at the right level; Prove-It for bugs; scenario matrix; "Test Coverage Analysis" output. Copy live.
- `web-performance-auditor` (12 KB): Core Web Vitals; Quick vs Deep mode, Metric-Honesty Rule (never fabricate metrics). agent-skills only; web-specific. Used via `/webperf`.
All personas include a "Composition" section: invoked directly or via `/review` / `/ship`; never invoke another persona; subagents cannot spawn subagents.

### 5.3 Commands (8 live in `commands/`, 9 upstream incl. `/webperf`; TOMLs: build, code-simplify, constraints, planning, review, ship, spec, test, webperf)
- `/spec`: invoke spec-driven-development; ask clarifying questions; generate spec across six areas (objective, commands, project structure, code style, testing strategy, boundaries); optional capability map; save `SPEC.md`.
- `/plan`: invoke planning-and-task-breakdown; plan mode (read-only); dependency graph; vertical slices; tasks with acceptance criteria; checkpoints; saves `tasks/plan.md` + `tasks/todo.md`; never silently overwrite an incomplete plan.
- `/build`: incremental-implementation + TDD; default = next pending task: RED, GREEN, regression, build, COMMIT, mark complete, stop. `/build auto` (or `all`): requires a spec, clean `git status`, plans if needed, single approval, then implements every task with one commit per task, stopping on failures/ambiguity/irreversible actions. (Conflicts with team workflow: self-commits.)
- `/test`: TDD workflow; Prove-It pattern for bugs; browser issues -> browser-testing-with-devtools (skill absent live).
- `/review`: code-review-and-quality; five axes; Critical/Important/Suggestion with file:line.
- `/code-simplify`: code-simplification; reads CLAUDE.md; incremental; tests after each change; reuses code-review-and-quality.
- `/ship`: shipping-and-launch; fan-out orchestrator: spawns code-reviewer, security-auditor, test-engineer in parallel in one turn (Agent tool), then merges in main context (code quality, security, performance, accessibility, infrastructure, documentation) -> "Ship Decision: GO | NO-GO" with blockers, recommended fixes, acknowledged risks, mandatory rollback plan; skip fan-out only if <=2 files, <50 lines, no auth/payments/data/config.
- `/constraints`: constraint-driven-development; detect, up to 4 interview questions, writes `CONSTRAINTS.md`, installs tools, places checks by cost; sub-commands `check`, `guard`, `ratchet`.
- (`/webperf` upstream only: web-performance-auditor.)

### 5.4 References (7; identical in top-level `references/` and `agent-skills/references/`)
- `definition-of-done.md` (67 lines): generic standing DoD vs acceptance criteria; sections Correctness, Quality, Integration, Documentation, Ship-readiness; how to apply; red flags. Generic.
- `orchestration-patterns.md` (370 lines): endorsed multi-persona patterns (direct invocation, parallel fan-out with merge...) and anti-patterns; rule "personas do not invoke personas". Generic (Claude Code Agent Teams notes).
- `testing-patterns.md`: JS/TS (Jest, RTL, Supertest, Playwright) - principles generic, syntax JS.
- `security-checklist.md`: web app security + OWASP Top 10 + LLM Top 10. Web-oriented.
- `performance-checklist.md`: Core Web Vitals, frontend/backend, caching. Web.
- `accessibility-checklist.md`: WCAG 2.1 AA. Web UI.
- `observability-checklist.md`: on-call questions, structured logging, RED/USE, tracing. Service-oriented, mostly generic.

### 5.5 Other upstream infrastructure (listed only)
`agent-skills/.claude/rules/skills-contributing.md` (anti-duplication guardrail, path-scoped to `skills/**`, only relevant for contributing to upstream); `CLAUDE.md`/`AGENTS.md` (upstream-repo scope; AGENTS.md has an OpenCode "if a task matches a skill you MUST invoke it" mapping and anti-rationalization list); `.opencode/skills` (text file `../skills/`); `.claude-plugin/{plugin,marketplace}.json` (`commands: ["./.claude/commands","./commands"]`, `skills: ./skills`, no hooks entry); skipped dirs: `evals/` (25 case files), `docs/` (16 guides), `scripts/` (validators), `.gemini/`, `.codex-plugin/`, `.github/`.

---

## 6. Parameterization candidates

| Value | Where it appears | Notes |
|---|---|---|
| Project name `mc_protocol`, library name `mc`, domain terms (PLC, MC protocol, frames, HIL) | `project-context.md`, `rules.md`, `task-classification.md`, `definition-of-done.md`, memory files, decisions/lessons, `settings.json` env no | Replace via template placeholders `<project name>` already present in core templates |
| Project root `C:\DGB\Project\mc_protocol` | `rules.md` (Access boundaries), memory `ask-before-reading-outside-project.md`, memory `memory-dual-copy-sync.md` | Parameter PROJECT_ROOT; the boundary rule itself is generic |
| Claude memory dir `C:\Users\dgb07\.claude\projects\c--DGB-Project-mc-protocol\memory\` | `memory/memory-dual-copy-sync.md`, MEMORY.md | Machine/user-specific; derive from project path |
| Commit identity name/email `dev28 <devgbit@gmail.com>`; global identity `DGB`; GitHub accounts `gstorm-b`, `dev39-hash`; repo `gstorm-b/mc_protocol` | `rules.md`, memory `git-commit-identity-no-ai-trailer.md`, `decisions.md` (release entries) | Identity/email/trailer policy are template fields ("Commit identity", "Attribution trailers") |
| AI-attribution policy (forbidden) | `rules.md`, memory | Boolean param; conflicts with the harness default `Co-Authored-By` reminder, which the user instruction must override |
| Subagent model `sonnet` | `settings.json` (`CLAUDE_CODE_SUBAGENT_MODEL`), `subagent-model-guard.ps1` (hard-coded `'sonnet'` + message), `rules.md` Subagents + Opus exception, memory `agent-team-system-staged.md`, decisions 2026-09-27 | Single param SUBAGENT_MODEL; the script should read it from env instead of hard-coding |
| `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` | `settings.json`, `rules.md` | constant |
| Hook command path `$CLAUDE_PROJECT_DIR/agent-team/project/hooks/subagent-model-guard.ps1`, shell `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass` | `settings.json`, `rules.md` code block, header of the .ps1 | OS-dependent (Windows); needs a bash twin for other OSes |
| Protected dirs/files: `agent-team/core/` (never edit), `.claude/settings.json`, model guard, `.gitignore`, golden vectors `.vec`, `docs/spec` (owner decision), `build/qtc-*`, `build/Desktop_Qt_*`, `.wt/` | `team-leader.md`, `rules.md`, `build-env.md`, `definition-of-done.md` | A PROTECTED_PATHS / ASK_FIRST list per project |
| Scratch dirs `temp-docs/`, `build/_scratch-<task>/` | `rules.md`, `build-env.md`, `lessons.md`, `project-context.md` | SCRATCH_DIR parameter |
| Task folders `tasks/active/`, `tasks/done/`, plan files `tasks/plan.md`, `tasks/todo.md`, ID scheme `T-xxx` | all core files, templates, `rules.md`, memory | TASKS_DIR, ID prefix |
| Docs layout `docs/spec/`, `docs/hil/`, `docs/rules/doc_comment_style.md`, `docs/mc_reference/`, `docs/intent/`, `reference_source/`, `CHANGELOG.md` | `project-context.md`, `rules.md`, `task-classification.md`, `definition-of-done.md` | project key-docs table |
| Build commands/paths: CMake, ctest, Ninja, MSVC dev shell `scripts/vsdev.ps1`, `scripts/check.ps1/.sh`, `scripts/wt-sync.ps1`, `scripts/build-ads.ps1`, `C:\Qt\...` (6.11.1, 5.15.0, Tools), `C:\Program Files\Microsoft Visual Studio\18\Community`, jom path, vswhere path, core count 32 / `-j 8` | `build-env.md`, `project-context.md`, `definition-of-done.md`, `rules.md` | BUILD_CMD, TEST_CMD, ENV_BOOTSTRAP, PARALLELISM, per-toolchain table; machine facts vs project facts |
| Test labels (`build, core_model, core_protocol, core_session, mock, integration, device, replay, hil_tool, gui`), `MC_TEST_SERIAL_PAIR=COM54,COM55`, `COM52/COM53`, `COM50/51 retired` | `project-context.md`, `build-env.md`, `rules.md` | TEST_LABELS |
| Build dir names `build/cmake-debug`, `cmake-mingw`, `qmake-debug`, `check-*`, `qtc-*`, `Desktop_Qt_*`, `.wt/wt1..4` | `build-env.md`, `rules.md`, `definition-of-done.md` | BUILD_DIRS |
| Compilers/Qt minimums (Qt 5.15 + 6.2+, GUI 5.15/6.5+, MSVC toolset 14.44 vs 14.51, MinGW GCC 13.1, C++17) | `rules.md`, `definition-of-done.md`, `build-env.md` | TOOLCHAIN_REQUIREMENTS |
| Task classes + per-class tester/reviewer matrix, extra class names `protocol-core`, `hil` | `task-classification.md`, `rules.md` | table is a template already |
| DoD checklist content (build wiring `.pri`/CMake, ALC tests, public headers, Doxygen) | `definition-of-done.md` | Per-language DoD |
| Hardware gates (HIL, scratch area `D100-D2099`, PLC models Q03UDE/FX3/FX5U, owner demos) | `rules.md`, `memory/hil-...`, `decisions.md` | optional section "Hardware / environment gates" |
| Delegation text (phase numbers, owner quotes in Vietnamese, dates) | `rules.md` "Version control" | Should become a short delegation mechanism + a per-project log file |
| Owner term "owner" / "Gate 2 approval is given per task" | everywhere | ROLE_NAME_HUMAN |
| Commit cadence (per task vs per phase) | WORKFLOW (per task) vs `rules.md` (per phase/batch) | COMMIT_CADENCE parameter |
| Languages of docs/owner quotes (Vietnamese quotes, English rules) | `rules.md`, memory, decisions | DOC_LANGUAGE |
| Skill-pack role mapping and which skills are vendored | `rules.md` Skill pack, `skill-pack/README.md`, `project-context.md` | per-project selection (C++/Qt picks 6 skills) |
| Skill-pack experiment toggle ("developers do not read skills after T-081") | `rules.md` | optional flag |
| Parallel-build rules (kits, slots, 32 cores) | `rules.md` Phase-batched verification, `build-env.md` | optional module |
| External publish accounts, GitHub org `gstorm-b`, `gh` account switching | `decisions.md`, `rules.md` indirectly | project secrets-adjacent; keep out of the generic kit |
| Date stamps ("verified 2026-09-27", "Updated 2026-10-04") | `build-env.md` header, `project-context.md` | metadata |
| Design doc path `temp-docs/agent-team-design.md` | `agent-team/README.md`, decisions | missing file |
| Hook settings for upstream hooks: `${CLAUDE_PROJECT_DIR}/hooks/sdd-cache-*.sh`, `simplify-ignore.sh`, `.claude/sdd-cache/`, `.claude/.simplify-ignore-cache/` | `agent-skills/hooks/*.md` | if ever wired |

---

## 7. Issues spotted

1. **Core vs project contradictions are handled only by prose overrides.** `core/WORKFLOW.md` says per-task test/review and per-task commit; `rules.md` "Phase-batched verification" overrides both from T-008 (tester/reviewer once per phase checkpoint, one commit per phase). The `team-leader.md` role still says "Never commit without Gate 2 approval", while `rules.md` delegates Gate 1/2 to the leader. Core files stay "unedited" but no longer describe what actually runs; a kit should make cadence (per-task vs per-batch) and delegation first-class options.
2. **`rules.md` mixes standing rules with a historical delegation log** (about half of the 296 lines; quotes in Vietnamese; "Phase 8 waits for the owner" etc.). Hard to use as "rules the reviewer checks mechanically". Same for `decisions.md` (59 entries, release events, spec amendments) and `hil-capture-prerequisites-open.md` (a status log stored as a memory file).
3. **Model rule is internally inconsistent over time.** `decisions.md` 2026-09-27 says "model passed explicitly on each spawn"; `rules.md` says "Spawns omit `model` or pass `sonnet`". `rules.md` records an Opus exception (env set to `opus` by the owner, 2026-10-07) but nothing records the revert; `settings.json` now says `sonnet`, and memory `agent-team-system-staged.md` says subagents are Sonnet. The hook hard-codes `sonnet`, so an Opus period would conflict with it if a spawn passed `model: 'opus'`.
4. **Model enforcement relies on undocumented/behavioural env vars** (`CLAUDE_CODE_SUBAGENT_MODEL`, `..._FORCE`); the `team-*.md` shims have no `model:` frontmatter, so a project without the env block runs them on the inherited model. The hook cannot compensate (it does not set the model).
5. **Hook fragility** (see 4.2): Windows-only PowerShell; `$CLAUDE_PROJECT_DIR` expansion depends on the hook shell; matcher name `Agent` vs `Task` depends on the Claude Code version; case/ID strictness; no test file for the script.
6. **Dead / missing references.** `agent-team/README.md` and `decisions.md` cite `temp-docs/agent-team-design.md` (not in the snapshot; `temp-docs/` is scratch and "never shipped"). `rules.md` references `docs/rules/doc_comment_style.md`, `tasks/plan.md`, `scripts/*` that exist only in the project repo. `skill-pack/README.md` and the 6 skills link `../../references/*` that do not resolve (documented). Top-level `commands/*.md` reference skills that no longer exist in the live `skills/` dir: `build.md` -> incremental-implementation, test-driven-development, planning-and-task-breakdown (live), debugging-and-error-recovery, doubt-driven-development (not live; only in skill-pack); `test.md` -> test-driven-development, browser-testing-with-devtools (removed); `review.md` -> code-review-and-quality (not live); `ship.md` -> shipping-and-launch (removed); `code-simplify.md` -> code-review-and-quality. `rules.md` states the commands "are not used", yet they remain in `.claude/commands/` and are discoverable.
7. **Duplicated files** (byte-identical): 15 skills + subfiles (top-level `skills/` vs `agent-skills/skills/`); 7 references (`references/` vs `agent-skills/references/`); 3 agents (`agents/` vs `agent-skills/agents/`); 6 skills + orchestration-patterns (`skill-pack/` vs `agent-skills/` vs, for orchestration-patterns, also top-level `references/`). The six pack skills are intentionally NOT in the live `skills/` dir (so Claude does not auto-trigger them), which means they are never loaded via the Skill tool, only by explicit file read; and the 6 skill-pack skills plus `agent-skills/skills` are two copies of the same text (about 125 KB each). Top-level `references/definition-of-done.md` (generic) coexists with `agent-team/project/definition-of-done.md` (tailored) and rules.md says links to the former mean the latter - two files with the same name and different content.
8. **Status vocabulary mismatch.** `task.md` template Status: `planning | awaiting-gate-1 | developing | testing | reviewing | awaiting-gate-2 | blocked | done`; roles set `ready-for-test`, `ready-for-review`, `ready-for-commit-gate` which are not in that list.
9. **PORTING.md is incomplete** for this instance: omits `settings.json` env/hook, the model-guard script, skill-pack, definition-of-done, build-env, memory-dual-copy rule, `.gitignore` for `tasks/`, and says "fill the three templates" while the project layer also uses definition-of-done and build-env. `team-leader.md` reads exactly 5 project files; `definition-of-done.md`/`build-env.md` are reachable only via `project-context.md`/`rules.md`, and core roles never mention definition-of-done.
10. **Two things called "memory".** `agent-team/memory/{decisions,lessons}.md` (leader-curated, in git) vs `.claude/memory/*.md` (Claude auto-memory, must be dual-copied to a user-profile directory). `memory-dual-copy-sync` ties the kit to a machine path. The `[[wiki-link]]` memory style and `originSessionId` metadata are Claude-memory specific.
11. **Stale project facts.** `project-context.md` "What this project is" still says "at the start of implementation (Phase 0 ... T01-T56)" while "Current state" says Phases 0-8 done; decisions/memory go to T-089/v0.1.3 (2026-10-15) but "Current state" is dated 2026-10-04; `build-env.md` header "Last verified 2026-09-27" but contains later sections (2026-10-08). Lesson on stale bookkeeping (T 2026-10-04) shows this keeps happening.
12. **Hard-coded paths and secrets-adjacent data**: `C:\DGB\Project\mc_protocol`, `C:\Users\dgb07\...`, `C:\Qt\...`, email `devgbit@gmail.com`, GitHub account names `gstorm-b`/`dev39-hash`, COM port numbers. The kit must not carry these into the generic part.
13. **Rules conflicting with the harness / upstream pack:** commit identity + "no AI attribution" contradict Claude Code's default Co-Authored-By reminder (rule says user instruction wins); upstream `git-workflow-and-versioning`, `incremental-implementation` and `/build` say "commit early, commit often / one commit per task", conflicting with Gate 2 + batched commits (handled by "void steps"); `build-env.md` rule 3 forbids `%TEMP%` while jom/nmake write there ("accepted"); the harness here also asks agents to use a scratchpad in `%TEMP%` - the kit should say the scratch location is configurable.
14. **Upstream `agent-skills` caveats:** hooks documented but not wired; `agent-skills/CLAUDE.md`/`AGENTS.md` explicitly say not to copy them into other projects (AGENTS.md says "you MUST invoke a skill if even 1% chance applies" - contradictory with the team's advisory-skills stance if copied); `.claude/rules/skills-contributing.md` is path-scoped to `skills/**`, would trigger spuriously in any project that has a `skills/` folder; README counts ("9 commands", "25 skills", "13 scripts") vs snapshot (commands: 9 .md in upstream `.claude/commands`, 8 live); `commands/planning.toml` vs `plan.md` naming mismatch; many web/JS-only skills, references and agent (`web-performance-auditor`) are irrelevant to a non-web kit; `session-start.sh` header warns it double-routes on Claude Code.
15. **Unverified/ambiguous items:** the 2026-10-07 probe model string `claude-opus-5-5` appears in rules.md only; the hook was verified for Sonnet only after a session restart; no automated test exists for the model-guard hook or the "no pre-commit enforcement hook yet - revisit after ~2 weeks" idea (decisions 2026-09-27) was never revisited in the recorded decisions.
16. **Wording of my own count in 5.1**: the upstream pack has 25 skills; the live `skills/` holds 15 skills (20 files including subfiles), the vendored `skill-pack/` holds 6, and 4 web skills were dropped (15 + 6 + 4 = 25).
