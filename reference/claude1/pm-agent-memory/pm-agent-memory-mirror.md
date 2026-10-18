---
name: pm-agent-memory-mirror
description: "Every change to this agent's memory is mirrored into the repo folder .claude/pm-agent-memory/ (gitignored) as a standby copy - automatically by the sync-memory Stop hook since 2026-10-14."
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-14T11:49:55.128Z
  originSessionId: a937e601-4db2-40dd-9714-a8499c96b4ab
---

User rule, 2026-09-21: keep a standby copy of this agent's memory inside the repo at
`.claude/pm-agent-memory/`, identical to
`%USERPROFILE%\.claude\projects\c--DGB-Project-computer-vision-app\memory\` (including `MEMORY.md`).

Since 2026-10-14 the `sync-memory.js` Stop hook (`.claude/settings.json`) does it after every turn:
it copies changed `*.md` files and removes mirror files the memory no longer has. The mirror's own
`README.md` is never touched. By hand: `node .claude/hooks/sync-memory.js`; on a new profile,
`node .claude/hooks/sync-memory.js --restore` copies the mirror back.

**Why:** the real memory lives in the user profile, outside the repository, so it is invisible to git
and to every backup the project has. The same class of loss already cost this project once —
`runtime_app/` vanished while untracked and git could not help ([[phase-6-work-is-untracked]]).

**How to apply:** edit only the real memory files; `guard-edit.js` blocks edits to the mirror. If the
hook reports an error, or the turn ends without a Stop event, run the hook command by hand. Note the
limit: `.claude/` is gitignored, so the mirror survives a lost user profile but **not** a lost working
tree. The deploy agent keeps its own memory; the snapshot of it lives at
`reference_source/deploy-agent-memory/c--DGB-Project-ncr-picking/memory/` (dated 2026-09-18) — see
[[shared-working-conventions-with-deploy]].
