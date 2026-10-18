# ADR-0005: No picking or gripper concepts; match conditions with built-in clearance zones

**Date**: 2026-10-13 (revision 2, after plan review and user clarification)
**Status**: accepted (with plan rev 3, 2026-10-13)
**Deciders**: project owner, lead

## Context

The reference module was written inside a robot-picking application. It carries gripper
geometry (`GripperBoxes`, `m_pickingBoxAngle`, `m_usePickingBox`), a collision check of two
jaw boxes against the thresholded scene, picking offsets, a robot reachability port
(`IRobotPickingChecker`), and result fields such as `totalPossiblePicking`. The user's
direction: the library is about matching only, with no picking vocabulary. It must still
offer the useful part of the old collision check in a neutral form: the user configures
polygons around the pattern and the library reports whether they overlap other foreground.
That overlap check is supported in the edge-based mode only. Any other downstream
acceptance logic (reachability, inspection rules) must be pluggable by the user.

## Decision

1. **No picking, gripper, collision or robot concepts** in the public API, sources, or docs.
   The reference's gripper boxes, collision state, picking offsets, `IRobotPickingChecker`
   and `totalPossiblePicking` are not ported. The grep gate on `include/` and `src/` is
   `grep -riE "pick|gripper|robot|collision|workpiece|jaw"` and must return nothing.

2. **Search conditions** stay in the config model and shape the search: `minScore`,
   `toleranceAngle`, `maxOverlap`, matching ROI, `maxMatches`, early stop.

3. **Match conditions** classify each match after the search. A condition returns
   `Verdict::Ok` or `Verdict::Ng` with a reason; the matcher stores every outcome on the
   `MatchedObject`, counts OK/NG in `MatchResult`, sorts OK first, and can stop early after
   N OK matches. Two kinds of conditions, evaluated in two phases:
   - **per-object** (`IMatchCondition`): sees one match plus the context; evaluated as
     matches are found, so it can drive early stop;
   - **set-level** (`IMatchSetCondition`): sees the complete list (e.g. minimum distance
     between matches, maximum count); evaluated once after the search, before sorting.

```cpp
enum class Verdict { Ok, Ng };
struct ConditionOutcome { std::string name; Verdict verdict; std::string reason; };

struct MatchContext {                 // read-only; all geometry in the CROP frame
    const cv::Mat&     source;        // grayscale crop that was searched
    const cv::Mat&     foreground;    // CV_8UC1 0/255 filled-footprint mask of the crop
                                      // (edge mode); empty in correlation mode
    const MatchStats&  stats;         // foreground area, largest pattern area, timings
    cv::Rect           region;        // crop rect in the original image
    const std::vector<MatchedObject>& found;   // matches found so far (per-object phase)
    const MatchPattern& pattern;      // pattern of the object under evaluation
    ILogger*           logger;
    cv::Point2f        toImage(cv::Point2f cropPt) const;   // crop -> original image
};

class IMatchCondition {
public:
    virtual ~IMatchCondition() = default;
    virtual std::string name() const = 0;
    virtual ConditionOutcome evaluate(const MatchedObject& object, const MatchContext& ctx) const = 0;
};
class IMatchSetCondition {
public:
    virtual ~IMatchSetCondition() = default;
    virtual std::string name() const = 0;
    virtual void evaluate(std::vector<MatchedObject>& all, const MatchContext& ctx) const = 0;
};
```

   Conditions are registered on `MatchGroupConfig` (shared by the group's patterns). A
   throwing condition yields NG with the exception text as reason.

4. **Built-in conditions**: `InsideRoiCondition`, `ScoreRangeCondition`,
   `AngleRangeCondition`, `ClearanceCondition` (per-object); `MinDistanceCondition`,
   `MaxCountCondition` (set-level).

5. **Clearance zones** (the neutral replacement for the jaw-box collision check). A
   `ClearanceZone` is a closed polygon in pattern-local coordinates (origin = pattern
   anchor, x axis = pattern angle 0). `MatchPatternConfig::m_clearanceZones` holds any
   number of them. `ClearanceCondition` transforms each zone by the match pose (crop frame,
   y-down, same sign convention as the reported angle), rasterizes it, and reports NG when
   the zone overlaps `foreground` pixels that do not belong to the matched object's own
   footprint. **Edge-based only**: the foreground mask is produced by the edge pre-filter;
   registering `ClearanceCondition` on a Correlation group fails at configuration time with
   a `ManagerResult` error, never silently. The legacy JSON loader converts the reference
   `gripperBoxes` (size, distance, angle) into two rectangular zones so old libraries keep
   their behavior.

6. **Pattern geometry fields** become neutral: `m_pickPosition` -> `m_anchorPoint`,
   `m_angle` -> `m_angleOffset`. `MatchedObject` exposes `center` and `anchor` separately,
   both `matchedAngle` (raw) and `angle` (with offset), `patternIndex`/`patternName`, the
   rotated rect and corners, and the outcome list; it holds no raw parent pointer.

7. `lowWorkpieceRatio` and `isAreaLessThanLimits` are dropped; `MatchStats::foregroundArea`
   (defined exactly as the reference `sumArea`: filled contours whose min-area rect is below
   50% of the crop, noise excluded) and `largestPatternArea` let a user condition reproduce
   that check.

## Alternatives Considered

### Alternative 1: Keep gripper/collision as an optional module
- **Pros**: direct reuse of reference code
- **Cons**: robot vocabulary leaks into a general matching API
- **Why not**: contradicts the project's purpose

### Alternative 2: Only a user callback, no built-in overlap check
- **Pros**: smallest API
- **Cons**: every user re-implements polygon rasterization and foreground masking
- **Why not**: the user explicitly wants the polygon overlap check in the library

### Alternative 3: Clearance zones in both modes
- **Pros**: symmetric API
- **Cons**: correlation mode has no foreground mask by design; adding one duplicates the
  edge pre-filter and slows the mode down
- **Why not**: user decision; may be revisited in 0.2

## Consequences

### Positive
- Domain-neutral API; the useful overlap check survives as "clearance zones"
- OK/NG outcomes with names and reasons make results self-explaining and testable
- Legacy gripper settings migrate automatically

### Negative
- Clearance is edge-only; documented and enforced at configuration time
- User-defined conditions cannot be serialized in 0.1.0 (built-ins are, by name + params)

### Risks
- Early stop is "first N OK in candidate order", not "best N"; candidates are processed in
  a deterministic order (descending contour area) and the behavior is documented
- Frame confusion between crop and original image; mitigated by `MatchContext::toImage`
  and by validating `ClearanceCondition` against the reference collision verdicts in the
  harness goldens

## Amendment (2026-10-13, task 2.5 design)

- `IMatchCondition::requiresForeground()` (default false) lets the facade reject a condition
  that needs the foreground mask on a correlation group at configuration time;
  `ClearanceCondition` returns true.
- `ClearanceCondition(bool excludeOwnFootprint = true)`: with the default, pixels of the
  object's own posed footprint are not counted as foreground (the ADR semantics above);
  with false the verdict is bit-for-bit the reference mask-based check (Outside -> Ok,
  Inside -> Ng "inside", Collision -> Ng "overlap"), which is what the 2.7 regression
  compares against the recorded reference states.
- `opposedBoxZones(size, distance, angleDeg)` builds the two rectangular zones that the
  legacy box settings described, in pattern-local coordinates; the legacy loader (M4) and the
  regression suite use it.
- Zones are posed with `matchedAngle` (the pattern rotation), not with the reported angle.
