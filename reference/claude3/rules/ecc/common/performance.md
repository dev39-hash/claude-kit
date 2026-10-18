# Performance

> Replaces ECC's `performance.md` (which is about Claude model selection) with rules for
> this library's hot paths.

## Measure first

- No performance claim without a number. `MatchResult::ExecutionTime` already exists; keep a
  benchmark target (`tests/bench/`) that prints per-stage timings on the fixture set.
- Record before/after numbers in the PR or commit message when touching the matcher.

## Hot-path rules (`MatchEdge`, `MatchEdgePattern*`, `GetNextMaxLoc`, `BlockMax`)

- No allocation inside the per-angle / per-position loops; allocate scratch once per call.
- No `cv::Mat::clone()` inside loops; use ROI views and document their lifetime.
- SIMD kernels get a scalar twin with identical semantics and a test that compares them.
- OpenMP parallel regions must not touch shared mutable state without a reduction.
- Keep `max_pos_num`, `max_overlap`, `greediness`, `stopAtLayer1` as the tuning knobs;
  do not add new magic constants in the kernels.

## Avoid

- Premature micro-optimization outside the kernels listed above
- `std::endl` in any logging path (forces flush)
- Copying `MatchPattern` (it owns pyramids and aligned buffers); pass by pointer/reference
