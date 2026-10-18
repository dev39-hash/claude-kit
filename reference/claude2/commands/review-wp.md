---
description: Pre-merge review of one work package by the code-reviewer agent on Opus. Arguments - the WP id or handoff path, optionally the branch and base commit.
argument-hint: <WP-xx | handoff path> [branch] [base]
---

# /review-wp

Run the **code-reviewer** agent (`.claude/agents/code-reviewer.md`) on one work package before merge.

1. Resolve the inputs from `$ARGUMENTS`:
   - the handoff: `docs/plan/phase_*/wp/<WP-xx>_*.md` (ask if more than one matches);
   - the report: `docs/plan/phase_*/reports/<WP-xx>_report.md`;
   - the branch: the one named, else the WP branch the plan README or the report names;
   - the base: the one named, else `git merge-base main <branch>`.
2. Invoke the Agent tool with `subagent_type: "code-reviewer"` and **`model: "opus"`** (the one
   exception to the Sonnet rule). The prompt gives the four inputs above, the active charter path, and
   any area the PM wants examined in depth. It does not paste the diff; the agent reads it.
3. When the review returns, the PM checks each finding against the code before acting on it, then
   decides: merge, return the package with the confirmed findings, or record a deviation. Record the
   verdict and the PM's decision in the WP review file the phase uses (`reports/<WP-xx>_review.md`).
