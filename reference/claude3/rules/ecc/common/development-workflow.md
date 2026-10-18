# Development Workflow

> Adapted from ECC (`affaan-m/ecc`, MIT). Agent names point at the agents installed in
> `.claude/agents/`; registry/web-research steps trimmed.

## Feature Implementation Workflow

0. **Research & reuse**
   - Check `reference_source/matching/` first: most behavior already exists there.
   - Check OpenCV itself before writing a utility (`cv::rotatedRectangleIntersection`,
     `cv::minMaxLoc`, `cv::phaseCorrelate`, `cv::matchTemplate`, ...).
   - Prefer porting a proven approach over net-new code.

1. **Plan first**
   - Restate the requirement, list affected files, name the tests that will prove it.
   - For API/algorithm/schema changes, draft an ADR (`architecture-decision-records` skill)
     and wait for confirmation before coding.

2. **TDD**
   - Follow the `tdd-workflow` skill (C++ variant): RED test, GREEN minimal code, refactor.
   - For ports: regression test from reference behavior first.

3. **Verify**
   - Run the `verification-loop` skill: configure, build (warnings as errors), ctest,
     golden comparison, diff review.

4. **Review**
   - Use the `cpp-reviewer` agent (or `/cpp-review`) immediately after writing code.
   - Fix CRITICAL and HIGH before committing; MEDIUM when cheap.

5. **Commit**
   - Conventional commit message (see `git-workflow.md`).
   - One logical change per commit; golden-file updates in their own commit with a reason.

## Build failures

Use the `cpp-build-resolver` agent (or `/cpp-build`): one error at a time, minimal fix,
rebuild after each.
