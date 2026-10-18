---
name: agent-team-system-staged
description: "Agent-team workflow (leader + developer/tester/reviewer subagents, baton files) in daily use since 2026-09-27; at every commit update plan.md, todo.md and project-context together"
metadata:
  node_type: memory
  type: project
  originSessionId: 1c0df7ef-a9b5-4ce3-8147-5a3bd661ce36
  modified: 2026-10-04T12:28:54.390Z
---

The agent team system is **in daily use**. It has carried T-001…T-077 through Phase 8 and its follow-ups (2026-10-04).

**Where things live:**
- `agent-team/core|project|memory/`
- the agent shims `.claude/agents/team-*.md`
- root `CLAUDE.md`, which points the main session at the team-leader role
- the baton files `tasks/active|done/T-0xx.md`

**Rules:**
- The leader is the main session. Developer, tester and reviewer are Sonnet subagents.
- The owner gates each phase. Delegation per phase is recorded in `agent-team/project/rules.md`.
- **Progress bookkeeping:** the owner noticed stale progress on 2026-10-04. At every commit, update all of these in the same commit:
  - `tasks/todo.md`;
  - `tasks/plan.md`: the phase checklist and the checkpoint "Done" lines;
  - at phase ends, `agent-team/project/project-context.md` "Current state".

**Why:** the plan file is what the owner reads for progress, and it went stale from Phase 7 while only todo.md was ticked.

**How to apply:** make it part of Gate 2. Before committing, grep plan.md for the tasks being committed and tick them there too.

Related: [[git-commit-identity-no-ai-trailer]], [[ask-before-reading-outside-project]], [[hil-capture-prerequisites-open]], [[fresh-subagent-per-task-when-context-heavy]].
