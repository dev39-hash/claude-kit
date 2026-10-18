---
name: phase-6-work-is-untracked
description: All Phase 6 implementation is uncommitted in git; runtime_app/ was lost once because of it and had to be restored by hand.
metadata: 
  node_type: memory
  type: project
  originSessionId: e98fdcf1-2c13-48a6-a0ae-3cb544df894f
  modified: 2026-09-20T15:03:37.084Z
---

**Outdated since 2026-08-23:** `runtime_app/` and the Phase 6 files were committed (commit `51469ecf` "runtime app") and are now part of `main`. The lesson (uncommitted work is invisible to git) still applies to new work; verify with `git status` before relying on this note.

As of 2026-08-23 the entire Phase 6 implementation is **uncommitted**: `runtime_app/`,
`src/src.pro`, `qmake/app_common.pri`, `qmake/common_deps.pri`, `qmake/version.pri`,
`ncr_picking_all.pro`, `scripts/make_dist.ps1`, `src/core/app_version.h`,
`src/core/utils/single_instance_guard.*`, `docs/history/plan/` and `docs/domains/runtime_app/`
are all untracked or modified-but-unstaged. The last commit is `42ff4bda update docs`.

`runtime_app/` disappeared from disk entirely at one point. Because it had never been
committed, git could not recover it — no history, no stash. The user restored it from
their own copy.

**Why:** untracked new folders are invisible to every git safety net. The plan file that
describes this phase (`docs/history/plan/phase_6_implementation_plan.md`) is itself
untracked, so the record of what was built is exposed to the same loss.

**How to apply:** before starting work that touches Phase 6 artefacts, check `git status`
for whether they are still untracked, and say so. Suggest committing before large changes
rather than assuming git can undo them. Never rely on `git checkout`/`git stash` to
recover anything under `runtime_app/`, `qmake/`, or `docs/history/plan/`.

Related: [[qt-creator-is-the-users-build-path]]
