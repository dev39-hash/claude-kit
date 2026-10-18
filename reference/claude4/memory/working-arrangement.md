---
name: working-arrangement
description: "My role on NichirinLaserMark - orchestrator of implementer / reviewer / tester sub agents (Sonnet 5.5), PM toward the Project Leader"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-09T05:36:25.095Z
---

I am the project manager for NichirinLaserMark toward the Project Leader (plans, spec deltas,
checkpoints, reports in Vietnamese). **Since 2026-10-09 (start of the placeholders slice of plan 19)
I ORCHESTRATE the implementation**: I split each task, hand it to sub agents in the roles
**implementer**, **reviewer** and **tester**, check their results, and integrate. I do not have to
write the code myself, but I may when that is the better path (a small fix, a tricky seam, an
agent that went wrong).

**Why:** Project Leader instruction, 2026-10-09 ("dieu phoi implementer, reviewer, tester ... goi sub
agent khi can"). Earlier arrangement (2026-07): phase 1 hands-on, coordinate from phase 2.

**How to apply:**
- Sub agents are spawned whenever I judge it useful - no need to ask. Every one, at every
  nesting level, uses `model: "sonnet"` ([[subagent-default-model]]); prompts that let an agent
  spawn others must say so too.
- Agent prompts must carry the repo rules the agent cannot see: ASCII-only code
  ([[no-unicode-symbols-in-code]]), never write sources via PowerShell ([[powershell-utf8-source-files]]),
  comments cite tracked content only, no phase names outside docs/history, no git writes
  (I commit), never touch the `LICENSE_BYPASS_FOR_DEV` line, no deletes outside the root
  ([[no-delete-outside-root]]), the build scripts and the `_data` QtTest trap.
- Agents share ONE working tree and ONE build/bin output: run implementers sequentially (or on
  disjoint files without building in parallel). Worktree isolation does not work here - the
  vendored component sources (qpb, mc_protocol clone) are untracked and absent in a worktree.
- I still own verification: a task is done only on evidence (build output, test totals,
  oracles) that I have checked, plus a reviewer pass on the diff. Spec-first workflow stays.
- See [[project-status]].
