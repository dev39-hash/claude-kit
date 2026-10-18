---
name: fresh-subagent-per-task-when-context-heavy
description: Spawn a new subagent for the next task instead of resuming one whose context has grown large
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1c0df7ef-a9b5-4ce3-8147-5a3bd661ce36
  modified: 2026-10-02T11:25:00.696Z
---

When the next task starts, spawn a **new** developer/tester/reviewer subagent instead of resuming (SendMessage) one that already carries a lot of context. Resuming is fine for a short follow-up on the same task (a rework item, a question), not for a new task.

**Why:** On 2026-10-02 the owner saw the Phase 7 developer subagents reach very large contexts (~0.5–0.9M tokens) after being resumed across T-057…T-064, and asked that the next task get a fresh subagent.

**How to apply:** Hand a new agent the task file path plus the briefing (rules, build-env, decisions); everything it needs must be in the task files and project docs, not in a previous agent's memory. Keep resuming only for the current task's rework and re-checks. Related: [[agent-team-system-staged]].
