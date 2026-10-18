---
description: Spawn the tester on a task - "red" writes failing tests for the acceptance criteria before implementation; default mode verifies every criterion independently after it and fills the Test report with PASS / FAIL.
argument-hint: "[red | verify] [T-xxx | blank = the active task]"
---

# /test

**Arguments**: $ARGUMENTS

Leader only. Spawn the `tester` agent with `model: <models.worker>`, the task file path and
the mode:

| Mode | When | The tester does |
|---|---|---|
| `red` | before the implementer, for classes that call for TDD (`tdd-workflow` skill) | failing tests for each numbered criterion; proves each fails for the intended reason; fills **RED tests** |
| `verify` (default) | after the implementer | reads the Plan before the Dev notes; verifies every criterion by running something plus one probe of its own; fills **Test report** with `PASS` / `FAIL` |

The prompt carries: the task file path, the mode, the slot or worktree, and the hard rules
(expected values from the spec or reference, never edit an existing test or golden to pass,
no sleeps or hardware in unit tests, suites run one at a time with nothing in
`processes.busyBeforeTests` running, shape-check every total, `unverifiable here` instead of a
guess, no commit, never fix the implementation).

## Then

- RED done -> spawn the implementer (`delegate-change` step 4).
- Verify `PASS` -> `/review`.
- Verify `FAIL` -> back to the implementer with the report quoted; a second FAIL on the same
  step stops the loop and goes to the human.
- Record the tester's final lines (Verdict, Result, shape check) in your own notes; the task
  file is the record.
