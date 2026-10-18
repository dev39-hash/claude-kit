# Brief M3: correlation matching mode (tasks 3.0-3.3; 3.4/3.5 follow)

Shared spec for the tester (RED) and the implementer (GREEN). Not tracked in git.
Rules: `.claude/rules/project.md` (ALL sections: naming, mutation policy, Performance goals =
zero operator-new in steady state, Angle convention = positive clockwise on screen, ASCII,
vocabulary gate, public headers OpenCV + STL only). Design of record: ADR-0004 and its
amendments (`.claude/docs/adr/0004-matching-modes-as-strategies.md`): the strategy rotates the
SOURCE region (as the edge mode does), score = clamp(max(0, ncc), 0, 1), SqdiffNormed inverted
as 1 - s, NaN/Inf sanitized to 0, per-layer score slack x0.7, NORMED methods only.
User decision 2026-10-14: `MatchedObject` stays without a pattern name (index only).

## Reuse first (the edge pipeline is the template)

The edge mode already solves the rotation-search geometry, and the regression suite proves it
bit-exact against the reference. The correlation strategy reuses, unchanged:
`geom::bestRotationSize`, the coarse rotation recipe (getRotationMatrix2D_ about the top-layer
center + fTx/fTy shift + warpAffine into a ScratchImage header), `edge::rotatedRoi` (fine-stage
rotated ROI with the 3 px pad), the back-rotation of the best position (ptLT / ptPad / pt with
`geom::rotatePoint`), `BlockMax` + `match::nextMaxLoc`, `match::filterByScore`,
`match::filterOverlap`, `match::refineSubPixel`, `EdgeLearner::computeTopLayer` (area rule),
the footprint extraction of the edge learner (threshold + RETR_TREE + largest contour below 98%).

Where a helper is edge-specific only by location, MOVE it to a shared internal header instead
of copying it: e.g. `src/match/rotation_search.{h,cpp}` (namespace `mtc::match`) for
`layerAngleStep`, `coarseAngles`, `rotatedRoi`, the coarse warp setup and the back-rotation of
a refined position; `src/match/pattern_footprint.{h,cpp}` for the footprint extraction. Keep
thin forwarding declarations in the old headers only if needed to avoid touching many call
sites. Hard requirement: every existing test, including the 22 passing golden cases, stays
bit-identical (the move is behaviour-neutral).

## Files

| File | Content |
|---|---|
| `src/corr/corr_pattern.h/.cpp` | `CorrLayer { cv::Mat image; cv::Mat mask; }`, `CorrLearnedPattern final : LearnedPattern` (layers finest first, borderColor, footprint, expectedArea; private copy ctor used by clone(), as EdgeLearnedPattern) |
| `src/corr/corr_learner.h/.cpp` | `CorrLearner::learn(gray, const CorrelationMatchConfig&, const ForegroundConfig&, ManagerResult&)` |
| `src/corr/corr_workspace.h` | `CorrWorkspace final : IWorkspace` + per-thread scratch |
| `src/corr/corr_search.h/.cpp` (+ `_coarse` / `_fine` split if > 400 lines) | stage functions, namespace `mtc::corr` |
| `src/corr/corr_strategy.h/.cpp` | `CorrStrategy final : IMatchStrategy` |
| `src/match/image_matcher*.cpp` | prepare() selects CorrStrategy for Correlation; region plan = whole crop |
| `include/mtc/correlation_match_config.h` | doc fixes only (see below); no new fields unless the tester's spike proves one is needed |
| tests | `tests/unit/opencv_match_template_assumptions_test.cpp` (3.0), `tests/unit/corr_learner_test.cpp`, `tests/unit/corr_search_test.cpp`, updates to `tests/unit/image_matcher_test.cpp` |

## 3.0 Spike (tester, pinned assumptions; no library code)

Results (2026-10-14, OpenCV 4.14): result size (W-w+1, H-h+1) CV_32F for all NORMED methods;
1.0 / 0.0 at the exact match; a flat SOURCE gives exactly 0 with CcoeffNormed (no NaN/Inf);
a flat TEMPLATE gives 1.0 everywhere (hence the flat-pattern guard); masks accepted by all three
methods; output Mat reused when pre-sized; rotate-source is about 3x faster than
rotate-template with a mask (Release 4.8-7.0 ms vs 15.7-21.7 ms, 648x486 vs 64x64). Decision
confirmed: rotate the source, mask optional.

`opencv_match_template_assumptions_test.cpp` pins on the build's OpenCV:
1. `cv::matchTemplate` result size (W-w+1, H-h+1), CV_32F, for the three NORMED methods.
2. `TM_CCOEFF_NORMED` on a constant window yields NaN or Inf or 0 (pin which), and
   `cv::patchNaNs(map, 0)` plus clamping removes it; pin the value for a constant template.
3. Masked `TM_CCORR_NORMED`, `TM_CCOEFF_NORMED` and `TM_SQDIFF_NORMED` with a CV_8UC1 mask are
   accepted (or which one throws) and give 1.0 / 0.0 at the exact match.
