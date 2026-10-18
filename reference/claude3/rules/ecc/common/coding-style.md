# Coding Style

> Adapted from ECC (`affaan-m/ecc`, MIT) for this project. The original "Immutability
> (CRITICAL)" section is replaced by the mutation policy in `../../project.md`.

## Core Principles

### KISS (Keep It Simple)

- Prefer the simplest solution that actually works
- Avoid premature optimization; measure first (see `performance.md`)
- Optimize for clarity over cleverness, except in documented SIMD hot paths

### DRY (Don't Repeat Yourself)

- Extract repeated logic into shared functions or utilities
- Avoid copy-paste implementation drift (the reference code has two near-identical
  `GetNextMaxLoc` overloads; merge such pairs when porting)
- Introduce abstractions when repetition is real, not speculative

### YAGNI (You Aren't Gonna Need It)

- Do not build features or abstractions before they are needed
- `MatchingType::Correlation` is reserved; do not implement it until there is a user

## File Organization

MANY SMALL FILES > FEW LARGE FILES:

- 200-400 lines typical, 800 lines as a soft ceiling for source files
- `image_matcher.cpp` in the reference is 1,300 lines; split it when porting
  (coarse search, fine search, filtering, drawing, SIMD kernels)
- One class per header; header name == class name in snake_case
- Organize by feature (`matching/`, `pattern/`, `geometry/`, `io/`), not by type

## Error Handling

- Library code never calls `exit()`, never prints to `std::cout`/`std::cerr` directly
- Expected failures (bad config, unlearned pattern, empty image) return a result type
  (`ManagerResult`, `std::optional`, `bool` + out-param) and are documented
- Programming errors (null parent, size mismatch that cannot happen by contract) use
  `assert`/`CV_Assert` in debug and are documented as preconditions
- Exceptions only for truly exceptional conditions (allocation failure, corrupt file)
- Never silently swallow errors; never catch `...` in library code

## Input Validation

Validate at the library boundary, once:

- Empty `cv::Mat`, wrong type/channels, ROI outside the image, NaN angles
- Config ranges (`minScore` in [0,1], `kernelSize` in {1,3,5,7}, `toleranceAngle` in [0,180])
- JSON documents: check `version` and reject unknown schema versions explicitly

## Naming

See the table in `../../project.md` (camelCase methods, `m_` members, PascalCase types).
Boolean names read as claims: `isPatternLearned()`, `hasCollision`, `usingRoi`.

## Code Smells to Avoid

- Deep nesting (>4 levels): use early returns
- Magic numbers: the reference has `SOURCE_THERSHOLD_TOLERANCE`, `SMALL_CROP_OFFSET`,
  `MATCH_CANDIDATE_NUM` as macros; turn them into named `constexpr` in the config or a
  `constants.h`
- Long functions (>50 lines): `ImageMatcher::matching()` and `MatchEdge()` in the reference
  are 150-250 lines; split them when porting
- `using namespace std;` / `using namespace cv;` at file scope in **headers**: forbidden
  (allowed inside a `.cpp`)

## Code Quality Checklist

Before marking work complete:

- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines) or have a comment explaining why not
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Errors are returned or asserted, never printed and ignored
- [ ] No hard-coded values (use `constexpr` or config)
- [ ] Every in-place mutation is documented (`@param[in,out]`)
