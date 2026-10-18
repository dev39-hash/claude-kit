---
name: controller-review
description: One-step review of a change to a controller built on ctrl_kernel - collects the current diff (or named files / a design doc) and runs the controller-reviewer agent on model opus against the twelve laws, the smells and the project's rules, then summarises the verdict. Use as /controller-review before committing, after an implementation task, or on a new controller design.
---

# Controller review

1. Scope: the argument if given (files, a directory, a design doc); otherwise the working-tree
   change (`git diff` and `git diff --staged`). With no git and no argument, ask what to review.
2. If the project has a gate tool, run it on the scope first
   (controller-kernel: `node .claude/tools/gate-check.js <files>` or `--all`).
3. Spawn the `controller-reviewer` agent with `model: "opus"`. Its brief: the scope, the gate
   output, what the change is meant to do, and any ADR or design doc that governs it.
4. Report the verdict (APPROVE / WARN / BLOCK) and the findings ranked by severity. Do not
   apply fixes inside this skill; a BLOCK goes back to the implementer as a new brief.
