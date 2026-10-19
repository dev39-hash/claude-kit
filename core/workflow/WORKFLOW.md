# Team workflow

Four roles: **team leader** (the main session), **implementer**, **tester**, **reviewer**
(sub agents in `.claude/agents/`), plus two helpers the leader may call at any step:
**build-resolver** (only when the build is broken) and **explorer** (read-only code tracing).
One task at a time flows through them. The single source of truth for a task's state is its
**task file** `.claude/tasks/active/T-xxx.md`, never the conversation.

## Ground rules

1. **The task file is the baton.** A role that has not written its section into the task
   file has not finished. An empty section is proof a step was skipped.
2. **Sub agents never talk to the human.** A blocked sub agent writes its question into its
   section, sets `Status: blocked`, and returns to the leader. Only the leader asks the human.
3. **Two human gates, always** (`gates` in `kit.config.json`):
   - **Gate 1 - Plan approved.** No implementation before the human approves the Plan
     section. `hil` tasks also wait for the hardware prerequisite.
   - **Gate 2 - Commit approved.** No commit before the human has seen the diff summary and
     the completed task file.
   A project may delegate a gate to the leader in `.claude/project/rules.md`; the delegation
   names its scope and the cases that still stop.
4. **Classification decides the path.** The leader classifies every task per
   `.claude/project/task-classification.md` and records the class in the task file. Skipping
   the tester or the reviewer is legal only when the class allows it.
5. **Project layer wins.** Where `.claude/project/*` contradicts a core file, the project
   layer wins. Core files are never edited inside a project.
6. **Evidence over reports.** `.claude/rules/06-evidence.md` applies at every step.

## Task lifecycle

```text
intake -> plan -> [GATE 1: human] -> (tester RED) -> implement -> test -> review
                                        ^_________________________| FAIL  ^____| FAIL
       -> leader verify -> [GATE 2: human] -> commit -> close
```

1. **Intake.** Leader creates `.claude/tasks/active/T-xxx.md` from
   `.claude/core/templates/task.md`. IDs are sequential; `Plan ref` links the matching item
   in `.claude/docs/plan/` if any.
2. **Plan.** Leader fills the Plan section (goal, context, deliverables, constraints,
   acceptance criteria, out of scope, build line, model line) and the class. Changes that
   need an ADR get it first (`architecture-decision-records` skill).
3. **Gate 1.** Human approves or edits the plan. Leader records the approval verbatim (date,
   conditions) and fixes the **Baseline**: the base commit, or, when git will not see the
   change (`.claude/` only), a copy of the touch-list files in the session scratchpad.
4. **Tester RED** (classes that call for TDD). Leader spawns `tester` in RED mode: failing
   tests for the acceptance criteria, evidence that they fail for the intended reason.
5. **Implement.** Leader spawns `implementer` with the task file path and nothing else about
   the solution. Implementer stays inside the touch list and fills **Dev notes**.
   Build broken by something outside the task -> leader spawns `build-resolver`.
6. **Test.** Leader spawns `tester` in GREEN-verify mode (unless the class skips it). Tester
   reads the Plan before the Dev notes, verifies every criterion by running something, fills
   **Test report** with `PASS` / `FAIL`. FAIL -> back to implement with the report quoted.
7. **Review.** Leader spawns `reviewer` (unless the class skips it) on the diff against the
   Baseline. The reviewer returns the **Review verdict** block (`APPROVE` / `WARN` / `BLOCK`);
   it has no Write/Edit tool, so the leader pastes the block into the task file unchanged.
   BLOCK -> back to implement. WARN -> leader decides.
8. **Leader verify.** Leader runs the project's verification loop itself (whole-tree build,
   full tests, gates, format if configured) and records the result in **Leader verify**.
9. **Gate 2.** Human reviews the diff summary and the task file. On approval the leader
   commits per `.claude/rules/01-git-identity.md` and `project/rules.md`, fills
   **Commit record**.
10. **Close.** Move the file to `.claude/tasks/done/`. Distill one or two lines into
    `.claude/docs/decisions.md` / `lessons.md` when the task produced something worth
    keeping. Update `.claude/project/context.md` if the altitude view drifted.

## Rework loops

A FAIL bounce goes **through the leader**, never sub agent to sub agent. The leader re-spawns
the implementer with the failing report quoted in the prompt. After the fix the flow re-enters
at the step that failed (test re-runs before review; a review BLOCK re-enters at implement,
then test runs again when the class needs it). Two consecutive FAILs on the same step ->
the leader stops and consults the human.

A **Gate 2 answer that changes the deliverable** (not the wording) is a ruling: the leader
records it in `.claude/docs/decisions.md`, re-enters at implement with the ruling quoted, and
test and review run again as the class requires before Gate 2 is asked again. A wording-only
change the leader may make directly and note in **Commit record**.

## Parallel tasks

Tasks are independent when their touch lists are disjoint. Independent tasks may run their
implementers in parallel, each in its own build slot or worktree. Tasks that share a file run
in sequence. The leader commits per `git.commitCadence` (`task` by default; `phase` or `wp`
when the project says so).

## Session recovery

A new session recovers state by reading, in order: `.claude/CLAUDE.md` ->
`.claude/core/roles/team-leader.md` -> `.claude/project/*.md` -> `.claude/docs/decisions.md`
and `lessons.md` -> `.claude/tasks/active/*.md`. The first empty section in an active task
file is where work resumes.

After a session limit or a crash, check what is still running **before** resuming: a sub
agent cut by the limit resumes on its own after the reset and starts its builds again (seen
2026-10-19). List the processes (`tasklist` / `ps`: `cl`, `link`, `MSBuild`, `ninja`, `cmake`,
`ctest`, the project's executables), the build slots (`wt-slot.js status`) and the sub agents
still reporting; stop the redundant agents first (by task id, then their process tree by PID,
only what this session started), release their slots, then continue from the task file. A
result that lands after the leader moved on is evidence to read, not work to adopt.
