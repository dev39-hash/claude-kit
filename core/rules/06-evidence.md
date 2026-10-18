# Evidence, tests and verdicts

Always loaded. Applies to every role.

- **A report is not proof.** The build, the tests and the gate tools are. The leader re-runs
  them before trusting any claim, and verifies each reviewer finding against the code before
  acting.
- Every claim carries evidence: a test id, a count, a log line or a file path. A test total
  is trusted only with a shape check (number of test functions matches the listing). Nothing
  is marked verified without it; `unverifiable here` with the reason is the honest answer.
- **Negative check**: a regression test must be shown to fail without the fix. Name the test
  expected to go red and why it can see the change; show red; restore; say how (revert or
  re-applied patch). A test counts as red only if it compiled, ran and failed for the
  intended reason.
- Never edit a test, golden, fixture or baseline to make a run pass, and never weaken an
  assertion. If a test looks wrong, stop and report. Expected values come from the spec or
  the reference, not from the code under test.
- TDD when the class calls for it: no production edit until a valid RED exists (compiles and
  fails because the behaviour is missing, or fails only because the new symbol does not
  exist). Then the smallest GREEN, then refactor with everything green.
- Verify the whole tree, not a single target, and read the build log for `error` and
  `warning` before trusting a test run. A phase skipped for a missing tool is `SKIPPED`,
  never `PASS`.
- Reviewers report a finding only when more than 80 % sure, with `file:line`, a concrete
  failure scenario and the minimal fix; mark each `confirmed by reading` or `suspected (needs
  a run)`. Zero findings is a legitimate outcome. Say what was not checked.
- **One verdict vocabulary**: `APPROVE` (no BLOCK/HIGH), `WARN` (MEDIUM/LOW only),
  `BLOCK` (any BLOCK or HIGH). Severities: `BLOCK` (wrong result, data loss, memory/safety),
  `HIGH` (rule violation, missing test for new behaviour, contract change without an ADR),
  `MEDIUM` (quality, performance), `LOW` (style, nit). Tester verdicts are `PASS` / `FAIL`.
- Two consecutive FAILs on the same step: the leader stops and consults the human.
