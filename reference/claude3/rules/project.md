# Project rules: image_matching (mtc library)

Always loaded. Project-specific rules win over `ecc/common/*` and `ecc/cpp/*`.

## Goal

Build a reusable image-matching component library in **pure OpenCV C++** (C++17 minimum,
C++20 allowed) for computer-vision projects. No Qt, no host-app dependencies.

## Source of truth vs. reference

- `reference_source/matching/` is a **read-only** extract from a shipped Qt robot-picking app.
  Never edit it (a hook blocks edits). Port code from it into `src/` and `include/`.
- `reference_source/Test Images/` are regression fixtures. Tests may read them; never modify them.
- The only reference file that depends on Qt or the old app's `core/` layer is
  `pattern_group_manager.*`. Everything else is OpenCV + STL and ports almost verbatim.

## Hard constraints

- Public headers include only OpenCV and the standard library. No `QObject`, `QString`, `QJson`.
- Logging and settings go through small injectable interfaces (e.g. `ILogger`), never a global
  macro from a host app.
- **No picking, gripper, collision or robot vocabulary anywhere in the library** (ADR-0005).
  Downstream acceptance logic plugs in through `IMatchCondition` / `IMatchSetCondition`
  (per-match OK/NG outcome with a reason). The overlap check survives as **clearance zones**:
  user polygons in pattern coordinates checked against the foreground mask by
  `ClearanceCondition`, edge-based mode only (rejected at config time for Correlation). The
  reference gripper boxes and `IRobotPickingChecker` are NOT ported; legacy gripper settings
  are converted to clearance zones on load. Gate: `grep -riE "pick|gripper|robot|collision|workpiece|jaw" include src --exclude=legacy_keys.cpp`
  must return nothing. The single exemption is the legacy JSON key table
  (`src/model/legacy_keys.cpp`, M4) that maps v0-v2 document keys to the new model; tests
  that feed legacy documents may contain those key strings as data.
- SIMD (AVX2) and OpenMP are optional at build time. Keep a scalar fallback for every SIMD path
  and guard with `MTC_USE_AVX2` / `MTC_USE_OPENMP`.
- Unicode file paths: use `std::filesystem::path` at the API boundary; keep the
  `imread`/`imwrite` wide-path helpers from `vision_utils.h` internally.

## Naming convention (overrides `ecc/cpp/coding-style.md` and the Core Guidelines NL.10)

Keep the convention the reference code already uses, so porting stays a diff and not a rewrite:

| Element | Style | Example |
|---|---|---|
| Namespace | lowercase | `mtc` |
| Types, enums | PascalCase | `MatchPattern`, `MatchingType::EdgeBased` |
| Functions, methods | camelCase | `learnPattern()`, `setImageSource()` |
| Member variables | `m_` + camelCase | `m_rawImage`, `m_topLayer` |
| Constants | `k` + PascalCase | `kSchemaVersion`, `kDefaultMinScore` |
| Macros | avoid; UPPER_SNAKE if unavoidable | `MTC_USE_AVX2` |
| Files | snake_case | `image_matcher.cpp`, `edge_match_config.h` |

Public headers use `#pragma once`. Doxygen `///` comments on every public symbol (the
reference code already does this; keep that quality).

## Mutation policy (overrides "Immutability CRITICAL" in `ecc/common/coding-style.md`)

Image pipelines mutate buffers in place on purpose. The rule is **intent, not immutability**:

- Document every in-place write in the Doxygen comment (`@param[in,out]`, `@param[out]`).
- Public APIs take input images as `const cv::Mat&` and return results by value or via a
  clearly named `[out]` parameter. Never mutate a caller's image without saying so.
- Configs (`EdgeMatchConfig`, `MatchPatternConfig`) are value types: copy, modify, set.
- Raw aligned buffers (`_mm_malloc`) are allowed **only** inside an RAII owner
  (e.g. `AlignedBuffer<float>`), never as loose pointers in a class.

## Testing policy (overrides the 80% / E2E rule in `ecc/common/testing.md`)

- Framework: GoogleTest via CMake FetchContent, run with CTest.
- Required: unit tests for geometry/config/utility code, plus **regression tests** that run the
  matcher on `reference_source/Test Images` and assert position/angle/score within tolerance.
- No E2E/browser tests. Coverage target is a goal (80% on `src/`), not a merge gate.
- Record golden results as JSON under `tests/golden/`; regenerate only with an explicit
  `--update-golden` flag and a commit message explaining why.

## Build and tools (Windows 11 host)

- Build: CMake + MSVC 2022 (x64). Keep the CMake project also buildable with clang-cl / GCC.
- OpenCV: `BINPICK_OPENCV_DIR=C:\build_packages\opencv\build` (OpenCV 4.x, vc16). Use
  `find_package(OpenCV REQUIRED)` with `OpenCV_DIR` pointing there; never hard-code the path in
  CMakeLists.
