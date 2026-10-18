# WP-xx: <title>

- **Phase / plan item:** <plan ref or "-">
- **Issued:** <date> by the leader at commit <sha> - **Status:** issued | in progress | reported | reviewed | merged | returned
- **Class:** <per task-classification> -> reviewer: yes/no - artefact review: yes/no
- **Decision records in force:** <ADR / DR ids the WP implements or must respect>

## Goal

<One paragraph: what exists when this package is done, and why.>

## Read first (in this order)

1. <file - read in full | sections ...>
2. <...>
(Primary sources are read in full when the list says so; do not sample them.)

## Environment

- Base: `<integration branch>` at `<sha>`
- Branch: `<pattern e.g. wp/WP-xx-slug>`
- Worktree slot: `<dir>/slotN` (rules: `worktree-slots` skill) | main tree (no concurrent WP)
- Build: <exact commands or pointer to build-env.md; config; what to re-run (qmake) before make>
- Model: implementer `<models.worker>`; any agent it spawns runs on the same model; no reviewer agent

## Touch list

**May edit/create**
- `<path>` - <why>

**Must not touch**
- `<path>` - <why: another WP, frozen, hand-provisioned, read-only>

## Facts the leader verified

- <symbol exists / test count baseline / behaviour observed - each with evidence>

## Deliverables

1. <...>

## Acceptance criteria (numbered; each needs evidence in the report)

1. <criterion> - evidence: <test id / count / log line>
2. <behaviour-neutral: suite X shows the same total N and 0 failures before and after>

## Required negative checks

- Test `<name>` goes red when <injection>, because it can see <the change>; restored by <revert | re-applied patch>.

## Stop rules

- Stop and report (marker `STOPPED AT`) when: <a number moves from baseline | a file outside the touch list must change | a symbol named here does not exist | a build error outside the package | ...>

## Out of scope

- <...>

## Report

Write `<reportsDir>/WP-xx_report.md` with the six sections in order (template
`wp-report.md`); reply with at most 20 lines repeating the changed-file list and the
headline evidence. Committed text is English; cite symbols and headings, never line numbers.

## Hard rules (repeated on purpose)

ASCII-only code; stage by path; no `git add -A`, no `commit -a`, no amend, no rebase, no
hard reset, never touch `<integration branch>`; no AI attribution; never launch or kill
<processes.neverLaunch / neverKill>; suites run alone; read-only paths stay read-only.