4. Calling matchTemplate twice with the same output Mat of the right size does not reallocate
   the output (`data` pointer stable).
Plus an informational (non-asserting) timing printed via RecordProperty: one 648x486 source vs
one 64x64 template, rotate-source (warpAffine + matchTemplate) vs rotate-template (warpAffine
of the template + matchTemplate with mask), median of 20, so the default decision (rotate the
source, no mask) is documented with a number.

## Learning (3.1)

`CorrLearner::learn`:
- Input CV_8UC1 non-empty, config valid (else ManagerResult failure, nullptr).
- Flat-pattern guard (spike finding: with a constant template every NORMED method returns
  exactly 1.0 at every position): compute `cv::meanStdDev` of level 0 (and of the top layer);
  if either standard deviation is below `kMinPatternStdDev = 2.0` gray levels, learning fails
  with "pattern has no contrast". Same guard for the masked case on the masked pixels.
- `topLayer = EdgeLearner::computeTopLayer(size, cfg.minReduceLength)` (shared area rule;
  document it on `minReduceLength`, whose doc still says "shorter side": fix the doc).
- `cv::buildPyramid(grayPattern.clone(), images, topLayer)` (clone: never alias the caller).
- borderColor = mean(level 0) < 128 ? 255 : 0 (same rule as edge).
- Footprint + expectedArea: the shared footprint extraction on level 0 with the
  ForegroundConfig (same as the edge learner), so the facade statistics and annotation work.
- Masks: when `cfg.useMask`, layer 0 mask = footprint; layer l mask = resize of the footprint
  to the layer size with INTER_NEAREST (0/255). When useMask is false the masks stay empty.
  If useMask is true but the footprint is empty (no contour selected), learning fails with a
  clear message ("useMask requires a foreground footprint").

## Search (3.2)

SearchParams as built by the facade: minScore, toleranceAngle, maxOverlap, maxPosNum,
subPixel, stopAtLayer1 (`CorrelationMatchConfig` has no stopAtLayer1: the facade passes
false), logger, stats. The strategy additionally needs coarse/fine angle steps and the method:
read them from the learned pattern (store a copy of the method/steps/useMask in
CorrLearnedPattern at learn time) so `search()` keeps the IMatchStrategy signature.

Stages (mirror of the edge stages; same allocation and OpenMP rules):
1. `prepareSearch`: buildPyramid of the region into the workspace (level 0 aliases the region:
   release it at the end, as EdgeStrategy does), coarse angle list, per-layer min scores
   (minScore * 0.7^l), per-thread scratch sized ONCE from deterministic maxima (largest
   rotated size over all coarse angles, largest fine ROI, largest score map), BlockMax
   reserve, candidate slots reserved for angles x (maxPosNum + 4).
2. Coarse angles: `step = max(cfg.coarseAngleStep, layerAngleStep(top template size))` so the
   coarse step is never finer than the edge-mode step for that template;
   `coarseAngles(toleranceAngle, step, ...)` (same list rule: {0} when tolerance < 1e-7).
3. Coarse search (OpenMP over angles, per-thread scratch, per-angle slots merged in index
   order, std::sort with a total order): rotate the top source layer exactly like the edge
   coarse stage (borderColor fill), `cv::matchTemplate(rotated, tmplTop, score, method,
   maskTop)` into a scratch header, sanitize (patchNaNs to 0; SqdiffNormed: s = 1 - s; then
   clamp to [0, 1]), peaks with the edge rule (calMaxByBlock when area ratio > 500 and
   maxPosNum > 10; maxPosNum + 5 - 1 next-max iterations with suppression), skip below the
   top-layer min score; candidate point = peak - (fTx, fTy) as in the edge stage.
4. Fine search per candidate (OpenMP over candidates, per-index slots): descend layer by
   layer like the edge refine (ptLT rotation, rotatedRoi at ptLT * 2 with the layer template
   size, back-rotation), but with an angle window instead of 3 angles: at layer l the
   window is +/- the previous step, the step is `s_l = max(cfg.fineAngleStep, s_prev / 2)`,
   angles = a + k * s_l for k in [-n, n], n = ceil(s_prev / s_l - 1e-9) (5 angles when
   halving). At layer 0, while s > fineAngleStep, repeat the layer-0 pass with the halved
   step (bounded: at most ceil(log2(coarse / fine)) passes). Best angle = strict argmax (first
   wins). Drop the candidate when the best score < the layer min score.
   Sub-pixel (p.subPixel, final layer-0 pass, best angle not at either end of the window,
   peak not on the score-map border): sample the 3x3 neighbourhood at the best angle and at
   best +/- one step (each at its own argmax, transposed per `src/match/subpixel.h`), run
   `refineSubPixel` with angleStep = final step, apply only when ok.
5. Finalize: same as the edge finalize (filterByScore with p.minScore, rect from the
   stop-layer template size with the edge formula, filterOverlap with p.maxOverlap, std::sort
   total order, Candidate center/rect/angle from the layer-0 template size; append to out).
