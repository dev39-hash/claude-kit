---
paths:
  - "**/*.cpp"
  - "**/*.cc"
  - "**/*.cxx"
  - "**/*.h"
  - "**/*.hpp"
---
# C++ performance (pack cpp-cmake-gtest)

> Replaces ECC's `performance.md` with rules for hot paths in native libraries.
> `project/rules.md` names the hot paths and the budgets. A project that names none (a decision
> core, a protocol engine, a tool) keeps "Measure first" and skips "Hot-path rules"; the examples
> below come from image and signal pipelines.

## Measure first

- No performance claim without a number: a benchmark target (`tests/bench/`) prints
  per-stage timings on a fixed input set; numbers go in the task file and the commit message
  when a hot path is touched.
- Optimise only the hot paths the project names; everything else optimises for clarity.

## Hot-path rules

- No heap allocation per call: scratch buffers live in a per-object workspace, reserved once
  and reused (`clear()` keeps capacity); an allocation budget is stated in the task's Plan.
- No temporary container, buffer or image created inside an inner loop (per item, per
  candidate, per layer); use views with documented lifetime.
- Containers of known size are reserved; data for inner loops is contiguous (SoA where it
  helps), aligned, built once at setup or load time; nothing is recomputed per run that can
  be cached.
- Where the project uses SIMD: each kernel has a scalar twin and a parity test. Where it runs
  parallel regions: ordered merges and results independent of the thread count.
- Tuning knobs are config fields, never new literals in a kernel.

## Avoid

- Premature micro-optimisation outside the named hot paths.
- `std::endl` on logging paths (forces a flush).
- Copying large owners (images, buffers, tables); pass by reference or pointer.
