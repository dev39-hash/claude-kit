# Brief: preview mode of the regression executable + library goldens for 6 src5 cases

Tester task. Not tracked. Rules: `.claude/rules/project.md` (ALL sections, incl. "Preview
versions"; ASCII; vocabulary gate incl. comments and test names; no references to untracked
documents in tracked files; fixtures via MTC_TEST_DATA_DIR, GTEST_SKIP when absent).
Existing infrastructure: `tests/regression/regression_main.cpp` (strips `--update-golden`,
`--preview-dir`), `tests/regression/golden_regression_test.cpp` (edge, reference goldens),
`tests/regression/correlation_regression_test.cpp` (library goldens), `tests/test_support/
golden_case.h`, `tests/test_support/library_golden.h`, `tests/README.md`.

## 1. Preview mode (no golden writes)

`mtc_regression --preview-dir <dir>` WITHOUT `--update-golden`: every suite runs and
compares exactly as in a normal run, and additionally writes for every case (skipped cases
included, marked as skipped):

- `<dir>/<suite>/<case>.png`: the source image (BGR) with
  - every library object: rotated rect in green (Ok) or red (Ng), anchor dot, score text,
    and the clearance zones in yellow when the case has them;
  - every golden object: corners LT-RT-RB-LB as a thin cyan polygon and its anchor as a small
    cyan cross, so differences are visible at a glance;
  - a header band (top-left, readable on dark and light images) with: suite, case, status,
    objects library/golden, max position/angle/score error, search ms.
  Large images may be downscaled to at most 2048 px on the longer side (draw first, then
  downscale with INTER_AREA). Suite folder names: `edge_reference`, `edge_library`,
  `correlation`.
- `<dir>/summary.tsv`, one header line then one line per case, tab separated, columns in this
  exact order: `suite case status objects golden_objects min_score max_score max_pos_err
  max_angle_err max_score_err state_mismatches search_ms note` where status is
  `pass|fail|skip`, errors are printed with 4 decimals (or `-` when not applicable), and
  `note` is the skipReason or the first failure message (tabs and newlines replaced by
  spaces). Lines are written in suite order, then case order of the cases file.
- The writer must not change test results; in a normal run (no --preview-dir) nothing is
  written. Writing goes through `std::filesystem` and `cv::imwrite` on the filesystem path
  string of an ASCII path (preview dirs are under the project).

`--update-golden --preview-dir` keeps its current meaning (write goldens + previews).

## 2. Library goldens for the 6 skipped src5 cases (suite `edge_library`)

User decision 2026-10-14: the six reference cases skipped with a skipReason
(src5_rot45, src5_rot90, src5_rot135, src5_rot180, src5_rot270, src5_rot90_anchor_right) get
library goldens: the reference goldens stay untouched and skipped.

- New cases file `tests/golden/library/edge_cases.json` with those six cases; each entry
  copies the pattern/source/anchor/patternRoi/matchRoi and every option of the corresponding
  reference case in `tests/golden/cases.json` (fixed binaryThreshold 80 and the RECORDED
  invertBinaryThreshold value, used consistently for learning and search: this is the
  library's behaviour, not the reference's inconsistent one), and the clearance settings
  converted with opposedBoxZones exactly as the reference suite does
  (ClearanceCondition(false)).
- New test file `tests/regression/edge_library_regression_test.cpp` mirroring
  correlation_regression_test.cpp (tight tolerance 0.25 px / 0.1 deg / 0.005, exact counts,
  state comparison for the clearance verdicts stored in the library golden).
- Goldens under `tests/golden/library/edge/<case>.json` (schema mtc-library-1, same writer).

Workflow: implement, build Release, run `--update-golden --preview-dir <scratchpad>/src5_preview
--gtest_filter=EdgeLibrary*` (check the actual suite prefix) and STOP: report per case objects,
scores, angles, centres, and the preview file names; the lead reviews the previews before the
goldens are kept. Then the lead asks for the final round trip.

## Acceptance

Regression exe builds with 0 warnings (Debug, Release); normal run: edge_reference 22 pass +
6 skip, correlation 21 pass + 2 skip, edge_library 6 pass after the lead's approval;
preview mode writes the PNGs and summary.tsv with the exact columns; tests/README.md documents
--preview-dir in normal mode and the edge_library suite; `git status tests/golden` shows only
additions under tests/golden/library/.
