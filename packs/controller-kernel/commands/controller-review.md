---
description: Review a change to a controller built on the controller kernel - run the pack's gate tool on the scope, then the controller-reviewer agent (reviewer model) against the twelve laws, the smells and the project rules, and report the verdict. Read-only; a BLOCK goes back to the implementer as a new brief.
argument-hint: "[<task file> | <files or directory> | <design doc> | --staged]"
---

# /controller-review

**Scope**: $ARGUMENTS

1. Scope: the task file, files, directory or design document given; `--staged` for the
   index; otherwise the working-tree change (`git diff` and `git diff --staged`). With no git
   and no argument, ask what to review.
2. Run the gate tool on the scope first and keep its output for the brief:

   ```bash
   node .claude/tools/controller-kernel/gate-check.js <files>      # or --all
   ```

3. Spawn the `controller-reviewer` agent with `model: "<models.reviewer>"` (the value in
   `kit.config.json`; never the worker model). Its brief: the task file or scope, the gate
   output, what the change is meant to do, and any ADR or design document that governs it.
   Do not paste your own opinion of the change into the brief.
4. Report the verdict (APPROVE / WARN / BLOCK) and the findings ranked by severity, and
   record them in the task file's Review verdict section when a task file exists.
5. Do not apply fixes inside this command. A BLOCK goes back to the implementer as a new
   brief (core workflow rework loop); WARN findings are the leader's decision at Leader verify.
