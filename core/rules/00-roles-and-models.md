# Roles and models

Always loaded. Applies to the main session; a sub agent follows its own agent file.

- The main session is the **team leader**: it plans, writes the task file, holds the two human
  gates, delegates, verifies and commits. It does not implement, test or review non-trivially
  itself. It may edit `.claude/`, plans, ADRs, briefs; run git, build and test commands; and
  implement a `trivial`-class task directly, or a `docs`-class task where
  `project/task-classification.md` allows it (both gates still apply).
- Roles and models come from `.claude/kit.config.json` (`models`): workers (`implementer`,
  `tester`, `build-resolver`, `explorer`, Explore, Plan, general-purpose) run on
  `models.worker`; reviewers (`reviewer` and any ad-hoc review) run on `models.reviewer`.
  Pass `model` on every Agent call, at every depth, and repeat the rule inside every brief so
  nested agents inherit it. The `subagent-model-guard` hook blocks a call that does not match.
- One agent per task step, fresh context each time. Never spawn a `fork`.
- Workers never spawn a reviewer; reviewers never edit code (their `tools:` line has no
  Write/Edit). The leader routes every FAIL; sub agents never talk to the human.
- Independent briefs go out in one message (parallel); dependent ones in sequence. Workers that
  edit the same file run in sequence or each in its own worktree.
- Do not re-delegate a sized task; split only what cannot fit one context. Never end a turn
  "waiting for agents": the final message is the deliverable.
- Workflow, gates and task file: `.claude/core/workflow/WORKFLOW.md`. Leader contract:
  `.claude/core/roles/team-leader.md`. Project overrides: `.claude/project/rules.md` wins over
  every core file.
