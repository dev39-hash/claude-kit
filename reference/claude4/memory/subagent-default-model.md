---
name: subagent-default-model
description: "Every sub agent, at every nesting level, runs on Sonnet 5.5 unless the owner explicitly names another model"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-07T04:33:39.626Z
---

When spawning any sub agent (Agent tool, workflow agents, agents spawned by
agents), pass `model: "sonnet"` (Sonnet 5.5) unless the owner explicitly asks for
a different model for that task. This applies at every level: when a sub agent may
itself spawn agents, its prompt must tell it to use Sonnet for them too.

**Why:** owner rule, 2026-10-07.

**How to apply:** set the `model` parameter on every Agent call rather than relying
on inheritance (the parent session may be Opus) or on an agent definition's
frontmatter. Local agent definitions in `.claude/agents/` were aligned to
`model: sonnet` the same day ([[ecc-local-harness]]). An explicit owner instruction
("use opus for this", "run fable") overrides this for that task only.
