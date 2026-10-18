---
name: project-image-matching-library-goal
description: "Goal of the image_matching repo - port the mtc:: matching module from a Qt robot-picking app into a standalone pure OpenCV C++ library; where the Claude config, ADRs and status live"
metadata:
  node_type: memory
  type: project
  originSessionId: da23465f-c88f-4d7e-b0d2-5fd7fcb59ee2
  modified: 2026-10-13T10:32:11.037Z
---

Project started 2026-10-13. Goal: build a reusable image-matching component library in pure
OpenCV C++ (no Qt) for computer-vision projects. `reference_source/matching/` is a verbatim
extract of the `src/matching` module from a real, shipped Qt/qmake robot-picking application
(the `ncr_shared` static lib); its module doc is `reference_source/matching/README.md`.
`reference_source/Test Images/` holds the original Src/Dst test pairs plus `M12` and
`sample_1` sets.

**Why:** the user wants the proven edge-based matcher (SIMD AVX2 + OpenMP, pyramid,
sub-pixel) reusable outside that app. Only `pattern_group_manager.*` depends on Qt and the
host `core/` logger/settings; everything else is already OpenCV + STL.

**How to apply:** treat reference_source as read-only (a PreToolUse hook blocks edits). New
code goes in `src/` and `include/mtc/`, drops Qt, replaces `core/` logger/settings with
injectable interfaces, keeps `IRobotPickingChecker` as a port, builds with CMake + GoogleTest.
Claude's project instructions are in `.claude/CLAUDE.md` (not the repo root); project rules in
`.claude/rules/project.md`; ADRs 0001 (port strategy) and 0002 (keep reference naming) in
`.claude/docs/adr/`, both `proposed`. See [[feedback-repo-conventions]] and
[[user-language-vietnamese]].