6. Guards (return false, no throw): non-CV_8UC1 region, pattern type != Correlation (dynamic
   cast), foreign workspace, pattern larger than the region (edge rule), invalid params
   (toleranceAngle outside [0, 180], maxPosNum < 0, minScore outside [0, 1], maxOverlap
   outside [0, 1)), worker failure (one logger line).

Allocation budget: zero operator-new calls from library code from the second search on
(same region size and pattern); OpenCV-internal allocations (matchTemplate DFT buffers,
warpAffine) tolerated and reported.

## Facade (3.3)

- `ImageMatcher::prepare()`: MatchingType::Correlation -> CorrStrategy + CorrWorkspace;
  ClearanceCondition (requiresForeground) on a correlation group still fails ->
  `UnsupportedCondition`.
- `match()` in correlation mode: no foreground extraction (foregroundMs 0, foregroundArea 0),
  one region = the whole crop with every pattern (`planFullRegion`), MatchContext.foreground
  = nullptr and patternFootprint = nullptr; everything else (overlap pass, conditions, sort,
  annotation, image-frame translation) unchanged. largestPatternArea = max expectedArea.
- Docs: `docs/modes.md` correlation section becomes real (method, useMask, angle steps,
  score meaning, when to choose it); `docs/getting-started.md` unchanged unless wrong;
  CHANGELOG entry under Added; remove "planned" wording for correlation.

## Tests (tester writes RED first; synthetic only, no fixtures)

Scene recipe: reuse the edge_search_test helpers style (64x64 asymmetric dark shape on a light
background, instances placed with getRotationMatrix2D(center, -angle, 1) so the matcher must
report +angle). Correlation is not rotation-invariant per se: the angle sweep provides it.

`corr_learner_test.cpp`: layer count via the area rule (128x128, minReduceLength 32 -> 3
levels); layer sizes as buildPyramid; borderColor rule; useMask=false -> empty masks;
useMask=true -> mask per layer, 0/255, layer 0 equals the footprint; useMask with no footprint
fails; rejects empty / non-CV_8UC1 / invalid config; does not alias the caller's image;
clone() is deep; expectedArea equals the footprint area.

`corr_search_test.cpp`:
1. FindsSingleInstanceAtEightAngles (0, 30, -30, 45, 90, -135, 135, 180) for each method
   (CcoeffNormed, CcorrNormed, SqdiffNormed): center within 1.5 px, wrapped angle within
   fineAngleStep + 0.5 deg, score > 0.8 (CcoeffNormed), rect size 64x64.
2. NoiseRobustness: the 8 angles at three Gaussian noise levels (sigma 0, 8, 16 on 0..255):
   all found with the CcoeffNormed defaults; record scores.
3. FindsThreeInstancesSortedByScore; OverlapFilterKeepsHigherScore (two instances 10 px apart).
4. ToleranceAngleZeroSearchesSingleAngle; a 20 deg instance not found at tolerance 0 with
   minScore 0.9.
5. SubPixelRefinesCentre (subPixel on, centred instance, error <= 1.0 px, subPixel flag set).
6. UseMaskIgnoresBackground: with useMask, a pattern whose background differs from the
   scene background is still found with a higher score than without the mask.
7. FlatRegionGivesNoCandidateAndNoNaN (constant scene): search true, out empty.
8. Guards: non-gray region, edge-learned pattern passed to CorrStrategy, foreign workspace,
   pattern larger than region, invalid params -> false, nothing appended; appends to out.
9. ThreadCountDoesNotChangeResults (MTC_USE_OPENMP: 1 vs 4 threads bit-exact; restore the
   thread count).
10. SteadyStateSearchDoesNotAllocate (global operator new counter in this test exe, Release
    0 on runs 2 and 3; MSVC iterator-debug allowance constant as in the other tests).
11. CoarseStepNeverFinerThanEdgeStep (expose the step computation as a function in
    corr_search.h, e.g. `coarseStep(cfg, topSize)`, and test it).

`image_matcher_test.cpp` (updates): ReturnsNotReadyForCorrelationWithoutStrategy becomes
`CorrelationGroupFindsInstancesEndToEnd` (three instances, correlation group, objects in the
image frame, foregroundArea 0, okCount 3); the UnsupportedCondition test stays;
`CorrelationIgnoresForegroundOptions` (foreground config changes do not change correlation
results); keep the file under 850 lines (move shared scene helpers into
`tests/test_support/synthetic_scene.h` and use them from both edge and correlation tests if
that keeps files small; the support dir is already an include dir).

## Acceptance

Whole tree green in static Debug/Release and shared Debug, 0 warnings; the 22 golden cases
still bit-identical; gates empty; steady-state counts and per-search time (Release,
320x320 scene, default config) in the implementer report; Opus review Approve/Warning.
Commit: `feat(corr): add correlation matching mode` (+ a separate refactor commit for the
helper move if it is large).
