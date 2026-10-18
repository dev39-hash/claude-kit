# Work-package regime (pack work-package)

Always loaded when the pack is installed. It overrides the core task flow in exactly these
points; everything else in `WORKFLOW.md` and the core rules still applies.

- **Unit of work is a work package (WP)**: a handoff file (`packConfig.work-package.wpDir`,
  template `wp-handoff.md`) is the whole specification; the implementer neither widens nor
  narrows it. The handoff is written and committed (or filed) by the leader before the
  implementer starts, and names the base commit, the branch and the worktree slot.
- **The implementer commits on its own branch** (`git.whoCommits = implementer-branch`,
  `git.commitCadence = wp`): one branch per WP from the integration branch at the named
  commit, one commit (plus an optional report-only commit); never amend, rebase, hard-reset
  or touch the integration branch. The leader merges `--no-ff` after the review.
- **Touch list is law**: "May edit/create" and "Must not touch" are disjoint from every
  concurrent WP; a changed-but-unlisted file is a failed WP, not a deviation.
- **Report has six sections in order** (template `wp-report.md`): Changed files, Evidence,
  Negative checks, Deviations, Findings out of scope, Open questions; final reply at most
  20 lines.
- **Review before merge**: `/review-wp` spawns the core `reviewer` (model `models.reviewer`)
  on the whole branch diff with the handoff and the report; `wp-reviewer` reviews plan
  artefacts (tables, decision records, reports). The leader verifies each finding against
  the code, decides, and records verdict and decision in the review file (template
  `wp-review.md`). The leader's decision is final; a verdict is input.
- **Gate delegation**: a project may let the leader issue, review and merge WPs without a
  Gate 1 / Gate 2 round trip (`gates` in `kit.config.json` plus the scope in
  `project/rules.md`). The leader still stops for: checkpoint rulings, freeze windows, a
  push or bundle export, deletes outside the project or of retired trees, anything outside
  the charter boundary, a firing stop rule, anything the other machine must do. Blocked
  packages wait; say so instead of guessing.
- **Parallel WPs** run in worktree slots (`worktree-slots` skill); builds may run in parallel,
  test suites may not. Which machine implements a WP is the human's call; do not open a
  branch until it is confirmed; keep work-split statements out of committed docs.
- **Two machines** exchange work only through git bundles with handover notes
  (`two-machine-bundle` skill); never snapshots, never history rewrites after a bundle was
  sent.
- Findings that belong to the other side are reported unnumbered with both readings; the
  owning side numbers and rules.
