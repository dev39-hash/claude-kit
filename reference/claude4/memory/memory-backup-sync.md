---
name: memory-backup-sync
description: "Every memory change must also be applied to the backup copy in the repo's .claude/memory — the two folders must always be identical"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-07T02:36:29.083Z
---

The owner keeps a backup of this memory folder at
`C:\DGB\Project\NichirinLaserMark\.claude\memory` (local-only: `.claude/` is
gitignored). The two folders must stay identical at all times — every file, same
bytes, including `MEMORY.md`.

**Why:** owner request (2026-10-07) — a second copy beside the project so memory
survives a reset of the user-level Claude folder.

**How to apply:**
- Write/Edit in either folder is mirrored automatically by the PostToolUse hook
  `.claude/hooks/sync-memory.ps1` (registered in `.claude/settings.json`; active
  from the first session started after 2026-10-07). In the session that set it up,
  mirror by hand.
- **Deletes and renames are NOT covered by the hook** — apply them to both
  folders yourself. The user-level folder is outside the project root, so a
  delete there needs the owner's explicit yes first ([[no-delete-outside-root]]);
  until then mark the memory obsolete in its content, in both copies.
- When in doubt, compare the folders (file list + SHA-256) and fix any drift
  before ending the task.
- Never reference this backup (or anything under `.claude/`) from tracked repo
  files — see [[ecc-local-harness]].
