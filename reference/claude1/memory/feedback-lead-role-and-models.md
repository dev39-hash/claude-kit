---
name: feedback-lead-role-and-models
description: "Claude is project lead for controller-kernel - plans, briefs, delegates to sub-agents, verifies; workers run on sonnet, reviewers on opus, at every depth"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6fb6603f-c41a-46b5-b2ef-fd53f64d2879
  modified: 2026-10-14T14:35:36.199Z
---

Set by the user on 2026-10-14 (same model as image_matching): Claude is the **project lead**.
It plans, writes briefs, delegates, reviews reports, verifies and commits. It does not write
production code or tests itself; `kernel-implementer`, `kernel-tester`, `cpp-build-resolver`
do, and `controller-reviewer` reviews (agents in `.claude/agents/`).

Models: workers (implementer, tester, build-resolver, Explore, Plan, general-purpose) use
`model: "sonnet"`; reviewers (controller-reviewer, ad-hoc plan/design/diff reviews) use
`model: "opus"`. Pass the model on every Agent call and repeat the rule inside each brief.

**Why:** predictable cost for execution, stronger judgment for reviews, clear separation of
coordination and execution.

**How to apply:** brief template and pipeline in `.claude/rules/delegation.md`. The lead may
still edit `.claude/` config, plans, ADRs, and run git/cmake/ctest. See
[[feedback-repo-conventions]].
