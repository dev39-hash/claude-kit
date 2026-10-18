# ADR-0004: Matching modes as strategies; correlation mode via cv::matchTemplate

**Date**: 2026-10-13
**Status**: accepted (with plan rev 3, 2026-10-13)
**Deciders**: project owner, lead

## Context

0.1.0 must offer two modes: the ported edge-based matcher and a new correlation matcher
built on `cv::matchTemplate`. The reference `ImageMatcher` hard-wires the edge algorithm
(`MatchEdge`) while the config model already anticipates more types (`MatchingType`,
`IMatchTypeConfig::createDefault`). Both modes need the same surrounding machinery: source
pre-processing, ROI handling, candidate filtering, sub-pixel refinement, sorting, collision
geometry, robot check, annotation.

## Decision

`ImageMatcher` becomes a facade that owns the shared pipeline and delegates the
pattern-specific steps to an `IMatchStrategy`:

```
class IMatchStrategy {
  virtual bool learn(MatchPattern&, const IMatchTypeConfig&) = 0;
  virtual bool search(const cv::Mat& src, const MatchPattern&, const SearchParams&,
                      std::vector<MatchParams>& out) = 0;
};
```

`EdgeStrategy` wraps the ported edge pipeline. `CorrStrategy` implements correlation as a
rotation sweep on the shared pyramid skeleton: at the top pyramid layer, run
`cv::matchTemplate` (method and optional mask from `CorrelationMatchConfig`, default
`TM_CCOEFF_NORMED`) for each angle in the tolerance range at the coarse step; pick peaks with
the existing block-max / next-max suppression; descend the pyramid refining position and
angle in a narrowed window; reuse the quadratic sub-pixel fit and the rotated-rect overlap
filter. The strategy is chosen from `MatchGroupConfig::matchingType()`.

## Alternatives Considered

### Alternative 1: Two separate matcher classes (`EdgeMatcher`, `CorrMatcher`)
- **Pros**: no virtual dispatch, simpler per class
- **Cons**: duplicated ROI/filter/sort/collision code; hosts must switch types
- **Why not**: the shared pipeline is most of the code

### Alternative 2: Correlation via feature matching (ORB/SIFT + homography)
- **Pros**: scale and perspective invariance
- **Cons**: unreliable on low-texture industrial parts; different result model
- **Why not**: out of scope for 0.1.0; may become a third strategy later

## Consequences

### Positive
- Adding a mode = one strategy + one config; the result model stays identical
- Both modes get collision/robot/ROI features for free

### Negative
- A small virtual-call boundary per candidate (negligible next to matchTemplate cost)
- Correlation rotation sweep is O(angles) matchTemplate calls at the top layer; must be
  bounded by coarse angle step and pyramid depth

### Risks
- Score scales differ between modes (NCC in [-1,1] vs edge score in [0,1]); `m_minScore`
  semantics are documented per mode and the correlation score is mapped to [0,1]

## Amendments (2026-10-13, after plan review)

- `IMatchStrategy::search` is `const` and stateless:
  `search(const cv::Mat& region, const MatchPattern&, const SearchParams&, std::vector<Candidate>&) const`.
  The facade owns the contour pre-filter (edge) or passes the whole region (correlation), and
  runs a global overlap pass across candidates for both modes.
- `SearchParams` = minScore, toleranceAngle, maxOverlap (reference matcher-level 0.2),
  maxPosNum (70), maxMatches, subPixel, stopAtLayer1, plus `MatchStats*` and `ILogger*`.
- Correlation rotates the source region (as the edge mode does with `GetBestRotationSize`)
  rather than the template, so no per-angle template masks are needed by default.
- Correlation score = clamp(max(0, ncc), 0, 1) (not `(ncc + 1) / 2`); NORMED methods only
  (`TM_SQDIFF_NORMED` inverted as `1 - s`); NaN/Inf on flat windows sanitized; lower pyramid
  layers get their own score slack as the edge mode does (x0.7 per layer).
- `MatchPattern::expectedArea()` is mode-neutral so the facade's candidate pre-filter works
  for both strategies.

## Amendment 2 (2026-10-13, after the M2 wave A review)

The implemented interface (src/match/match_strategy.h) differs from the sketch above:

```cpp
class IWorkspace { virtual ~IWorkspace(); };           // per-matcher scratch of one strategy
class LearnedPattern {                                  // algorithm-specific learned data
  type(); size(); topLayer(); expectedArea(); footprintMask(); clone();
};
class IMatchStrategy {
  MatchingType type() const noexcept;
  std::unique_ptr<LearnedPattern> learn(const cv::Mat& gray, const IMatchTypeConfig&,
                                        const ForegroundConfig&, ManagerResult&) const;
  std::unique_ptr<IWorkspace> createWorkspace() const;
  bool search(const cv::Mat& region, const LearnedPattern&, const SearchParams&,
              IWorkspace&, std::vector<Candidate>& out) const;
};
```

- Strategies are stateless and const; all mutable scratch lives in the workspace so the
  hot path allocates nothing in steady state (project rule "Performance goals").
- `MatchPattern` owns `unique_ptr<LearnedPattern>` and forwards `expectedArea()` and
  `footprintMask()`; `learn()`, `learnAll()` and `learned()` are internal-facing (the strategy
  headers are not installed) and will be driven by `ImageMatcher` (2.6).
