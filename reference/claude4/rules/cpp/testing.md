---
paths:
  - "tests/**"
  - "laser_host/**"
  - "src/device/laser/mark_ezd_controller.*"
---
# Testing (NichirinLaserMark)

The tracked docs are the authority — read them, this file only adds what they
do not say:

- `docs/rules/build_and_verification.md` §Tests + §Definition of verified —
  framework (QtTest, one `.pro` per test), build folders, headless run,
  `run_all.ps1`, what "verified" means.
- `tests/README.md` — what each test covers, which need the board ATTACHED vs
  powered OFF, the `.ezd` fixtures in `tests/material/`, and which
  `laser_host.exe` an oracle run used (all tests run from `build/bin/<config>/`).
- `docs/rules/laser_sdk_runbook.md` §Out-of-process host — the two oracles and
  when to re-baseline.

## Oracles: ANY change, not only refactors

Run **both** `laser_host` oracles (the geometry oracle `capture_baseline.ps1 -Compare` and
`laser_host_protocol_test`) after **any** change to `laser_host/` or
`src/device/laser/mark_ezd_controller.*` — including deliberate behaviour changes.
For those, the diff IS the evidence: report exactly which lines changed and why,
and re-baseline only with the owner's agreement.

## Additions not written in the tracked docs

- Close-out of a change touching a shared module: **build every test project
  that includes that module**, not only the one you ran.
- Capture QtTest output with `-o file,txt` — Qt logs go to stderr, which plain
  `>` drops.
- Report every test that was not run, and why (board state, opt-in flag) — never
  as passing. `sdk_probe_test`'s hardware cases (`NLM_PROBE_HOMING`,
  `NLM_PROBE_MARK`) are never enabled without the owner.
- Before any manual laser run, also kill a leftover `laser_host.exe`, not only
  `EzCad2.exe`: `Get-Process EzCad2,laser_host -ErrorAction SilentlyContinue | Stop-Process -Force`.

## Writing tests

- Pin wire formats and register layouts with LITERAL expected values, not a
  round-trip through our own codec (a reversed order agrees with itself).
- A regression test for a fix should be shown to FAIL without the fix.
- Fakes injected through the `create*Device()` seams; give each fake distinct
  failure texts so interleavings stay visible.
- Prefer recording what was emitted over reasoning about the mechanism.
