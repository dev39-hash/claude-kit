---
name: dev-deploy-sync-workflow
description: "The agreed procedure and rules for exchanging commits between the dev machine (GitHub) and the deploy machine (local git) via range bundles on the shared `main` branch, incl. 3rdparty tracking policy."
metadata: 
  node_type: memory
  type: project
  originSessionId: beca2a5a-043f-40d5-80c6-6e09d77a0dae
  modified: 2026-09-21T00:20:00.000Z
---

Agreed 2026-09-21 after the first successful sync. Follow this for every future exchange between dev and deploy. Identities and topology: [[two-machine-git-topology-and-identities]].

**Baseline (updated 2026-10-02, after deploy's second range bundle):**
- **2026-10-14: deploy -> dev bundle applied.** It is `deploy-to-dev-2026-10-14.bundle`: 90 commits,
  `master --not 89a601c1`, SHA-256 `77bcc90d…`.
  - Dev `main` fast-forwarded to **`c2849527`** (tags `sync/deploy-2026-10-14`, `phase10-closeout`).
  - `deploy-repo` was refreshed by replaying the dev 2026-10-05 bundle and then this one.
    `deploy-repo-backup` was fast-forwarded.
  - All three sit at `c2849527`, tree `df3b20b4`.
  - **The shared marker is now `c2849527`**, so the next dev->deploy bundle is `main --not c2849527`.
  - Deploy applied our 2026-10-05 bundle on 2026-10-07, with a normal merge `6ebb6635`.
  - Deploy keeps its packages at `C:/DGB/build_packages/_install/<name>`, not in `C:/build_packages`
    (machine-local `local_paths.pri`).
- (applied) **2026-10-05: bundle 2 exported:** `dev-to-deploy-2026-10-05.bundle`.
  - 432,079 B, SHA-256 `2f3ef2b0…7838`.
  - Contents: `main sync/dev-2026-10-05 sync/dev-2026-10-04 phase11-cp0 --not fff149a8`, 48 commits up
    to **`89a601c1`**, tree `d6c80cc4`.
  - It **supersedes** bundle 1: renamed `*.SUPERSEDED.bundle`, with a banner in its note.
  - Rehearsed twice:
    - a bare clone of `deploy-repo` (at `fff149a8`) can fast-forward;
    - `deploy-repo-backup` fast-forwarded `672afe44` → `89a601c1`, tree equal, three tags present.
  - The note `update-bundle-2026-10-05.md` (Vietnamese) gives the order: WP-02, ADS built with deploy's
    Qt 6.8.3, retire the old RK copy, apply the bundle (which deletes 349 RK files), copy the refreshed
    RK drop, restore 14 STLs, add 5 `local_paths.pri` lines, check the Coal debug files, run the tool at
    40/0.4, retire the 8 `3rdparty` trees, umbrella build, 6 suites.
  - It also carries three unnumbered Phase 10 findings: the flaky WP-28 test, the MC enum D-1 bug and a
    stale comment. DR-0101 is taken.
  - **The next confirmed marker is `89a601c1`** once deploy confirms.
- (superseded) **2026-10-04 bundle exported, NOT yet carried to deploy:** `dev-to-deploy-2026-10-04.bundle` (109,345 B, SHA-256 `2051dbf0...4a67`) = `main sync/dev-2026-10-04 phase11-cp0 --not fff149a8`, 6 commits up to **`672afe44`** (WP-02 merged at `e720726b`, plus the record commit). It was rehearsed on `deploy-repo-backup`, which is now at `672afe44`, tree `13a737da`. The owner will carry it **together with a second bundle (WP-03)**. The note `update-bundle-2026-10-04.md` sets the order: bundle 1, then deploy runs WP-02, then deploy edits `local_paths.pri`, then bundle 2. Build bundle 2 with `--not fff149a8` (the last CONFIRMED marker) so it subsumes bundle 1 and applies either way. Until deploy confirms, `fff149a8` stays the shared marker; `deploy-repo` stays at `fff149a8`.
- (earlier) dev `main` was at **`b434033d`** (2026-10-04): `401ed624` removed the Huayan copies, `b5ce601b` added the qpb source, and `b434033d` opened Phase 11, tagged `phase11-cp0`. `reference_source/deploy-repo-backup` and `reference_source/deploy-repo` are three commits behind at `fff149a8`, tree `d83d6986`, and the backup catches up with the next bundle. That bundle must carry the Phase 11 boundary, the numbering and the freeze-window rule in its note;
- the 2026-10-02 exchange put all three at `fff149a8` first: dev `main`, `reference_source/deploy-repo` (`master`) and `reference_source/deploy-repo-backup` (`main`);
- `origin/main` is at **`401ed624`** (read 2026-10-02 evening) — **the owner pushes GitHub themselves** (2026-09-27 at 23:03, again for the workflow commit, and again on 2026-10-02 up to the Huayan cleanup), so dev `main` was level with GitHub at that point. It is now ahead by 2 (`b5ce601b`, `b434033d`), unpushed. **Always read `origin/main` before quoting a push position;**
- **the shared marker is `sync/deploy-2026-10-02` (annotated) at `fff149a8`** — deploy's own commit, so it is confirmed by definition. The next dev→deploy bundle is `main --not fff149a8`;
- deploy applied `dev-to-deploy-2026-09-27.bundle` (its bundle's prerequisite was `8cde1abe`), so both dev commits and `docs/workflow/` are on the deploy machine now;
- the 2026-10-02 bundle was 172.125 bytes for **29 commits** (WP-27 … WP-30 plus their docs);
- deploy runs branch `master` still, and **its tags are annotated** while dev's sync tags are lightweight — both travel fine.

**The lesson from the first two exchanges, kept because it will recur:** a dev tag records what dev *sent*, not what deploy *has*. `LAST` is only ever a commit the other side has confirmed — in 2026-09 that gap made two 95-110 MB bundles unavoidable, while the same content as a true range is kilobytes. History is shared in dev's graph, so plain `git merge` finds the merge base by itself.

## Rules

1. **Only bundles, never snapshots or folder copies.** A snapshot has no ancestry and recreates the unrelated-history problem (dev had to hand-build a merge with `git merge-tree --merge-base` once).
2. **Never rewrite history that the other side may have fetched.** Any rewrite (e.g. removing trailers) happens before a bundle is sent. Force-push to GitHub only when the user explicitly asks, with `--force-with-lease`.
3. **Branch is `main` on dev and on the backup, `master` on deploy** (verified 2026-09-21 from `reference_source/deploy-repo`). The bundle's `main` is fetched into `dev-incoming` and fast-forwarded into `master`; renaming deploy's branch is the owner's call. Deploy has no remote; only dev pushes to GitHub, and only when the user asks.
4. **The side that merges creates the merge commit and sends it back**, so the other side only fast-forwards (`--ff-only`).
5. **Commit identity per side:** dev = dev28 `<devgbit@gmail.com>`, deploy = dev27 `<dev27@local>`. No `Co-Authored-By`, no "Generated with Claude Code".
6. **Don't edit docs/comments/notes during a merge** (user instruction); flag stale text instead (e.g. `3rdparty/README.md` and `.gitignore` lines ~104-106 still call `advance_docking` "tracked").
7. **Untracking commits travel in the same bundle as everything before them**, so the receiver fast-forwards straight to a tree that no longer has the files. Sending a tracking bundle and then an untracking one makes git create then delete the files on the receiver's disk.

## 3rdparty policy
Only `3rdparty/qtpropertybrowser/` (+ `3rdparty/README.md`) is tracked. Everything else is provisioned locally on each machine and ignored: `advance_docking, assimp, boost, coal, eigen, fcl, libccd, jrl-cmakemodules`. Never re-track them; a new prebuilt dependency gets a `.gitignore` rule. Machine-local build files stay ignored and are never merged: `qmake/local_paths.pri`, `*.pro.user`, `local-env-path.md`, `build/`.
Known leftover: 9 files under `components/RobotKinematics/docs/agent-skills/.claude|.github` are tracked but match ignore rules (`.claude/`, `.github/` match at any depth). A fast-forward overwrites an ignored local file at those paths silently. Check for such mismatches before a bundle with `git ls-files -ci --exclude-standard`.

## Dev -> deploy
On dev (`LAST` = the commit deploy has actually confirmed, today `45fc1bb0` — not a tag deploy never acknowledged):
```
git tag sync/dev-<date> main
git bundle create product_release/bundle-to-deploy/dev-to-deploy-<date>.bundle main sync/dev-<date> --not <LAST>
git bundle verify product_release/bundle-to-deploy/dev-to-deploy-<date>.bundle
```
On deploy:
```
git bundle verify <bundle>
git fetch <bundle> refs/heads/main:refs/heads/dev-incoming refs/tags/sync/dev-<date>:refs/tags/sync/dev-<date>
git merge --ff-only dev-incoming      # or plain `git merge dev-incoming` if deploy has new commits, as dev27
git branch -d dev-incoming
git tag sync/deploy-<date> main       # then send back if deploy created a merge commit
```
Never `git fetch` the bundle straight into `main`; use the temporary `dev-incoming` branch.

**Test an outgoing bundle by fast-forwarding the backup clone with it before handing it over** (done 2026-09-26: `3668c32a` → `6b840e47` in `deploy-repo-backup`, then its tree matched dev's). The backup has to move anyway — it is refreshed on every commit — so this costs nothing and turns "it should apply" into "it applied".

**A tag that points at an already-shared commit still travels in a range bundle.** Naming `phase10-cp1` (at `3668c32a`) in a bundle built with `--not 3668c32a` works: git packs the tag object even though the commit it points to is excluded, and the receiver's `fetch` creates the tag. So checkpoint tags do not need a bundle of their own.

**Why a full dev→deploy bundle is ~95 MB (measured 2026-09-21):** code is under 1 MB; the rest is history of files no longer in the tree — `docs/generated` 31 MB and untracked 3rdparty trees about 58 MB. One commit, `c8050a28` (2026-06-24, "restructure"), carries 57 MB by itself, so a bundle split along history can never go below that. If a channel caps file size, split bytes (`split -b 20M -d`) and rejoin with `cat`, checking SHA-256 — proven 2026-09-21, though the owner ended up uploading the whole file. Only a history purge (`git filter-repo` plus a coordinated force-push) would shrink it.

**While the previous bundle is unconfirmed, build the next one on the last CONFIRMED marker so it subsumes the old one** (done 2026-09-27: `--not 3668c32a` produced a bundle that applies whether deploy is still at `3668c32a` or already at `6b840e47`, so the owner does not have to remember which). Then rename the older file `*.SUPERSEDED.bundle` and put a banner at the top of its note, so the wrong file cannot be carried across. **A second dev→deploy bundle on the same day gets a suffixed tag** (`sync/dev-2026-09-21b`) instead of moving the first one, which already sits in the backup and inside the first bundle. Rename the superseded bundle to `*.SUPERSEDED.bundle` so the owner cannot carry the wrong file; delete it only when the owner says so.

## Deploy -> dev

**Both sides send a handover note beside the bundle** (`update-bundle-<date>.md`; deploy's of 2026-09-25 was the first, dev answered with one on 2026-09-26 in the same shape and in Vietnamese): the bundle's size and **SHA-256**, its refs, the prerequisite commit, the fetch/merge commands, whether a rebuild is needed with the suite counts it measured, what the bundle does and does not carry, and what to do first. Check the SHA-256 before fetching, and read the note before merging — it is the fastest statement of what changed.
On deploy: `git bundle create deploy-to-dev-<date>.bundle main sync/deploy-<date> --not sync/dev-<LASTDATE>` (deploy chooses its own output path; on dev the file is filed under `product_release/bundle/`).
On dev:
```
git fetch <bundle> refs/heads/main:refs/remotes/deploy-bundle/main refs/tags/sync/deploy-<date>:refs/tags/sync/deploy-<date>
git merge deploy-bundle/main          # as dev28; ff if dev has nothing new
git update-ref -d refs/remotes/deploy-bundle/main
```
If dev created a merge commit, tag `sync/dev-<date>` and send a dev->deploy bundle so deploy fast-forwards. Then, when the user asks, `git push origin main` (normal push).
If the merge would delete lots of files, check whether deploy deliberately untracked them (`git log -S` / read commit messages) or whether they were simply ignored on deploy; keep dev's copies in the latter case.

## Backups
- **Refreshing `deploy-repo` needs BOTH bundles replayed, in order (hit again 2026-10-02).** It lags behind the real deploy machine, so an incoming deploy bundle whose prerequisite is a dev commit fails on it with "Repository lacks these prerequisite commits". Fix: first fetch and `merge --ff-only` the **dev→deploy** bundle that deploy itself had applied, then the incoming deploy bundle. Nothing is lost — the failed fetch leaves no refs behind (checked).
- **Two folders, two jobs (user rule, 2026-09-21).** `reference_source/deploy-repo/` records **where the deploy machine actually is** (today `master` @ `45fc1bb0`) and is refreshed ONLY when the user asks for an update from the deploy side — otherwise never touched, because it is the ground truth to compare against. `reference_source/deploy-repo-backup/` is the one **updated and conflict-checked on every commit**, and the disaster-recovery copy if the deploy machine's project is lost. The gap between the two is the answer to “how far behind is deploy?”
- Both are `git clone`s of the deploy repo, not byte copies: the deploy machine's own branches survive only as `refs/remotes/origin/*` (`wp-05..wp-10`, `merge-dev-2026-09-17`, `dev-snapshot-2026-09-17`). Keep them; they are the recovery material. Their `origin` URL is `C:\DGB\Project\ncr_picking`, a deploy-machine path that does not exist on dev, so `git fetch origin` there always fails — refresh from a bundle instead.
- **Refresh recipe (proven 2026-09-21):** `git -C <backup> bundle verify <bundle>` → `git -C <backup> fetch <bundle> refs/heads/main:refs/heads/dev-incoming refs/tags/sync/dev-<date>:refs/tags/sync/dev-<date>` → `git -C <backup> merge --ff-only dev-incoming` → `git -C <backup> branch -d dev-incoming`. Never merge into it, never re-copy the folder.
- Pristine means "no merge commits and no edits", not "no refs": fast-forwarding it and re-creating the deploy sync tag is the intended maintenance.
- **Two bundle folders (owner renamed them 2026-09-25):** outgoing in `product_release/bundle-to-deploy/`, incoming in `product_release/bundle-from-deploy/`. (Both were `product_release/bundle/` before that.) `product_release/` is ignored at `.gitignore:148` and `reference_source/` at `.gitignore:145`; never commit either.
- Dev-only safety refs from the 2026-09-20 cleanup: branch `backup/pre-rewrite-20260920`, tags `backup-main-pre-rewrite-20260920`, `backup-restructure-phase-a-b-20260920` (they still contain `Co-Authored-By`; never push them).

## Verified 2026-09-21 (full round trip, nothing mutated)

Rehearse a sync without touching either real repo:
1. `git clone --no-local --bare <backup> <scratch>/deploy-sim.git` — a bare clone is enough and skips a 10k-file checkout.
2. In the sim, `git fetch <bundle> refs/heads/main:refs/heads/dev-incoming`, then `git merge-base --is-ancestor main dev-incoming` — that is exactly what `merge --ff-only` will decide, without a working tree.
3. For the return path, fetch the deploy bundle into the **dev** repo as `refs/remotes/deploy-bundle/main`, judge it with `merge-base --is-ancestor` (ff) or `git merge-tree --write-tree main refs/remotes/deploy-bundle/main` (dry-run merge, conflicts reported, nothing written to `main` or the working tree), then `git update-ref -d` it.

Results: dev→deploy fast-forwards `45fc1bb0 → 6e9576fa` cleanly; deploy→dev applies and fast-forwards; dev `main` and backup `main` now resolve to the **same tree `2efd711d`** — the two sides are byte-identical.

**Gotcha — `git fetch <bundle>` auto-follows tags.** A tag reachable from the fetched ref lands in the receiver even when the refspec does not name it. After a probe or a rehearsal, check `git tag -l` and delete what you did not mean to import; a stray `sync/*` tag will silently become the wrong `LAST` marker for the next range bundle.

**Send ranges as soon as a shared confirmed commit exists.** Not yet: deploy is still at `45fc1bb0`, so the next dev→deploy bundle is unavoidably the big one. The 2026-09-20 bundles are 110 MB because they record a *complete* history (`git bundle verify` prints "The bundle records a complete history" — check that line). The same content as a true range, `main sync/dev-<date> --not sync/deploy-<date>`, is **709 bytes**. Verify against a repo that actually holds the prerequisite: `bundle verify` prints "The bundle requires this ref: <sha>" and fails where that commit is missing.

**What the check changed:** the backup was renamed `master` → `main`, fast-forwarded `45fc1bb0` → `6e9576fa` (adds 9 files, deletes none), its dangling `branch.main.remote/merge` upstream unset, and `sync/dev-2026-09-20` (`6e9576fa`) plus `sync/deploy-2026-09-20` (`d0448cbb`) created in it. Its `refs/remotes/origin/*` still hold the deploy machine's ten WP branch tips — keep them, they are the recovery material. Untracked `temp-memory/` in the backup is the user's and was left alone. **The backup is therefore no longer a mirror of the deploy machine but a pre-staged copy of where deploy lands after the sync** — see the corrected baseline at the top.

Related: [[shared-working-conventions-with-deploy]].
