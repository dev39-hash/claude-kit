---
name: ask-before-reading-outside-project
description: "Must ask the user before reading any folder outside the mc_protocol project root, even read-only"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1c0df7ef-a9b5-4ce3-8147-5a3bd661ce36
  modified: 2026-09-25T14:06:16.174Z
---

Before reading any file or folder outside `C:\DGB\Project\mc_protocol` (e.g. `C:\DGB\Project\bin-picking\...`), ask the user first and wait for a yes. Read-only access is not an exception.

**Why:** On 2026-09-25 I searched the disk and read the old MC module from the bin-picking project on my own when `reference_source/device/plc/` was missing; the user wants to control which outside sources feed this project's docs. The user then restored `reference_source/device/plc/` inside this project.

**How to apply:** Prefer `reference_source/` and `docs/` inside the project. If something needed is missing there, say what is missing and where you think it is, and ask before opening it. Disk-wide searches that only list names are fine to propose, but opening/reading the files needs the user's consent. See [[memory-dual-copy-sync]].
