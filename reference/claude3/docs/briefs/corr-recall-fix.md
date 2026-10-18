# Brief: correlation recall review fixes (Opus verdict Warning)

Not tracked. Base: `.claude/docs/briefs/corr-recall-impl.md`, ADR-0004 Amendment 4. Rules:
`.claude/rules/project.md` (ALL sections; footprint and zero steady-state allocation are top
priority). The M4 change sits in the git index: never run `git add`/`git commit`/`git stash`/
`git checkout`; do not touch src/model, the M4 headers, docs/persistence.md or the model tests.

## Implementer

- M1 (footprint): today `ws.coarse`, `fineSlots`, `results` reserve `angles * cap` MatchParams
  (about 216 B each): 131 MB at 361 angles x 512 cap, 27 MB at 75 angles, vs 23 / 5 MB before.
  (a) drop `ws.coarse`: refinement reads point/score/angle from the kept `CorrPeak` records
  (+ `ws.angles`); (b) `fineSlots` become a compact record (origin Point2d, score, angle,
  needed flags; about 40 B); only `results` holds MatchParams. (c) bound `results`, `order`,
  `deleted` by the number of peaks that survive cluster pruning if you can derive a bound
  (e.g. reserve from `angles * cap` is only needed for the compact peak arrays); if no static
  bound exists, reserve a modest size and let the first dense search grow them (capacity is
  kept: steady state stays allocation-free; the dense allocation tests check calls 2 and 3).
  Report the reserved bytes for 75 and 361 angles before/after (compute from sizeof).
- M3: one shared comparator `coarseKeyBefore(...)` (or equivalent) in
  `src/match/search_common.h`, used by `match::coarseBefore` and the correlation peak sort.
- L1-L3: fix the stale docs in corr_search.h (`refineAll` order, `finalizeCandidates`
  precondition + debug `assert(std::is_sorted(...))`) and corr_workspace.h (`results`,
  `coarse`/its replacement, `CorrPeak::x` wording "rotated top-layer frame with the warp
  translation removed").
- L4: `reduceClusters` computes the centre via `match::coarseToLayerPoint` (float sum first so
  results stay bit-identical; check the src10 golden and the 20 other goldens still pass).
- L5: drop the unneeded `#include <opencv2/imgproc.hpp>` from search_common.h (add it where
  really needed).
- L6: compute `coarsePeakCap` once, store it in the workspace (`ws.peakCap`), use it in both
  places.
- L8: CHANGELOG "Changed" entry: no fixture name; e.g. "on a dense scene of about 160 parts
  detections go from 117 to 161".
- Bench: Release `mtc_bench` correlation suite (3 repeats) before (HEAD build in a scratch
  export `git archive HEAD`, or the numbers from the reviewer: HEAD 11851 ms sum) and after;
  report per-case search ms and new_calls. Also run the edge suite once to confirm no change.

## Tester

- M2: in tests/unit/corr_cluster_test.cpp add a test that derives the peak positions from
  `match::planRotation(srcTop, tmplTop, a)`: forward-map the true template centre through the
  plan's warp matrix, subtract half the template and (fTx, fTy) exactly as the coarse stage
  does, and assert `reduceClusters` groups peaks of one instance found at a = 37, 133 and
  -101 deg (and separates two instances one radius + 1 apart). Read src/match and src/corr
  to mirror the real warp, not the implementation's inverse.
- Dense scene: add one non-right-angle instance class (e.g. 30 deg and -120 deg) to
  tests/unit/corr_dense_scene_test.cpp if it keeps the test deterministic; tighten the angle
  tolerance to 1.0 deg or justify 2.0 in a comment with measured numbers; rename/comment
  `RaisedMaxPosNumDoesNotChangeTheResultCount` as a property test (it passes on HEAD); the
  allocation comment must say "operator new in library code" (cv::fastMalloc is not counted).
- L9: `ClusterCellCountIsPositiveAndBounded` asserts `<= kMaxClusterCells` exactly.
- The implementer changes internal signatures in parallel (CorrPeak flows into refinement,
  coarse list removed): adapt your tests to the final names; wait until src/corr stops
  changing for 3 minutes before the final `--clean-first` run.

## Common

BUILD: slots (tags recall-fix-impl, recall-fix-test), every option explicit with
`-S C:/DGB/Project/image_matching`:
`-G "Visual Studio 18 2026" -A x64 -DOpenCV_DIR="$BINPICK_OPENCV_DIR" -DMTC_WARNINGS_AS_ERRORS=ON -DBUILD_SHARED_LIBS=OFF -DMTC_BUILD_TESTS=ON -DMTC_BUILD_REFERENCE_HARNESS=OFF`;
`cmake --build <slot> --config <cfg> --parallel 8`; final build `--clean-first`. If a slot's
CMakeCache points at another source, delete that slot's CMakeCache.txt and reconfigure.
Acceptance: Release full ctest green incl. mtc_regression (edge suites bit-exact, the 20
correlation goldens unchanged, src10 golden unchanged unless L4 moves it: then report and STOP
before regenerating). Do not kill processes you did not start. Release slots. SUB-AGENTS:
workers "sonnet", reviews "opus". Do not commit.
