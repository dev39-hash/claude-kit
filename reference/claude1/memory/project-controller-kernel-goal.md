---
name: project-controller-kernel-goal
description: "controller-kernel is the user's reusable standard for device-coordinating controllers; .claude is split into layer A (portable controller-* skills/agents, to become a plugin later) and layer B (this repo's dev setup)"
metadata:
  node_type: memory
  type: project
  originSessionId: 6fb6603f-c41a-46b5-b2ef-fd53f64d2879
  modified: 2026-10-14T14:35:41.292Z
---

Goal (user, 2026-10-14): a standard controller design for all their projects, easy to extend
and maintain when logic changes or events are added. The kernel (pure core
`step(Event) -> Effects`, twelve laws, 8-step recipe, test kit) was extracted on 2026-10-14
from a Qt vision-picking application; the origin plan is kept in
`.claude/docs/plan/origin-plan.md` for context only.

`.claude/` has two layers: **A** = portable knowledge (`controller-design`,
`controller-add-event`, `controller-add-block`, `controller-change-rule` skills and the
`controller-reviewer` agent) meant to be extracted into a plugin later (user decision: keep it
in `.claude/` first, split later); **B** = this repo's development setup (build, hooks,
memory, ADRs).

**Why:** consuming projects (the Qt picking app and future controllers) should get the same
procedure without copying files by hand.

**How to apply:** keep layer-A files free of this repo's private paths and of process
references, so extraction is a move, not a rewrite. See [[feedback-repo-conventions]].
