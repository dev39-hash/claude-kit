# Brief M4: JSON persistence (schema v3 + legacy v0-v2) and PatternGroupManager

Shared spec for the tester (RED) and two implementers. Not tracked.
Rules: `.claude/rules/project.md` (ALL sections; the vocabulary gate exempts ONLY
`src/model/legacy_keys.cpp`, which holds the legacy key strings; tests may contain legacy keys
as data strings), ADR-0003 (FileStorage JSON, PNG images next to the document, schema v3,
learned data not serialized), ADR-0005 (+amendment: legacy box settings become clearance zones
via `opposedBoxZones`), `.claude/docs/notes/filestorage-findings.md` (MANDATORY: bytes + MEMORY
mode, flat arrays, bool read as int, isNone() for presence, keys are identifiers, names are
values, no \u escapes, wide integers as double). Reference (read-only):
`reference_source/matching/pattern_group_manager.{h,cpp}` lines 10-250 and 600-679.

## Model notes

- Names are UTF-8 `std::string` (the reference used wide strings).
- Static per-process index ranges of the reference are instance members.
- Images are not in the reference JSON (they lived in a database). In v3 each pattern
  references a PNG relative to the document directory.

## 4.1 Schema layer (implementer A)

Files: `src/model/json_schema.h/.cpp` (namespace `mtc::persist`), `src/model/legacy_keys.cpp`
(+ `legacy_keys.h`), `src/model/condition_registry.h/.cpp`, accessors on the built-in
conditions (public API: `include/mtc/builtin_conditions.h`).

```cpp
namespace mtc::persist {
constexpr int kSchemaVersion = 3;

/// One group as stored: config, index range and pattern configs (rawImage empty) plus the
/// relative image path of each pattern ("" when none).
struct StoredPattern { MatchPatternConfig config; std::string imagePath; };
struct StoredGroup   { MatchGroupConfig config; int minPatternIndex = 0; int maxPatternIndex;
                       std::vector<StoredPattern> patterns; };
struct LoadReport    { int sourceVersion = 0; std::vector<std::string> warnings; };

/// Serializes to a JSON document (UTF-8 bytes, FileStorage FORMAT_JSON, MEMORY mode).
ManagerResult writeDocument(const std::vector<StoredGroup>& groups, std::string& outJson);
/// Parses v3 and legacy v0/v1/v2 documents. Rejects version > 3, malformed JSON (no throw),
/// non-finite numbers, out-of-range values (via the configs' validate()).
ManagerResult readDocument(const std::string& json, const ConditionRegistry& registry,
                           std::vector<StoredGroup>& outGroups, LoadReport& report);
}
```

Schema v3 (keys are identifiers; arrays flat):

```
{ "version": 3, "generator": "mtc <version string>",
  "groups": [ { "name": "...", "index": 0, "matchingType": "EdgeBased" | "Correlation",
      "sortByAngle": false, "sortTargetAngle": 0.0, "patternIndexRange": [min, max],
      "foreground": { "blurWidth", "blurHeight", "binaryThreshold", "binaryMaxValue",
                      "invertBinaryThreshold" },
      "edge": { all EdgeMatchConfig fields }            (only for EdgeBased)
      "correlation": { all CorrelationMatchConfig fields, method as its name string }
      "conditions": [ { "type": "ScoreRange", "min": .., "max": .. }, ... ],
      "setConditions": [ { "type": "MaxCount", "maxCount": .. }, ... ],
      "patterns": [ { "name", "index", "minScore", "toleranceAngle", "anchorPoint": [x, y],
                      "angleOffset", "image": "images/g0_p1.png",
                      "clearanceZones": [ { "name": "...", "polygon": [x0, y0, x1, y1, ...] } ] } ] } ] }
```

Conditions: `ConditionRegistry` maps a type name to a writer and a reader
(`std::function<bool(const IMatchCondition&, cv::FileStorage&)>` style or a small interface;
implementer's choice, documented). Built-ins registered by default: InsideRoi (x, y, width,
height, requireAllCorners), ScoreRange (min, max), AngleRange (min, max as constructed: store
the constructor arguments, add accessors that return them), Clearance (excludeOwnFootprint),
MinDistance (minDistance), MaxCount (maxCount). Writing an unregistered (custom) condition:
writeDocument fails with "condition '<name()>' has no registered serializer" unless the host
registered one. Reading an unknown type: readDocument fails naming the type (strict).
Hosts register their own through `PatternGroupManager::conditionRegistry()`.

Legacy (no "version" = v0; 1; 2) per the reference schema history: group "name"/"number",
"matchingType" "Edge-Based"/"Correlation", "typeConfig" with edge fields AND the foreground
fields (blurWidth, blurHeight, binaryThreshold, binaryMaxValue, invertBinaryThreshold) which
move to ForegroundConfig; "greediness" and "lowWorkpieceRatio" are ignored (warning once per
document); "sortConditionAngle" -> sortTargetAngle. Pattern "number" -> index,
"pickPosition" {x,y} -> anchorPoint, "angle" -> angleOffset, "maxOverlap" ignored (warning),
box geometry per the reference read rule (v1 nested angle, v0 flat keys, v2 nested size +
flat angle), "usePickingBox" (default true when absent) -> when true AND size > 0:
clearanceZones = opposedBoxZones(size, distance, angle, "box") and the group gets ONE
ClearanceCondition(false) (reference semantics) if it has none; the offset keys are ignored.
Warning (LoadReport) when a legacy group uses a fixed binaryThreshold with
invertBinaryThreshold false: "legacy fixed-threshold foreground was always inverted when
searching; the library honours the flag". Legacy documents carry no images: imagePath "".
All legacy key strings live in legacy_keys.cpp as named constants.