- Every strategy checks `pattern.type() == type()` before downcasting in `search()` and
  returns false otherwise; `MatchGroup::setConfig` clears all learned data.

## Amendment 3 (2026-10-14, after the M3 review): correlation masks and flat-input guards

Evidence (scratch probe on OpenCV 4.14, templmatch.cpp matchTemplateMask): when the template is
constant inside the mask, masked TM_CCOEFF_NORMED returns NaN at every position (0/0, no epsilon
guard), TM_CCORR_NORMED returns 1.0 on every flat source window (Cauchy-Schwarz), and
TM_SQDIFF_NORMED scores 1 on every flat window of the same gray. A mask equal to the filled
footprint makes any part with a uniform interior such a template, and it also drops the boundary
contrast, which is the main information.

Decision:
- `useMask` mask at layer l = dilate(resize(footprint, size_l, INTER_NEAREST), ellipse r_l) with
  r0 = max(2, cvRound(0.05 * min(w, h))) and r_l = max(1, cvRound(r0 / 2^l)): the footprint plus a
  band of the pattern's own background. Masks are stored as CV_32F 0/1 so matchTemplate skips its
  per-call threshold/conversion. The undilated footprint stays the source of expectedArea,
  annotation and clearance.
- The learner's contrast guard runs per layer on the masked pixels when useMask (whole layer
  otherwise): stddev >= 2.0 gray levels, and every layer mask keeps at least 16 nonzero pixels.
- The search's flat-region early-out uses the gray range (max - min < 4), never the global
  standard deviation, which shrinks with the region size and would hide small parts.
- Cross-angle suppression of coarse candidates was tried and REJECTED (2026-10-14): keeping the
  best coarse-scored candidate of a cluster starts the +/-1 step refinement from the wrong angle
  and moves the centre 1.4-1.8 px (fails the pose tests at 2-step and 1-step thresholds; at
  0.5 step it merges only exact twins and gives no speedup). CcorrNormed / SqdiffNormed stay
  20-50x slower than CcoeffNormed on flat-ish scenes; documented in docs/modes.md. A faster
  variant (refine the best few per cluster with a wider window) would need its own decision.
  Scores are not rescaled.

## Amendment 4 (2026-10-14, after the dense-scene recall spike): correlation coarse peak cap and cluster pruning

Problem: correlation searches the whole crop as one region, so the per-angle coarse cap
(`maxPosNum + kCandidateSlack`) limits the whole image, while the edge mode applies it per
contour region. Src10 (about 157 distinct rings): 117 found. Spike (brief
`.claude/docs/briefs/corr-recall-spike.md`, patch in the session scratchpad) measured four options:

| option | src10 objects | other 20 goldens | fine candidates on src10 |
|---|---|---|---|
| baseline | 117 | exact | 5475 |
| maxPosNum 150+ (no code change) | 161 | exact | about 11000 |
| tiles (cap per 4x template tile) | 161 | 6 outside tolerance, src1 count changes | about 12600 |
| cluster K-best, K=12 | 161 | exact (0 deviation) | about 1900 |
| cluster K-best, K=3 | 161 | 7 outside tolerance (0.85 px / 1.9 deg) | about 480 |

Decision:
- The per-angle coarse cap becomes `max(maxPosNum, min(packingBound, kMaxCoarsePeaksPerAngle)) +
  kCandidateSlack` with `packingBound = floor(srcTopArea / ((1 - maxOverlap)^2 * tmplTopArea))`
  and `kMaxCoarsePeaksPerAngle = 512`. `maxPosNum` of `CorrelationMatchConfig` is redefined as
  the MINIMUM number of coarse peaks kept per angle (documented in the header and docs/modes.md);
  no schema change. Edge mode unchanged.
- After the merge and the deterministic sort of the coarse candidates, a cluster pass keeps at
  most `kClusterKeep = 12` candidates per position cluster (radius `0.25 * min(top template side)`,
  cluster centre = template centre mapped back to the unrotated top layer, never the window
  top-left), visiting candidates in the sorted order, so results stay thread-count independent.
  This differs from the rejected cross-angle suppression (keep 1): with K = 12 the refinement
  still starts from enough angles to reproduce every golden exactly.
- Per-angle slots store a compact peak record (16 bytes); all scratch is reserved in
  prepareSearch from the cap, so steady-state searches stay allocation-free.
- Rejected: tiles (slowest, adds marginal objects in sparse scenes, shifts poses); K = 3
  (2x faster suite but changes poses up to 0.85 px / 1.9 deg; would need regenerated goldens and
  an accuracy decision); "within delta of the cluster-best coarse score" (coarse score does not
  predict the best refinement start; 9-11 goldens outside tolerance).
- Consequences: corr_src10_dst10 golden regenerated (117 -> 161; ring poses move within the
  symmetric-ring ambiguity, up to about 2.7 px, because the 54x54 crop is off the ring centre by
  about 1.5 px). The other correlation goldens stay byte-identical. Known remaining cost on sparse
  scenes: 1000-2400 coarse candidates for 1-6 survivors (fine-stage early-out is a separate task).
