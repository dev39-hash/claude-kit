---
name: worktree-slots
description: Git worktree slots for parallel work packages - create detached worktrees under the slots dir, share vendored trees by junction and hand-provisioned drops by copy, prepare and register a slot, build in parallel but test serially, and remove a slot safely (junctions first, never a recursive delete). Use when two or more WPs run at once or when a slot must be created, repaired or retired.
argument-hint: <prepare | release | status> [slotN]
---

# Worktree slots (pack work-package)

Config: `build.worktrees` (`dir` default `.wt`, `count`, `prepareCommand`). The slots dir is
ignored through `.git/info/exclude` (local only). A slot register lives in `<dir>/README.md`:
which WP holds which slot, at which base commit, with which junctions.

## Create a slot

```bash
git worktree add --detach <dir>/slotN <base sha>      # detached; the WP branch is created inside
```

Then prepare it (`prepareCommand` when the project has one, e.g. `prepare_slot.ps1 slotN`):

- **Vendored package trees** (third-party libraries that git does not track) are shared by
  **directory junction** into the main tree (`cmd /c mklink /J <slot>\3rdparty\x <main>\3rdparty\x`),
  so each slot sees the same packages without a copy.
- **Hand-provisioned drops** (components replaced as a whole from a release) are **copied**,
  never junctioned: a checkout in the slot could otherwise write through the link into the
  main tree.
- Local-only files the build reads (the local `.pri`, machine config) are copied in.
- Record the slot in the register: WP, base, branch, junction list, date.

## Work in a slot

- The implementer creates its WP branch inside the slot from the named base and commits
  there only; the main tree's HEAD is the leader's.
- qmake projects: pass `QMAKE_PROJECT_DEPTH=0` as a qmake **argument** and set the project
  root variable to the slot; check that no generated `Makefile*` names the main tree.
  CMake projects: a separate build dir per slot (`cmake-build` skill slots) or the worktree's
  own `build/`.
- Builds in different slots may run in parallel; **test suites never** (shared ports, timing
  tests, one process list). Release builds only when disk is a concern (each slot can hold a
  full build tree).
- A `git checkout` of an old commit that tracks a hand-provisioned drop overwrites the copy;
  re-provision afterwards.

## Remove a slot (the dangerous step)

A recursive delete inside a slot that holds junctions **empties the main tree's packages**
through the links. The `wt-guard` hook denies `rm -rf`, `Remove-Item -Recurse` and
`rd /s` under the slots dir. The safe order:

```bash
cmd /c rmdir <slot>\3rdparty\x        # each junction, no /s: removes the link only
...
git worktree remove <dir>/slotN       # refuses while the tree is dirty; --force asks the human
git worktree prune
```

Then delete the register line and release the branch (merged WP branches are deleted with
`git branch -d` after the merge; never `-D` without the human).

## Status

`git worktree list` plus the register. A slot whose WP merged more than a day ago and that
holds no uncommitted work is retired; a dirty slot is reported, never cleaned without the
human.
