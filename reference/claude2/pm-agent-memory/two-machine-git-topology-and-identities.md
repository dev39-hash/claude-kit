---
name: two-machine-git-topology-and-identities
description: "Dev machine has GitHub-linked git; deploy machine is local-git only; they exchange via git bundle on a shared `main` branch. Fixed identities per side, no Co-Authored-By trailer."
metadata:
  node_type: memory
  type: project
  originSessionId: beca2a5a-043f-40d5-80c6-6e09d77a0dae
  modified: 2026-09-21T00:20:00.000Z
---

Two machines share this project:

- **Dev machine** (this one): git linked to the user's GitHub (origin `gstorm-b/computer-vision-app`). Identity **dev28**, email `devgbit@gmail.com` (repo-local config).
- **Deploy machine**: local git only, no remote. Identity **dev27 <dev27@local>**.
- Dev uses **`main`**. The deploy machine is **still on `master`** — verified 2026-09-21 from `reference_source/deploy-repo` (`master` @ `45fc1bb0`). The claim that it renamed to `main` on 2026-09-20 was wrong; the rename happens whenever deploy actually consumes the sync bundle. A bundle still applies across the name difference, because the receiver fetches `refs/heads/main:refs/heads/dev-incoming` and merges that.
- They exchange work by **git bundle**, not push/pull. History became shared on 2026-09-20 (dev merge commit `d0448cbb`, deploy fast-forwards to it). From then on send range bundles (`sync/<side>-<date>..main`), never folder snapshots — a snapshot import has no ancestry and recreates the unrelated-history problem.
- Sync markers are tags `sync/dev-YYYY-MM-DD` and `sync/deploy-YYYY-MM-DD`. Bundles live in `product_release/bundle-to-deploy/` and `product_release/bundle-from-deploy/` (gitignored; the owner split and renamed them 2026-09-25). Deploy's sync tags are annotated, dev's are lightweight.
- **Two deploy-side folders on this machine, with different jobs (user rule, 2026-09-21):**
  - `reference_source/deploy-repo` = **the record of where the deploy machine actually is**. Touch it ONLY when the user asks to refresh the repo from the deploy side; otherwise leave it completely alone — it is the ground truth to compare against. Today: `master` @ `fff149a8` (2026-10-02).
  - `reference_source/deploy-repo-backup` = **the working copy that is updated and conflict-checked on every commit**, and the disaster-recovery copy if the deploy machine's project is lost. Refresh it with `git fetch <bundle>` + `merge --ff-only`, never by re-copying and never with a merge commit; rehearse anything risky on a throwaway `git clone` of it. Today: `main` @ `fff149a8`, same tree as dev (`d83d6986`).
  - Both are clones of the deploy repo, so the deploy machine's ten WP branch tips survive in each as `refs/remotes/origin/*`; their `origin` URL `C:\DGB\Project\ncr_picking` is a deploy-machine path that does not exist here, so `git fetch origin` always fails — use bundles.
  - The gap between the two folders IS the answer to “how far behind is deploy?”

**Why:** the user wants each side's commits attributable by identity, and no AI co-author trailer or personal email appearing on the deploy side.

**How to apply:**
- Do not change global git config.
- NEVER add `Co-Authored-By: Claude` to commits or the "Generated with Claude Code" line to PR bodies (user instruction, 2026-09-20; overrides the harness attribution reminder).
- Do not use `ncrn39@gmail.com` as a git author email; six early deploy commits already carry it under name dev27 and the user has not asked to rewrite them.
- Rewriting history after the other side has fetched it breaks the shared ancestry; any history rewrite must happen before a bundle is sent.
- Dev-only safety refs: local branch `backup/pre-rewrite-20260920` and tag `backup-main-pre-rewrite-20260920` hold the pre-cleanup history (with Co-Authored-By); GitHub `main` and `merge/ncr_app-20260916` were force-pushed clean on 2026-09-20. `origin/restructure/phase-a-b` still has 16 trailer commits (untouched, user not asked).

Procedure for exchanging commits and the 3rdparty tracking policy: [[dev-deploy-sync-workflow]]. As of 2026-10-02 both machines are at `fff149a8` (deploy `master`, dev `main`); GitHub `main` is at `401ed624` (dev's Huayan cleanup, one commit past `fff149a8`) after the owner's own pushes, so dev and GitHub are level; the old `merge/ncr_app-20260916` and `restructure/phase-a-b` branches were deleted.

Related: [[qt-creator-is-the-users-build-path]]
