# Brief: correlation recall fix round 2 (Opus re-review Warning)

Not tracked. Base: `corr-recall-impl.md`, `corr-recall-fix.md`, ADR-0004 Amendment 4. Rules:
`.claude/rules/project.md` (ALL sections). Never run git add/commit/stash/checkout/reset.

## Implementer

- M-1 growth: a later search with more survivors than any earlier one allocates (measured: 5
  instances then 40 -> 3 new calls, then 100 -> 6). Fix:
  (a) `prepareSearch` reserves `fineSlots`, `order`, `results` to
      `min(maxCoarse, kClusterKeep * peakCap)` (a dense scene saturates clusters at 12, so kept
      <= 12 x instances <= 12 x packing bound); keep the compact arrays as they are;
  (b) any remaining growth point grows geometrically
      (`if (n > v.capacity()) v.reserve(std::max(n, 2 * v.capacity()))`);
  (c) drop `ws.deleted` from the correlation workspace (never read: pass nullptr to
      `filterOverlap`);
  (e) fix the stale docs in corr_workspace.h:12-15 and corr_search.h:117-119 so they say exactly
      what is reserved and when growth can still happen.
  Report reserved bytes at 75 and 361 angles x caps 75 and 517.
- M-2: upper bound for `maxPosNum`: `kMaxPosNum = 4096` (public constexpr next to the configs),
  enforced in `CorrelationMatchConfig::validate()` AND `EdgeMatchConfig::validate()` (same
  semantics: values above are rejected, not clamped) and in the internal `searchParamsValid`;
  document it in the config headers and in docs/modes.md parameter table. Check the JSON reader
  rejects it through validate (it calls validate) and that no golden or case file uses more.
- LOW: `rawCandidates` (corr_strategy.cpp:88) records the number of peaks BEFORE
  `reduceClusters` (as match_result.h documents "before filtering"); CHANGELOG: fold the
  correlation "Changed" entry into the correlation "Added" bullet (the mode is unreleased);
  docs/modes.md: replace "comparable to the edge-based mode" by a measured statement (e.g. on a
  dense scene of about 160 parts the correlation mode finds every part the edge-based mode finds).
- Housekeeping: slot0's `tests/consumer` cache points at an old export: delete
  `build-wt/slot0/tests/consumer/project-build/CMakeCache.txt` if present.

## Tester

- (d) `tests/unit/corr_dense_scene_test.cpp`: sparse -> dense -> dense with one matcher/workspace
  (same region size): the FIRST dense call after the sparse warm-up must make 0 operator-new
  calls in library code (Release; in Debug allow the existing iterator-debug constant). Also
  dense(40) -> dense(100) growth on the same workspace: 0 on the 100 call.
- M-3: fix the tolerance comment (corr_dense_scene_test.cpp:75-77): default fine step 0.5; worst
  1.36 deg is on upright instances and identical without pruning (fine-stage precision on a 41 px
  part).
- M-2: update `corr_cluster_test.cpp:147-148` (it pins unbounded maxPosNum) to the new bound;
  add config tests: maxPosNum 4096 accepted, 4097 rejected for both modes
  (tests/unit/match_type_config_test.cpp or the existing config test file), and a JSON document
  with maxPosNum 5000 rejected by readDocument (json_schema_test.cpp or hardening test).

## Common

Slots (tags recall-fix2-impl, recall-fix2-test), every option explicit with
`-S C:/DGB/Project/image_matching`:
`-G "Visual Studio 18 2026" -A x64 -DOpenCV_DIR="$BINPICK_OPENCV_DIR" -DMTC_WARNINGS_AS_ERRORS=ON -DBUILD_SHARED_LIBS=OFF -DMTC_BUILD_TESTS=ON -DMTC_BUILD_REFERENCE_HARNESS=OFF`;
`--parallel 8`; final build `--clean-first`. Acceptance: Release full ctest green incl.
mtc_regression with all goldens unchanged. Do not kill processes you did not start. Release
slots. SUB-AGENTS: workers "sonnet", reviews "opus". Do not commit.