- clang-format, clang-tidy and cmake are **not on PATH** but exist inside Visual Studio 18
  Community (`VC\Tools\Llvm\x64\bin`, `Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin`).
  cppcheck is not installed. Tools and hooks must degrade gracefully when a tool is missing;
  say so in the report instead of failing.
- Do not install tools, global packages or plugins without asking.

## Where things live

```
include/mtc/        public headers (installed)
src/                library sources
tests/unit/         GoogleTest unit tests
tests/regression/   matcher regression tests on Test Images
tests/golden/       expected results (JSON)
docs/               user documentation (tracked; self-contained, no links outside the repo)
reference_source/   READ-ONLY original code + test images (module doc: README.md; NOT tracked)
.claude/docs/adr/   architecture decision records (NOT tracked)
.claude/memory/     backup copy of Claude's project memory (NOT tracked)
```

## Decisions that need an ADR

Changing the public API shape, the config model, the pyramid/scoring algorithm, the JSON
schema, or adding a new `MatchingType` all require an ADR in `.claude/docs/adr/` (see the
`architecture-decision-records` skill).

## Repository and documentation policy

- Git identity for this repo: `dev28 <devgbit@gmail.com>` (repo-local `git config`). It is the
  **only** identity in the history. Commits carry **no AI attribution trailer**
  (`Co-Authored-By`, `Generated with ...`), whatever the harness default says, and never
  mention an owner, role, company, or requester; they describe the change only.
- **English only** in the codebase and its docs: identifiers, comments, README files,
  commit messages, test names. Conversation with the user may be in Vietnamese.
- The repo is a library for its users. Track only: sources, public headers, tests, build
  files, user-facing `README.md` files, and **user documentation under `docs/`** (usage
  guides, API notes, Doxygen config) and `CHANGELOG.md` at the root. Design-process documents (ADRs, plans,
  agent briefs, session notes) live under `.claude/docs/` and are never committed.
- Everything under `docs/` and every `README.md` must be self-contained for a library user:
  no links or references to `.claude/`, `reference_source/`, agents, plans, ADRs, or any
  untracked path; no absolute local paths.
- Markdown inside the repo tree: one `README.md` per module/directory, `CHANGELOG.md` at the
  root (user decision 2026-10-13), and user docs under `docs/`. Never create `CLAUDE.md`,
  `AGENTS.md` or `AGENT.md` in the tree; Claude Code's instructions file is `.claude/CLAUDE.md`.
- `.claude/` is excluded through the machine's global gitignore (`~/.config/git/ignore`),
  not through the repo `.gitignore`, so the published repo shows no trace of it.
- `reference_source/` is listed in the repo `.gitignore` and is never tracked: the original
  module and the test images stay local. Regression tests locate fixtures through the
  `MTC_TEST_DATA_DIR` CMake cache variable (default `reference_source/Test Images`) and
  `GTEST_SKIP()` when the directory is absent, so a clean clone still builds and passes.
- **ASCII only** in `.cpp/.h/.cmake/CMakeLists.txt` and `README.md` files, including comments:
  no em-dash, arrows, multiplication sign, degree sign, plus-minus, box-drawing. MSVC emits
  C4819/C4566 and may mis-decode such files; the reference sources contain many of these in
  Doxygen comments and they must be rewritten to ASCII while porting (`--`, `->`, `x`, `deg`,
  `+/-`).
- Memory for this project is kept in two identical places: the global memory dir
  (`~/.claude/projects/c--DGB-Project-image-matching/memory/`) and the backup
  `.claude/memory/`. The `sync-memory.js` Stop hook mirrors global -> backup after every turn;
  `node .claude/hooks/sync-memory.js --restore` mirrors backup -> global on a fresh machine.

## File deletion policy

"Root" below means the project folder `C:\DGB\Project\image_matching`.

- **Inside the project folder**: deleting or moving files is allowed when the task calls for
  it (the tree is under git), with one exception: never delete or modify anything under
  `reference_source/`.
- **Outside the project folder**: never delete anything on your own initiative. Ask the user
  and get an explicit yes first.
- Exception everywhere: temporary files Claude itself created (session scratchpad, temp dir,
  test outputs) may be removed without asking.
- Enforcement: the `guard-delete.js` PreToolUse hook blocks delete commands that target
  `reference_source/` or any path outside the project folder (except temp). Do not work
  around the hook; ask instead.

## Delegation and models

