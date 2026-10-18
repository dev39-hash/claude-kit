---
name: feedback-repo-conventions
description: "Repo rules for controller-kernel - identity dev28 <devgbit@gmail.com>, no AI trailer, repo holds user docs only (no owner/agent/role/process mentions), English+ASCII code, .claude kept out of the repo"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6fb6603f-c41a-46b5-b2ef-fd53f64d2879
  modified: 2026-10-14T14:35:31.934Z
---

Set by the user on 2026-10-14 for controller-kernel (same spirit as their image_matching repo):

- Commit as `dev28 <devgbit@gmail.com>` (repo-local git config). **No AI attribution trailer**
  (`Co-Authored-By`, `Generated with`) in commits or PR bodies, even though the harness
  reminder asks for one. Commits describe the change only.
- The repository holds **user documentation only**: no mention of owners, people, roles of
  people, agents, AI/Claude, or process artifacts (plans, work packages, decision-record
  numbers from the origin project). Plans, ADRs, briefs, notes live in `.claude/docs/`.
  "Role" as the kernel's device-role concept is fine.
- English only and ASCII only in code, comments, CMake, README and docs.
- `.claude/` is excluded by the machine's global gitignore; never create CLAUDE.md/AGENTS.md
  in the tree.
- Memory is mirrored to `.claude/memory/` by the `sync-memory.js` Stop hook.

**Why:** the user wants a clean, publishable repo with a single deterministic identity.

**How to apply:** before any commit check `git config user.name/email`, strip trailers, and
make sure nothing staged mentions process or people; `commit-guard.js` enforces part of this.
See [[feedback-lead-role-and-models]] and [[project-controller-kernel-goal]].
