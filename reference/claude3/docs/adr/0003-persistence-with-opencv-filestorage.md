# ADR-0003: Persist pattern libraries as JSON through cv::FileStorage

**Date**: 2026-10-13
**Status**: accepted (with plan rev 3, 2026-10-13)
**Deciders**: project owner, lead

## Context

The reference `PatternGroupManager` serializes groups and patterns with Qt's `QJson*` classes
(schema version 2, with compatibility reads for v1/v0). The library must be pure OpenCV C++
with no Qt, and the user wants no extra runtime dependencies. Hosts migrating from the
reference app would benefit from readable, similar JSON.

## Decision

We serialize with OpenCV's built-in `cv::FileStorage` in JSON mode (`FileStorage::WRITE |
FileStorage::FORMAT_JSON`). A dedicated `json_schema` layer owns key names and versioning
(schema version 3), and reads legacy v2/v1/v0 key layouts as described in the reference
comments. Pattern training images are stored as PNG files next to the JSON, referenced by
relative path. Learned pyramids are not serialized in 0.1.0; patterns are re-learned on load.

## Alternatives Considered

### Alternative 1: nlohmann/json (header-only)
- **Pros**: ergonomic API, exact JSON control
- **Cons**: a third-party dependency to vendor or fetch; license and update burden
- **Why not**: the "OpenCV only" constraint

### Alternative 2: cv::FileStorage in YAML/XML
- **Pros**: same code paths
- **Cons**: hosts and tooling expect JSON; harder to diff against the reference documents
- **Why not**: JSON is the established format for this data

## Consequences

### Positive
- Zero new dependencies; same OpenCV version everywhere
- Legacy documents remain loadable

### Negative
- `cv::FileStorage` JSON has quirks (key names must be identifiers, limited control of
  layout, no comments); the schema layer must map names explicitly

### Risks
- Subtle format differences from the Qt output; mitigated by round-trip tests and legacy
  sample documents in `tests/unit/`
