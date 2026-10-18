# M2 notes (edge pipeline port), 2026-10-13

## Reference outputs deliberately not ported (learning step)

- `MatchPattern::m_maskPatternPoint` (simplified contour polylines kept for drawing) and
  `getMaskImage()` (raw threshold image): no consumer in the library; annotation draws
  the rotated rect and anchor instead.
- Selected-contour `minAreaRect` area (`maxModelRectArea`): computed by the reference but
  never used by the search, so the facade pre-filter needs only `expectedArea()`.

## Deviations recorded

- Canny aperture clamped to >= 3 (reference would throw for kernelSize 1).
- Footprint extraction does not reuse `ForegroundExtractor` (which paints a 2 px border):
  direct port of the reference threshold + RETR_TREE selection.
- Sub-pixel fit (`match::refineSubPixel`) has a validity gate (singular system, |dx|,|dy| > 1,
  |dAngle| > step) the reference did not have; when the gate fails the integer pose is kept.
- Coarse/fine candidate sorting uses `std::stable_sort` (reference `std::sort`).

## Backlog for 2.7 (regression)

- Extend the reference harness to dump, per fixture, the learning-step data (per-layer point
  counts, first N points, selected area, borderColor) for Src1 and Src5, and add an exact
  parity test with GTEST_SKIP when the fixture is missing (review wave A, HIGH 3 part b).
- Existing backlog: ForegroundConfig::validate rejects binaryMaxValue == 0; MinDistance /
  MaxCount scratch in a workspace; golden dir via MTC_GOLDEN_DIR; aligned_buffer.h padding
  doc; pointer compare via std::less.

## Golden quirks to handle in 2.7

- fitting_template4_image1 (minScore 0.85): the reference reports the fitting at (829,680)
  twice (angles 25.8 / 24.4, scores 0.998 / 0.874) because two nested contours produced two
  candidate regions and the reference never deduplicated across regions. The library's global
  overlap pass (plan section 4) removes such duplicates on purpose: the regression comparison
  must match every library object to a golden match, and tolerate golden near-duplicates
  (same center within 2 px and wrapped angle within 2 deg) that the library reports once.
- The fitting cases use minScore 0.85 (user decision 2026-10-13 after reviewing previews).

## Performance backlog (from the 2.4b/2.5 Opus review, 2026-10-13)

- Fused in-house 3x3 Sobel + magnitude into the thread scratch (bit-exact with cv::Sobel /
  cv::magnitude: integer sums exact in float, mag^2 < 2^24, sqrt correctly rounded) would
  remove most of the ~21k OpenCV-internal allocations per 320x320 search (about 22 per
  Sobel call, two calls per scoreMap). Do it after 2.7 proves parity, with an equality test
  against cv::Sobel/cv::magnitude and numbers in the commit. warpAffine (~59 allocations per
  call) is the remaining OpenCV cost; a custom bilinear rotation is a later option.
- ClearanceCondition keeps a thread_local scratch (3 bbox-sized buffers per thread for the
  thread's lifetime). Option for later: pass a scratch through MatchContext (facade-owned)
  and keep thread_local as the fallback (ADR-0005 note).
- geometry.cpp rotatePoint computes dx in double where the reference ptRotatePt2f computed
  in.x - org.x in float: at most 1 float ulp, can flip warpAffine's 1/32 px quantization at
  exact boundaries. Remember if a 2.7 golden is off by one interpolation step.
- A rounded sub-2-px box can fail isContourConvex and go to fillPoly where the reference
  always used fillConvexPoly (edge case only).

## Regression result (2.7, 2026-10-14) and the src5 fixed-threshold decision

- 22 of 28 golden cases match the reference within 0.0002 px / 0.0000 deg / 0.00002 score, with
  0 clearance-state mismatches (fitting cases included; the (829,680) duplicate of
  fitting_template4 is merged by the library as planned).
- 6 cases fail honestly: src5_rot45/90/135/180/270 and src5_rot90_anchor_right (fixed
  binaryThreshold 80, invert 0). Root cause: the reference learned the pattern footprint with
  THRESH_BINARY (invert honoured) but always thresholded the SOURCE with THRESH_BINARY_INV
  (the bug the library fixed on purpose, plan 6b). The goldens therefore come from an
  inconsistent pipeline: a consistent library run (invert 0 for both) finds the objects via
  different candidate regions, about 3 px and 180 deg (2-fold symmetry) away from the
  recorded poses. An Otsu experiment (scratch only) reproduces only the two unrotated cases;
  the rotated scenes yield 0 matches with Otsu at either invert setting.
- Decision (lead, 2026-10-14): mark those 6 cases with "skipReason" in cases.json and skip
  them in the regression suite; keep the goldens untouched. Options for the user: regenerate
  library-side goldens for them after a visual check (freezes library behaviour instead of
  reference parity), or drop them.
- Bench (Release, medians): most 2592x1944 cases 6-75 ms; src3 267 ms (56 objects), src4 305 ms
  (171 objects), src10 602 ms (3648x3648, 324 objects); 0 operator-new calls in steady state
  for all but src4 (26) and src10 (133): see the 2.6 allocation hunt.

## M3 notes (correlation, 2026-10-14)

- Lead preview review of the correlation goldens: src1 (7), src2 (5), src3 (36), src4 (24 ring
  parts; the edge reference reported 171 there), src6 (17), src7 (3), fitting4 (5) are all
  correct. sample1_pattern2_image1 (minScore 0.5) gives only frame-border noise hits: skipped.
- Recall limit (backlog): correlation searches the whole crop as ONE region, so the coarse
  peak cap (maxPosNum + 4 per angle) applies to the whole image, while the edge mode applies it
  per contour region. On dense scenes of a rotationally symmetric part (src10: ~300 rings) every
  angle picks the same top rings, so only 117 are found (all correct, clusters of touching
  rings missed). Options: raise maxPosNum (cost grows linearly in refinements), split the crop
  into tiles for correlation, or refine the best few per spatial cluster with a wider window
  (needs a decision; the plain cross-angle suppression was rejected for accuracy).

## Backlog from the recall reviews (2026-10-14)

- Correlation angle precision: dense-scene errors cluster at multiples of 0.68 deg (third-pass
  step); an isolated 64 px part at 30 deg gives 1.02 deg, above `fineAngleStep + 0.5`. The final
  0.5 deg pass and the sub-pixel step may not improve the angle. Investigate (Opus re-review M-3).
- `useBlockMax` (area ratio > 500) and the new peak cap (> 75 from ratio ~48) no longer track
  each other: between those ratios each angle can walk up to 517 peaks with full minMaxLoc scans.
  Watch in the bench; a cap-based switch changes tie-breaking (goldens to recheck).
- Edge mode `match::filterByScore` (`std::stable_sort`, edge_search_fine.cpp:186) allocates a
  temporary buffer above ~32 survivors: dense edge scenes allocate on every search. Same index
  sort fix as correlation.
- Correlation sparse scenes refine 1000-2400 coarse candidates for 1-6 survivors: fine-stage
  early-out is a separate task.
