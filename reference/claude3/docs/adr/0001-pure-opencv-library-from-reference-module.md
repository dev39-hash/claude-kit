# ADR-0001: Build the library by porting the reference matching module, pure OpenCV, no Qt

**Date**: 2026-10-13
**Status**: accepted (with plan rev 3, 2026-10-13)
**Deciders**: project owner

## Context

`reference_source/matching/` is the matching module of a shipped Qt robot-picking
application: edge-based (gradient direction) template matching with an image pyramid,
rotation search, overlap filtering, sub-pixel refinement, AVX2 + OpenMP kernels, plus
pattern/group configuration and robot-picking geometry. It is proven in production. Only
`pattern_group_manager.*` depends on Qt (QObject signals, QJson) and the host app's `core/`
logger and settings; the rest is OpenCV + STL. The goal is a component library reusable in
other computer-vision projects without Qt.

## Decision

We build the new library by porting the reference module file by file into `src/` and
`include/mtc/`, keeping the algorithm, the public types and the config model, and removing
every Qt and host-app dependency. Public headers depend only on OpenCV and the standard
library. Cross-cutting concerns (logging, persistence, robot reachability) are injected
through small interfaces, following the existing `IRobotPickingChecker` port. The build
system is CMake with GoogleTest; `reference_source/` stays in the repo as read-only
reference and test fixtures.

## Alternatives Considered

### Alternative 1: Wrap the existing module as-is and link Qt
- **Pros**: zero porting effort
- **Cons**: every consumer must link Qt 6; signals/QJson leak into the API; `core/` headers
  do not exist outside the host app
- **Why not**: defeats the "pure OpenCV" goal and is not buildable standalone today

### Alternative 2: Rewrite from scratch around OpenCV `matchTemplate` / feature matching
- **Pros**: clean slate, could drop legacy quirks
- **Cons**: loses a production-validated algorithm and years of tuning (greediness, block-max,
  gripper collision geometry); no ground truth to validate against
- **Why not**: risk and effort far exceed the benefit; the reference already has the right shape

## Consequences

### Positive
- Fast path to a working library with regression tests against the original behavior
- API stays familiar to the existing team
- Ports and value-type configs make the library testable without hardware

### Negative
- Some legacy naming and oversized functions are inherited and must be split during the port
- JSON persistence must be re-implemented without QJson

### Risks
- SIMD/OpenMP paths may differ between MSVC and GCC; mitigated by scalar twins and parity tests
- Behavior drift during the port; mitigated by golden-file regression tests written before porting
