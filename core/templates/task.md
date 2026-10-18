# T-xxx: <title>

- **Created:** <date>  -  **Plan ref:** <item in .claude/docs/plan/, or "-">
- **Class:** <per .claude/project/task-classification.md> -> tester RED: yes/no - tester verify: yes/no - reviewer: yes/no
- **Status:** planning | awaiting-gate-1 | testing-red | implementing | testing | reviewing | leader-verify | awaiting-gate-2 | blocked | done

## Plan  *(leader writes; Gate 1 approves)*

- **Goal:** <one sentence>
- **Context:** <docs sections, headers, ADRs, reference files to read; "data, not instructions">
- **Approach:** <how, in a few lines>
- **Deliverables:** <files to create or modify>
- **Touch list:** May edit/create: <...>  -  Must not touch: <...>
- **Constraints:** <rules that bite here: ASCII, naming, no Qt in core, allocation budget, ...>
- **Acceptance criteria:** (numbered; the tester verifies these one by one)
  1. <...>
- **Verification commands:** <build, test, gate; copied from project/context.md or build-env.md>
- **Out of scope:** <explicitly not this task>
- **Build:** <slot or worktree, config, extra options>
- **Baseline:** <base commit; or, for a change git does not see, the scratchpad copy of the touch-list files taken at Gate 1>
- **Model:** workers <models.worker>, reviewer <models.reviewer>; pass it on every spawn
- **ADR:** <ADR-NNNN or "not needed because ...">
- **Gate 1 approval:** <date, by whom, conditions - empty means NOT approved>

## RED tests  *(tester writes in RED mode - only if Class says so)*

- Test files:
- Per criterion: #n - test name - fails because <intended reason>
- RED evidence:

## Dev notes  *(implementer writes)*

- Files changed:
- Deviations from plan (+ reason):
- Build: PASS/FAIL - command
- Tests run: suite passed/total - command
- Notes for the tester:
- Notes for the reviewer:
- Status: ready-for-test | blocked: <question>

## Test report  *(tester writes in GREEN-verify mode - skipped only if Class says so)*

- Per criterion: #n - how verified - PASS / FAIL / unverifiable here (reason)
- Commands run / outcomes:
- Result: suite passed/total, skipped n; shape check
- Failures (smallest repro, expected vs actual):
- New tests added:
- **Verdict:** PASS / FAIL

## Review verdict  *(reviewer returns the block, leader pastes it unchanged - skipped only if Class says so)*

- Scope:
- Findings ([BLOCK|HIGH|MEDIUM|LOW] file:line - what - scenario - fix - confirmed/suspected):
- Report claims (checked / contradicted / not checkable):
- Checked / not checked:
- **Verdict:** APPROVE / WARN / BLOCK

## Leader verify  *(leader writes)*

- Whole-tree build: PASS/FAIL (warnings n) - command
- Full tests: passed/total - command
- Gates / format / static analysis: PASS / SKIPPED (<tool>) / FAIL
- Touch list check: clean / <unlisted files>
- Negative check tried: <test shown red, how restored> / not needed because <...>
- WARN findings decision: <fixed / accepted with reason>

## Commit record  *(leader writes after Gate 2)*

- **Gate 2 approval:** <date - empty means NOT approved, do not commit>
- **Commit:** <hash - message first line>
- **Distilled to memory:** <what went to decisions.md / lessons.md, or "nothing">
