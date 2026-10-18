---
name: feedback-preview-versions
description: After every library change that can alter matcher output, save a preview version (annotated images + per-version README) under build-preview/ for the user to inspect
metadata:
  type: feedback
---

User request 2026-10-14: whenever the library changes, keep the preview images in a
`build-preview/` folder at the project root, with a README per preview version so the user can
compare versions easily.

**Why:** the user reviews matcher behaviour visually (they caught the wrong fitting goldens from
previews) and wants a history of how results evolve across changes.

**How to apply:** after each commit touching `src/`/`include/` behaviour or goldens, build the
Release regression exe and run `node .claude/tools/preview.js <label>`; never delete old
versions (user prunes). Rule text lives in `.claude/rules/project.md` "Preview versions".
See [[feedback-repo-conventions]].
