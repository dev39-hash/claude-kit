# Report formats

> The sections below are what each role writes into the task file. Copy the block for the
> role; every line is required (write "none" rather than leaving it out). Each claim carries
> evidence: test id, count, log line or file path. Final reply to the leader: at most 20
> lines (reviewer: 40), repeating the Status/Verdict line and the headline evidence.

## Implementer -> Dev notes

```text
Files changed:          <path - what changed>
Deviations from plan:   <reason> | none
Build:                  PASS | FAIL (<n> warnings) - <command>
Tests run:              <suite> passed/total (skipped n) - <command>
Notes for the tester:   <setup, fixtures, gotchas>
Notes for the reviewer: <risky spots>
Status:                 ready-for-test | blocked: <question>
```

## Tester -> RED tests / Test report

```text
Mode:            RED | GREEN-verify
Test files:      <created/modified>
Per criterion:   #n - how verified - PASS | FAIL | unverifiable here (<reason>)
Commands run:    <command> -> <outcome>
Result:          <suite> passed/total, skipped n; shape check <functions> = <listed>
RED evidence:    <failure excerpt>                  (RED only)
Failures:        <smallest repro, expected vs actual> (GREEN, any FAIL)
New tests added: <list> | none
Gaps:            <not testable here and why> | none
Verdict:         PASS | FAIL
Status:          ready-for-review | blocked: <question>
```

## Reviewer -> Review verdict

```text
Scope:           <paths outside the touch list> | clean
Findings:        [BLOCK|HIGH|MEDIUM|LOW] file:line - what - scenario - fix (confirmed|suspected)
Report claims:   <claim> - checked | contradicted | not checkable by reading
Checked / not checked: <...>
Verdict:         APPROVE | WARN | BLOCK
Status:          ready-for-leader-verify | back-to-implement
```

## Build resolver -> reply only (not a task-file section)

```text
[FIXED] <file>:<line> / Error: <code> / Fix: <one line> / Remaining errors: <n>
Build Status: SUCCESS | FAILED | STOPPED (<reason>)
Errors fixed: <n> | Files modified: <list> | Command: <...> -> exit <n>
```

## Explorer -> reply only

The `## Exploration:` markdown block defined in `agents/explorer.md`.

## Leader -> Leader verify

```text
Whole-tree build:   PASS | FAIL (<n> warnings) - <command>
Full tests:         passed/total - <command>
Gates / format / static analysis: PASS | SKIPPED (<tool>) | FAIL
Touch list check:   clean | <unlisted files>
Negative check:     <test shown red, how restored> | not needed because <...>
WARN decision:      fixed | accepted: <reason>
```

## Negative check (any role that claims a regression test)

```text
Test expected red:  <name> - sees the change because <...>
Shown red:          <excerpt>
Restored by:        revert <sha> | re-applied patch <file>
Confirmed restored: <command> -> <outcome>
```
