---
name: work-package
description: Leader procedure for the work-package regime - write and file a handoff from the template, confirm the machine and the slot, spawn the wp-implementer on its own branch, check the report and evidence, run /review-wp, decide, merge --no-ff, record the review and update the plan. Use for every delegated implementation or documentation package in a project that runs on work packages.
argument-hint: <WP-xx | plan item>
---

# Work package (pack work-package)

Overrides the core `delegate-change` steps 2-6 for projects where implementers commit on their
own branch and the leader merges. Config: `packConfig.work-package` (`wpDir`, `reportsDir`,
`reviewsDir`, `integrationBranch` from `git`, `branchPattern`), `build.worktrees`.

## 1. Write the handoff

1. Copy `templates/wp-handoff.md` to `<wpDir>/WP-xx_<slug>.md`. The handoff is the whole
   specification: goal, read-first list, environment (base commit, branch, slot, build,
   model), **disjoint** touch list, facts you verified yourself (a symbol named in a handoff
   must exist; check it), numbered acceptance criteria with the evidence each needs,
   required negative checks that name the test and why it can see the change, stop rules,
   out of scope, the hard rules repeated.
2. Run the `change-impact` skill to prove the touch list; check it against every WP in
   flight and against the last bundle from the other machine (freeze windows, foreign
   footprints).
3. Classify (`task-classification.md`); an ADR or decision record goes first when the WP
   changes a contract.
4. Confirm with the human which machine implements the WP (it can change after the
   handoff is written); do not open a branch before that. Gate 1 per `project/rules.md`
   (delegated or human).
5. File or commit the handoff; the implementer gets the issuing commit's SHA.

## 2. Issue

- Prepare a worktree slot (`worktree-slots` skill) when another WP runs concurrently.
- Spawn `wp-implementer` with `model: <models.worker>`, the handoff path, the slot, and the
  prompt lines: any agent it spawns runs on the same model and gets these rules; do not
  start a reviewer agent; no AI attribution; stage by path; never launch or kill
  `processes.neverLaunch`.
- While an implementer works in the main tree, park new leader documents in the scratchpad
  and commit nothing (HEAD may be the implementer's branch).

## 3. Check the report

Open every listed file; re-run the checks; cross-check `git diff --name-status <base>..<branch>`
against the touch list (a changed-but-unlisted file fails the WP); verify the shape check
and the negative-check restore; try a negative check yourself where doubt remains. A
`STOPPED AT` marker means the package waits for a decision, not a retry.

## 4. Review

- `/review-wp WP-xx [branch] [base]` spawns the core `reviewer` (`models.reviewer`) on the
  whole branch diff with the handoff and the report.
- `wp-reviewer` for plan artefacts (state tables, decision records, the report itself) when
  the class asks for it.
- Verify each finding against the code before acting; record verdict, findings, your
  check and your decision in `<reviewsDir>/WP-xx_review.md` (`templates/wp-review.md`).

## 5. Decide and merge

- APPROVE (or WARN with each finding fixed or accepted): merge `--no-ff` into the
  integration branch with a message that names the WP; the implementer never merges.
- BLOCK or contradicted evidence: return the package with the confirmed findings; a second
  return on the same point goes to the human.
- Plan merge order around shared files; resolve shared build files at merge.
- After merging: re-run every suite on the integration branch against the baselines;
  release the slot (`worktree-slots`); update the plan record and the request log;
  distill `decisions.md` / `lessons.md`.

## 6. Human gates that always remain

Checkpoint rulings; freeze windows; push to a remote or bundle export; deleting retired
trees or anything outside the project; a firing stop rule; scope outside the charter;
anything the other machine must do. Packages blocked on these wait.
