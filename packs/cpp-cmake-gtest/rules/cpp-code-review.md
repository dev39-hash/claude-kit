---
paths:
  - "**/*.cpp"
  - "**/*.cc"
  - "**/*.cxx"
  - "**/*.h"
  - "**/*.hpp"
  - "**/*.hh"
---
# C++ review checklist (pack cpp-cmake-gtest)

> Adapted from ECC `rules/common/code-review.md` (MIT). The reviewer agent applies it; the
> verdict vocabulary is the kit's (`APPROVE / WARN / BLOCK`, severities `BLOCK / HIGH /
> MEDIUM / LOW`, rule `06-evidence.md`).

## Memory-safety triggers (dedicated pass before anything else)

Raw or aligned buffers and their copy/move members; SIMD intrinsics or parallel pragmas;
views (`mat(rect)`, spans, `string_view`) that may outlive the parent; raw pointers or
references returned from accessors or kept across a call; file, document, frame or message
parsing of untrusted input.

## Checklist

- [ ] Readable, project naming, functions under ~50 lines or justified, nesting under 4
- [ ] Errors returned or asserted, never printed and ignored; no debug output left
- [ ] No host-app, UI or device includes in library code; public headers depend only on
      what `project/rules.md` allows
- [ ] Tests: unit test for new logic; regression or golden updated when output changes, with
      the reason; shape check in the Test report
- [ ] Doxygen on new public symbols; in-place mutation documented
- [ ] Goldens (where the project has them) changed only with an explanation and in their own commit
- [ ] ASCII only in sources, headers, CMake and README; English
- [ ] Build files: new sources registered in the right target; no machine path; no new
      option without an ADR when it changes the public surface

## Common defects

- Uninitialised members; narrowing `double` to `int` on coordinates without rounding;
  shallow copies where an owned copy was intended; negative or overflowing index math.
- Numeric and geometry code: angle wrap at +/-180; region offsets not added back; score
  semantics mixed (lower-is-better vs higher-is-better); filtering that depends on container order.
- Allocation or copies in inner loops of a named hot path; missing `reserve()`; copies of large owners.

## Severity

| Severity | Meaning |
|---|---|
| BLOCK | UB, memory unsafety, data race, silent wrong result, scope breach |
| HIGH | contract broken, missing test for changed behaviour, rule violation, contract change without ADR |
| MEDIUM | maintainability, performance in a hot path |
| LOW | style, naming, comment wording |