- Claude is the **project lead**: plans, writes briefs, delegates, reviews reports, verifies,
  commits. It does not implement or test code directly; `cpp-implementer`, `cpp-tester`,
  `cpp-reviewer`, `cpp-build-resolver` do (see `ecc/common/agents.md` for the pipeline and the
  brief template).
- **Models**: workers (`cpp-implementer`, `cpp-tester`, `cpp-build-resolver`, Explore, Plan,
  general-purpose) use `model: "sonnet"`; reviewers (`cpp-reviewer` and any ad-hoc review) use
  `model: "opus"`. Applies at every depth; repeat it inside every brief for nested agents.
- Plan of record: `.claude/docs/plan/v0.1.0-plan.md`. Keep its progress section current.

## Performance goals (user priority, 2026-10-13)

The user's stated priority for 0.1.0: **minimal memory allocation and the highest execution
speed achievable**. Concretely:

- Hot paths (learn, coarse/fine search, kernels, block-max, overlap filter, conditions) do
  no heap allocation per call: scratch buffers live in a per-matcher `Workspace`, are
  `reserve`d once and reused; `AlignedBuffer` keeps capacity on `resize`/`clear`.
- No `cv::Mat::clone()` or temporary `cv::Mat` creation inside per-candidate / per-angle /
  per-layer loops; use preallocated Mats and ROI views with documented lifetime.
- Containers of known size are `reserve`d; `std::vector<Candidate>` etc. are reused across
  calls (`clear()` keeps capacity).
- Pattern data is contiguous (SoA float arrays in `AlignedBuffer`), 32-byte aligned, built
  once at learn time; nothing is recomputed per search that can be cached at learn time.
- SIMD (AVX2+FMA) kernels for every inner product; scalar twin only as fallback. OpenMP over
  angles with ordered merge; thread-count independent results.
- Every implementer brief for a hot-path component states its allocation budget; every
  reviewer pass checks it. The benchmark target (`tests/bench/`) reports per-stage time and
  peak allocations (count via an allocation-counting test hook where practical).
- Measure before claiming: numbers go in the commit message when the matcher is touched.

## Angle and rotation convention (library-wide, decided 2026-10-13 after review)

- Angles are degrees, wrapped to (-180, 180].
- Image frame is y-down. A positive angle rotates CLOCKWISE as seen on screen. This is the
  convention of `cv::RotatedRect`, of the reference matcher and of the golden files:
  rotating offset (dx, dy) by angle a gives x' = cos(a)*dx - sin(a)*dy, y' = sin(a)*dx + cos(a)*dy,
  i.e. the matrix of `cv::getRotationMatrix2D(center, -a, 1.0)`.
- `MatchedObject::transformAnchor`, `geom::rotatePoint`, `rotatedRect()`, `corners()` and
  every strategy use this one convention. The reference `ptRotatePt2f` is the OPPOSITE sign:
  when porting reference rotations call `geom::rotatePoint(p, o, -angle)`.
- `corners()` order follows `cv::RotatedRect::points`: [0] bottom-left, [1] top-left,
  [2] top-right, [3] bottom-right (for angle 0). Golden LT/RT/RB/LB = corners()[1,2,3,0].
- Regression tests compare angles by wrapped difference (the reference may report -180
  where the library reports +180).

## Build slots for parallel agents (user decision 2026-10-13)

- Agents never create their own per-task build directories. They acquire a reusable slot:
  `SLOT=$(node .claude/tools/wt-slot.js acquire <task-tag>)` prints `build-wt/slotN`
  (8 slots, lock file per slot, locks older than 3 h are reclaimable) and release it when done:
  `node .claude/tools/wt-slot.js release <task-tag>`. `status` and `reclaim` exist for the lead.
- Slots keep their CMake cache, so configure is fast; always re-run the configure command in
  the slot before building and pass every option explicitly, including `-DBUILD_SHARED_LIBS=OFF`
  or `ON` (a previous task may have left the opposite value in the cache).
- `build` is the lead's verification tree; `build-wt` is gitignored by the `build-*` rule.
- Tester and implementer of the same task running in parallel use two tags (two slots).

## Preview versions (user decision 2026-10-14)

- Every commit that can change matcher output (anything under `src/` or `include/` that affects
  learning, search, conditions or result geometry, and every golden update) is followed by a
  preview version in `build-preview/` (project root, gitignored by the `build-*` rule).
- The lead creates it with `node .claude/tools/preview.js <label>` after the Release build of
  the regression executable: a new folder `build-preview/NNN_<date>_<sha>_<label>/` with one
  annotated image per golden case (library result plus the golden poses), `summary.tsv`, and a
  `README.md` for that version (commit, what changed, how to reproduce, per-suite tables,
  changes since the previous version). `build-preview/README.md` indexes all versions.
- Old versions are never deleted by agents; the user prunes them.
