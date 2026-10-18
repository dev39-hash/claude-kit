# Plan: <title>

- **File:** `<plansDir>/<YYYY-MM-DD>_<slug>.md`
- **Status:** draft | approved <date> | in progress | closed <date> (<changelog version>)
- **Origin:** backlog row BL-nnn | request of <date> (untracked; not quoted here)

Plan phases, checkpoints and the plan-local decision numbers below may be named only inside
this file and its history folder. No person, agent, model, session or tool is named; the
plan is the project's record of what was decided and done.

## 1. Requirements (restated)

- R1: <in the project's own words>
- R2: <...>

Assumptions: <...>. Open questions: <...>.

## 2. Decisions needed

| # | Question | Options | Decision (date) |
|---|---|---|---|
| D1 | <...> | a / b | <pending or chosen> |

Project-wide decisions move to the decision file as `ADR Dn` items; plan-local ones stay here.

## 3. Spec delta

| Spec file | ID | Add / Change / Remove | Summary |
|---|---|---|---|
| `docs/spec/<capability>.md` | <PREFIX>-0nn | Add | <...> |

The delta is written into the specs and reviewed before any code.

## 4. Patterns to mirror

| Category | Source (file, symbol) | Pattern |
|---|---|---|
| Naming | | |
| Error handling | | |
| Threading | | |
| Config | | |
| Tests | | |

## 5. Tasks

### T1: <name>
- Files: <...>
- Action: <...>
- Verify: <build / test that proves it, naming the spec IDs>
- Risk: Low / Medium / High

### Checkpoints
- CP1: review of the change (code and spec delta).
- CP2: <bench or hardware confirmation by the human, if any>.

## 6. Verification

- Builds: <configurations and targets>
- Tests: <suites and the IDs they prove; expected totals>
- Goldens / oracles: <stay byte-identical | regenerated with reason>
- Bench (human): <what only the human can confirm>

## 7. Close-out

- CHANGELOG: <entry text or version>
- ADR: none | ADR Dn
- Backlog: rows closed <BL-...>; rows added <BL-...>
- Spec section 6 updated: yes / nothing to add

## 8. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
