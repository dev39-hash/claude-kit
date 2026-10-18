---
name: no-delete-outside-root
description: Never delete any file or folder outside C:\DGB\Project\NichirinLaserMark unless the owner explicitly asks for that specific deletion — includes temp files and the user-level memory folder
metadata:
  node_type: memory
  type: feedback
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-07T02:36:27.012Z
---

Outside the project root `C:\DGB\Project\NichirinLaserMark`, never delete, move
away, or purge any file or folder on my own initiative — only when the owner
explicitly asked for that specific deletion in the current conversation. Applies
to every mechanism (Remove-Item, del/rm, `[IO.File]::Delete`, robocopy /MIR or
/PURGE, scripts) and to files I created myself (temp scripts, scratchpad output):
leave them and list them for the owner.

**Why:** owner rule (2026-10-07). Written as a local rule too:
`.claude/rules/no-delete-outside-root.md`.

**How to apply:** if something outside the root should go, name the exact paths
and wait for a yes. The user-level memory folder is outside the root, so deleting
a memory there also needs a yes — until then mark the memory obsolete in its
content instead, and keep `.claude/memory` identical ([[memory-backup-sync]]).
