---
name: two-machine-bundle
description: Exchange commits between two machines that share a project without a common remote - range bundles on the integration branch with confirmed sync markers, handover notes, rehearsal on a throwaway clone, the receiving procedure with a temporary branch, backup clones and the gotchas (tags auto-follow, unconfirmed markers, snapshots). Use whenever work must travel to or from the other machine.
argument-hint: <export | import | rehearse | status> [bundle file]
---

# Two-machine bundle exchange (pack work-package)

Config: `packConfig.work-package.bundle` (`outDir`, `inDir`, `otherSide` {name, identity,
branch}, `thisSide`), `git.integrationBranch`, `git.identity`. A bundle export is a human
gate: prepare everything, hand the file and the note to the human, never push.

## Rules

1. **Only bundles, never snapshots or folder copies**: a snapshot has no ancestry and recreates
   the unrelated-history problem.
2. **Never rewrite history the other side may have fetched**; a rewrite happens before a
   bundle is sent.
3. **Range bundles only**, built against the last marker the other side has **confirmed**
   (its own `sync/<other>-<date>` tag, or the commit its note names). A tag this side created
   records what was sent, not what the other side has; using it as the base makes the next
   bundle unapplicable.
4. **The side that merges creates the merge commit and sends it back**, so the other side
   only fast-forwards (`--ff-only`).
5. Each side commits with its own identity (`git.identity` here; `otherSide.identity`
   there); no AI attribution, no personal addresses.
6. Untracking commits travel in the same bundle as everything before them, so the receiver
   fast-forwards straight to the tree without the files.
7. Do not edit docs or comments during a merge; flag stale text in the note instead.

## Export (this side -> other side)

```bash
git tag sync/<thisSide>-<date> <branch>                       # lightweight is fine
git bundle create <outDir>/<thisSide>-to-<other>-<date>.bundle <branch> sync/<thisSide>-<date> <checkpoint tags> --not <LAST confirmed sha>
git bundle verify <file>                                       # must NOT say "records a complete history"
sha256sum <file>
```

- Rehearse on a throwaway bare clone of the backup: `git clone --no-local --bare <backup> <scratch>/sim.git`,
  `git -C sim.git fetch <file> refs/heads/<branch>:refs/heads/incoming`,
  `git -C sim.git merge-base --is-ancestor <branch> incoming` (that is what `--ff-only` decides).
- Write the handover note from `templates/bundle-note.md` beside the file (size, SHA-256,
  refs, range, prerequisite, apply commands, what changed, what is not carried, rebuild
  needs with measured suite totals, what to do first, unnumbered findings).
- While the previous bundle is unconfirmed, build the next one on the last **confirmed**
  marker so it subsumes the old one; rename the old file `*.SUPERSEDED.bundle` and put a
  banner at the top of its note. A second bundle the same day gets a suffixed tag
  (`sync/<side>-<date>b`). Delete superseded files only when the human says.
- A checkpoint tag that points at an already-shared commit still travels in a range bundle.

## Import (other side -> this side)

```bash
sha256sum <file>                                               # compare with the note
git bundle verify <file>
git fetch <file> refs/heads/<otherBranch>:refs/remotes/<other>-bundle/<otherBranch> refs/tags/sync/<other>-<date>:refs/tags/sync/<other>-<date>
git merge-base --is-ancestor <branch> <other>-bundle/<otherBranch> && echo ff   # else: git merge-tree --write-tree <branch> <other>-bundle/<otherBranch>
git merge --ff-only <other>-bundle/<otherBranch>              # or a normal merge as this side's identity when this side has new commits
git update-ref -d refs/remotes/<other>-bundle/<otherBranch>
git tag -l                                                     # remove tags you did not mean to import (fetch auto-follows tags)
```

If this side created a merge commit: tag `sync/<thisSide>-<date>` and export a bundle so
the other side fast-forwards. If the merge would delete many files, check whether the other
side untracked them on purpose (`git log -S`, commit messages) or merely ignored them; keep
this side's copies in the latter case.

## Backup clones (optional, recommended)

- `<readOnly>/other-repo/` = the record of where the other machine actually is; touched only
  when the human asks for a refresh from that side.
- `<readOnly>/other-repo-backup/` = fast-forwarded on every exchange and conflict-checked;
  the disaster-recovery copy. Refresh only with `fetch <bundle>` + `merge --ff-only`, never a
  re-copy, never a merge commit. Replay bundles in order (an incoming bundle whose
  prerequisite is this side's commit fails on a backup that lags).
- Their `origin` points at the other machine's path and never resolves here; `git fetch
  origin` there always fails; use bundles.

## Gotchas

- `git fetch <bundle>` auto-follows tags; a stray `sync/*` tag silently becomes the wrong
  marker for the next range.
- A "complete history" bundle is the whole repository (tens of MB when history holds
  deleted trees); a true range is kilobytes. Only a coordinated history purge shrinks the
  former.
- Branch names may differ between the sides (`main` vs `master`); the receiver fetches
  into a temporary ref and merges that, so the difference does not matter.
- Local-only data never travels: packages, hand-provisioned drops, `.claude/`, local `.pri`,
  bundle folders; check `git ls-files -ci --exclude-standard` before a bundle for tracked
  files that match ignore rules (a fast-forward overwrites an ignored local file silently).
