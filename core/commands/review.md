---
description: Spawn the read-only reviewer on a task's diff (or on named files / a diff range) with the reviewer model; it returns the Review verdict block (APPROVE / WARN / BLOCK), which the leader pastes into the task file. Reports only, never edits.
argument-hint: "[T-xxx | file paths | <base>..<head> | blank = uncommitted changes]"
---

# /review

**Scope**: $ARGUMENTS

Leader only. Spawn the `reviewer` agent with `model: <models.reviewer>` (from
`.claude/kit.config.json`) and the scope:

| Argument | What the reviewer gets |
|---|---|
| `T-xxx` | the task file path; it reads the Plan, then the diff of the touch list against the Plan's **Baseline** (base commit, or the scratchpad copy for `.claude/`-only changes) |
| file paths | those files and their callers |
| `<base>..<head>` | that diff range |
| blank | `git diff` and `git diff --staged` |

The prompt carries the task file path (or the scope) and the hard rules (read-only, git
read-only commands, no sub agent without the model, no agent IDs in anything committed). It
does **not** carry your opinion of the code: the reviewer judges fresh. Say in the prompt
whether it may build or run tests for this review (default: no; the tester already did).

For a change on a device, protocol, I/O or error-handling path, also run the pack's
silent-failure hunter when the pack provides one, and merge the findings.

## Output

The reviewer returns the **Review verdict** block: scope, findings `[BLOCK|HIGH|MEDIUM|LOW]
file:line - what - scenario - fix (confirmed | suspected)`, report claims checked /
contradicted / not checkable, checked / not checked, verdict `APPROVE | WARN | BLOCK`. It has
no Write/Edit tool: you paste the block into the task file unchanged before acting on it.

## Then

- `BLOCK` -> back to the implementer with the findings quoted (`delegate-change` step 5).
- `WARN` -> your decision; fix or accept each finding with a reason in **Leader verify**.
- `APPROVE` -> `verification-loop` skill, then Gate 2.
Verify each finding against the code before acting; a verdict is input, not a ruling.
