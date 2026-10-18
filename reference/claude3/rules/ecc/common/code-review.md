# Code Review Standards

> Adapted from ECC (`affaan-m/ecc`, MIT). Web-only items (N+1 queries, XSS, console.log)
> removed; C++/vision items added.

## When to Review

- After writing or modifying code (use the `cpp-reviewer` agent, or `/cpp-review`)
- Before any commit to `main`
- When the public API, config model, JSON schema, or the scoring algorithm changes
- When SIMD, OpenMP, or raw-buffer code changes (memory safety review is mandatory)

## Review Checklist

- [ ] Code is readable and well-named (project naming convention)
- [ ] Functions are focused (<50 lines) or justified
- [ ] Files under the 800-line soft ceiling, or a reason is given
- [ ] No deep nesting (>4 levels)
- [ ] Errors are handled explicitly (result types / asserts), never printed and ignored
- [ ] No `std::cout` / `printf` debugging left in library code
- [ ] No Qt or host-app includes in `include/` or `src/`
- [ ] Tests exist: unit tests for new logic, regression test updated if matcher output changes
- [ ] Doxygen on every new public symbol
- [ ] Golden files changed only with an explanation in the commit message
- [ ] ASCII only in sources, headers, CMake and README files (no Unicode in comments)
- [ ] No `CLAUDE.md`, `AGENTS.md` or design docs staged; only `README.md` per module

## Memory-Safety Review Triggers

STOP and do a dedicated memory-safety pass when the change touches:

- `_mm_malloc` / aligned buffers / `PatternLayer` copy-move members
- AVX2 intrinsics or OpenMP pragmas
- `cv::Mat` ROI views (`mat(rect)`) that outlive the parent
- Raw pointers returned from accessors (`getPyramid()`, `getPatterns()`)
- File I/O and JSON parsing of untrusted documents

## Review Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | UB, memory unsafety, data race, wrong match result silently | **BLOCK** |
| HIGH | Bug, API contract broken, missing test for changed behavior | **WARN** |
| MEDIUM | Maintainability (long function, unexplained >800-line file, duplicate logic) | **INFO** |
| LOW | Style, naming, comment wording | **NOTE** |

## Review Workflow

1. `git diff` to understand the changes
2. Memory-safety triggers first
3. Code quality checklist
4. Build (`cmake --build build`) and run `ctest`
5. Compare regression output against golden files
6. Use the `cpp-reviewer` agent for the detailed pass

## Common Issues to Catch

### Memory / UB

- Uninitialized members (the reference `MatchParams` leaves most fields uninitialized)
- Narrowing `double`->`int` on pixel coordinates without `cvRound`
- `cv::Mat` shallow copies where an owned copy was intended (`clone()` vs `=`)
- Index math on pyramid layers that can go negative

### Correctness

- Angle wrap-around at +/-180 deg
- ROI offset not added back to full-image coordinates
- Score comparisons with `TM_SQDIFF` vs `TM_CCOEFF_NORMED` semantics mixed up
- Overlap filtering that depends on vector order

### Performance

- `clone()` inside per-candidate loops
- Allocations inside the per-angle / per-position loops
- Missing `reserve()` on candidate vectors of known size

## Approval Criteria

- **Approve**: No CRITICAL or HIGH issues
- **Warning**: Only HIGH issues (merge with caution)
- **Block**: CRITICAL issues found
