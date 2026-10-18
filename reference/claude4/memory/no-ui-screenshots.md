---
name: no-ui-screenshots
description: User checks UI themselves; do not produce screenshots to verify UI
metadata:
  type: feedback
---

Do NOT take screenshots (PrintWindow / offscreen grab harnesses) to verify UI changes. The user checks the UI themselves.

**Why:** Stated 2026-07-09. Screenshot harnesses cost build time/disk and the user reviews UI directly (they edit .ui in Designer).

**How to apply:** After a UI change, rely on build-green + the user's own review. Report what changed and let them verify visually. Still verify non-UI behavior with builds/tests. Related: [[working-arrangement]].
