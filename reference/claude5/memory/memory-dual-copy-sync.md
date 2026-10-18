---
name: memory-dual-copy-sync
description: Project memory is kept in two copies (Claude memory dir + project .claude/memory) and every change must be synced to both
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1c0df7ef-a9b5-4ce3-8147-5a3bd661ce36
  modified: 2026-09-25T14:06:20.072Z
---

Keep this project's memory in two places with identical content:

1. Claude's own memory dir: `C:\Users\dgb07\.claude\projects\c--DGB-Project-mc-protocol\memory\`
2. A copy inside the project: `C:\DGB\Project\mc_protocol\.claude\memory\` (the user wrote "/claude/memory"; `.claude/memory` is the folder that exists for it)

Every create, update or delete of a memory file, including `MEMORY.md`, is applied to both copies in the same turn.

**Why:** The user asked for it on 2026-09-25 so the project carries its own memory (visible and versionable with the project), not only Claude's private store.

**How to apply:** After writing or editing a memory file in (1), copy it to (2) and confirm both match. If the two copies ever differ, ask the user which one wins before syncing. Related: [[ask-before-reading-outside-project]].
