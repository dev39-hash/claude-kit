# Spike: correlation recall on dense scenes (measure, prototype, recommend)

Not tracked. Measurement and prototype only; nothing in the main working tree changes.
Rules: `.claude/rules/project.md` (performance goals: zero steady-state allocation, speed;
angle convention), ADR-0004 Amendment 3 in `.claude/docs/adr/` (correlation design, and why plain
cross-angle suppression was REJECTED: keeping only the best coarse candidate of a cluster starts
the +/-1 step refinement from the wrong angle and moves the centre 1.4-1.8 px).

## Problem

`src/corr/corr_search_coarse.cpp` collects at most `maxPosNum + kCandidateSlack` peaks per angle
over the WHOLE crop (`match::collectPeaks`), while the edge mode applies that cap per contour
region. On `Src10.bmp` with pattern `Dst10.jpg` (54x54 ring, tolerance 180, coarse 5, fine 0.5,
minScore 0.7, maxOverlap 0.2, maxPosNum 70, CcoeffNormed, no mask) the edge mode finds 324
objects (`tests/golden/src10_dst10.json`), correlation 117
(`tests/golden/library/correlation/corr_src10_dst10.json`): every angle picks the same top rings,
clusters of touching rings are missed.

## Work location

The main tree has uncommitted M4 edits in progress by other agents. Work in a detached git
worktree of HEAD in the scratchpad:
`git worktree add --detach "C:/Users/dgb07/AppData/Local/Temp/claude/c--DGB-Project-image-matching/da23465f-c88f-4d7e-b0d2-5fd7fcb59ee2/scratchpad/wt-recall" HEAD`
and build it in its own build dir inside that worktree (Release, static,
`-DMTC_TEST_DATA_DIR=C:/DGB/Project/image_matching/reference_source/Test Images`, all options
explicit as in project.md). Do not edit the main tree. At the end `git worktree remove --force`
that worktree (it is your own temp) and report the prototype diff as a patch file saved in the
scratchpad (`corr-recall-spike.patch`).

## Measure (Release, OpenMP on, report wall time median of 3)

1. Baseline: src10 count, time; recall vs the edge golden (an edge object is recalled when a
   correlation object's anchor is within 3 px and angle within 5 deg modulo the ring symmetry:
   for src10 compare position only).
2. maxPosNum 150, 300, 400 (no code change): count, recall, time.
3. Prototypes (each behind a local switch, all 21 correlation library goldens must still pass at
   their tight tolerance 0.25 px / 0.1 deg / 0.005 with EXACT counts, except src10 whose count
   may only grow and whose existing 117 objects must still be matched):
   - (T) tiles: the coarse peak cap applies per tile of the top-layer score map (tile size a few
     template sizes, e.g. 4x template), so dense scenes get maxPosNum+slack per tile.
   - (C) cluster-best-few: collect per angle more peaks (bounded by a physical packing bound
     regionArea / (templateArea * (1 - maxOverlap)) at the top layer, capped by a constant), then
     cluster across angles by top-layer position (radius ~ 0.25 * min template side), keep the
     best K (2-3) per cluster and refine them with a +/-2 coarse-step window; check pose accuracy
     on the src5 rot cases (the case that broke the rejected suppression).
   - any better idea you find, documented.
   For each: src10 count/recall/time, total time of the correlation suite, max pose deviation on
   the 21 goldens, steady-state allocations (the existing allocation test pattern in
   `tests/unit/*alloc*` or the bench `--alloc` option if present).

## Report

Table of measurements, recommendation with reasoning (recall, accuracy, speed, allocation,
semantics of maxPosNum as documented in `include/mtc/correlation_match_config.h` /
`docs/`), the patch path, and what an implementation brief must contain (files, constants,
tests). SUB-AGENTS: workers model "sonnet"; reviews model "opus". Do not commit.
