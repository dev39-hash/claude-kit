---
description: Pre-merge review of one work package - spawns the core reviewer (reviewer model) on the whole branch diff with the handoff and the report, then records the verdict and the leader's decision in the WP review file.
argument-hint: "<WP-xx | handoff path> [branch] [base]"
---

# /review-wp

**Arguments**: $ARGUMENTS

Leader only. Config: `packConfig.work-package` (`wpDir`, `reportsDir`, `reviewsDir`),
`git.integrationBranch`.

1. Resolve the inputs:
   - handoff: `<wpDir>/<WP-xx>_*.md` (ask if more than one matches);
   - report: `<reportsDir>/<WP-xx>_report.md`;
   - branch: the one named, else the WP branch the handoff's Environment section names;
   - base: the one named, else `git merge-base <integrationBranch> <branch>`.
2. Spawn `reviewer` with `model: <models.reviewer>`. The prompt gives the four inputs, the
   project's charter or boundary document when one exists, any area to examine in depth,
   and the WP-specific checks: every path in `git diff --name-status <base>..<branch>` on the
   touch list ("Must not touch" is BLOCK); each acceptance criterion mapped to the diff and
   to evidence in the report; report claims re-derived from the diff and marked checked /
   contradicted / not checkable; build registration of new files; an Accepted decision
   record contradicted without a new one is BLOCK. The prompt does not paste the diff and
   does not carry your opinion of the code.
3. When the review returns, verify each finding against the code, then decide: merge
   `--no-ff`, return the package with the confirmed findings, or record a deviation.
   Record verdict, findings, your check and your decision in `<reviewsDir>/<WP-xx>_review.md`
   (`templates/wp-review.md`). Human gates per `project/rules.md`.

Related: `work-package` skill, `wp-reviewer` agent for plan artefacts.
