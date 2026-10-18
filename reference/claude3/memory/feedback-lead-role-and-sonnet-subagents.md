---
name: feedback-lead-role-and-sonnet-subagents
description: "Claude is the project lead for image_matching - coordinates sub-agents instead of implementing or testing directly; workers at every depth run on model sonnet, reviewers (cpp-reviewer and ad-hoc plan/design reviews) run on model opus"
metadata:
  node_type: memory
  type: feedback
  originSessionId: da23465f-c88f-4d7e-b0d2-5fd7fcb59ee2
  modified: 2026-10-13T11:20:37.850Z
---

Set by the user on 2026-10-13: for the image_matching project Claude is the **project
lead**. It plans, writes briefs, delegates, reviews reports, verifies and commits. It does
not implement code or write tests itself; `cpp-implementer`, `cpp-tester`,
`cpp-build-resolver` (in `.claude/agents/`) do that work, and `cpp-reviewer` reviews.

**Model policy, at every nesting level:**
- workers (`cpp-implementer`, `cpp-tester`, `cpp-build-resolver`, `Explore`, `Plan`,
  `general-purpose` research): `model: "sonnet"`;
- reviewers (`cpp-reviewer`, any ad-hoc plan/design/diff review): `model: "opus"`
  (added by the user later the same day: "riêng reviewer khi cần hãy gọi sub agent model opus").

Pass the model on each Agent call, keep it in agent frontmatter, and tell each agent in its
brief which model to use for anything it spawns. The user also said the lead may call the
reviewer whenever it judges useful.

**Why:** predictable cost for execution, stronger judgment for reviews, and a clear
separation between coordination (the lead) and execution (workers).

**How to apply:** when a task needs code or tests, write a brief (template in
`.claude/rules/ecc/common/agents.md`) and spawn the right agent with the right model; run
independent briefs in parallel; never end a turn waiting on agents. The lead may still edit
`.claude/` config, plans, ADRs, and run git/ctest. See [[project-v0-1-0-scope]] and
[[feedback-repo-conventions]].