## 4.2 PatternGroupManager (implementer B)

Files: `include/mtc/pattern_group_manager.h`, `src/model/pattern_group_manager.cpp`.

```cpp
class PatternGroupManager {   // not a dllexported class; members MTC_API; pimpl or plain members
public:
  // groups
  std::size_t groupCount() const noexcept;
  const MatchGroup* group(std::size_t i) const noexcept;          // nullptr out of range
  const MatchGroup* findGroup(const std::string& name) const noexcept;
  const MatchGroup* findGroupByIndex(int index) const noexcept;
  MatchGroup* editGroup(const std::string& name) noexcept;          // emits GroupChanged on next mutation? no: see events
  ManagerResult addGroup(const MatchGroupConfig& cfg);               // unique name and index
  ManagerResult removeGroup(const std::string& name);
  ManagerResult renameGroup(const std::string& name, const std::string& newName);
  ManagerResult renumberGroup(const std::string& name, int newIndex);
  ManagerResult setGroupConfig(const std::string& name, const MatchGroupConfig& cfg); // clears learned data
  void sortGroupsByIndex();
  // patterns (delegate to MatchGroup, add events)
  ManagerResult addPattern(const std::string& group, const MatchPatternConfig& cfg);
  ManagerResult removePattern(const std::string& group, const std::string& pattern);
  ManagerResult renamePattern(...); ManagerResult renumberPattern(...);
  ManagerResult setPatternConfig(...); ManagerResult setPatternImage(group, pattern, const cv::Mat&);
  // events
  enum class EventKind { GroupAdded, GroupRemoved, GroupRenamed, GroupRenumbered, GroupConfigChanged,
                         GroupsReordered, PatternAdded, PatternRemoved, PatternRenamed,
                         PatternRenumbered, PatternConfigChanged, PatternImageChanged, Loaded, Cleared };
  struct Event { EventKind kind; std::string group; std::string pattern; std::string oldName; };
  using Observer = std::function<void(const Event&)>;
  int addObserver(Observer); bool removeObserver(int id);           // events only after success
  // persistence
  ManagerResult save(const std::filesystem::path& dir) const;   // dir/library.json + dir/images/g<gi>_p<pi>.png
  ManagerResult load(const std::filesystem::path& dir, persist::LoadReport* report = nullptr);
  ManagerResult toJson(std::string& out) const;  ManagerResult fromJson(const std::string& json, LoadReport*);
  void clear();
  persist::ConditionRegistry& conditionRegistry() noexcept;
  void setLogger(ILogger*) noexcept;
};
```

- Persistence is transactional: load parses and validates everything into a temporary model
  (images read too); only on full success it replaces the current content and emits Loaded;
  on failure the manager is unchanged and the ManagerResult names the problem (file, group,
  pattern). Patterns loaded are NOT learned (ADR-0003); hosts learn through ImageMatcher.
- save writes images first (PNG via the image_io helpers, Unicode-safe paths), then the JSON
  to a temporary file renamed over library.json (no half-written document). Image file names
  use indexes, never user names. Existing unrelated files in dir are left alone; stale
  images of removed patterns may be removed only if they match the g*_p*.png pattern and
  are not referenced (document it).
- `editGroup` returns a mutable group for advanced use: document that mutations through it
  emit no events (or emit GroupConfigChanged lazily: choose "no events", documented).
- Not thread-safe; observers are called synchronously after the mutation, in registration
  order; an observer throwing propagates (documented) and leaves the model mutated.

## Tests (tester, RED first)

`tests/unit/json_schema_test.cpp`: v3 round trip of a rich model (two groups, both modes,
UTF-8 names incl. non-ASCII as raw bytes "\xC3\xA9", zones, every built-in condition and set
condition, index ranges) equal field by field after write+read; doubles bit-exact; rejects
version 4, malformed JSON, missing required keys, NaN, out-of-range values, odd-length
polygon arrays, unknown condition type, unregistered custom condition on write; a custom
condition with a registered serializer round-trips; legacy v0, v1 and v2 sample documents (as
raw string literals in the test; legacy keys are data) load with: anchor, angle offset,
foreground moved out of typeConfig, zones equal to opposedBoxZones of the recorded geometry,
one ClearanceCondition(false) per group with boxes, usePickingBox false -> no zones,
v0 without usePickingBox -> zones, warnings for greediness/lowWorkpieceRatio/maxOverlap and
for fixed-threshold-not-inverted; reports sourceVersion.

`tests/unit/pattern_group_manager_test.cpp`: CRUD with name/index clashes (group and pattern),
rename/renumber keep learned data where MatchGroup does, setGroupConfig clears it, events
emitted exactly once per successful mutation with the right payload and never on failure,
observer removal, sortGroupsByIndex emits GroupsReordered, save/load round trip in a temp
dir (std::filesystem::temp_directory_path() / unique name, removed at the end) incl. images
pixel-equal, a non-ASCII group directory name, load failure leaves the manager unchanged
(corrupt JSON, missing image, version 4), save does not leave library.json half written
(simulate by saving twice and checking the content is complete), toJson/fromJson in memory,
clear emits Cleared.

Allocation budget: not a hot path; no constraints beyond RAII.

## Acceptance

Whole tree green in static Debug/Release and shared Debug, 0 warnings (no C4251: the manager
is not a dllexported class); gates (vocabulary with the single exemption, ASCII, no untracked
references) clean; docs: `docs/persistence.md` (new, self-contained: file layout, schema v3
summary, legacy loading and its conversions incl. the fixed-threshold note, custom
condition serializers, learn after load), CHANGELOG Added + Planned updated, README module
map row for model/ updated. Opus review Approve/Warning. Commit:
`feat(model): add pattern group manager with JSON persistence`.
