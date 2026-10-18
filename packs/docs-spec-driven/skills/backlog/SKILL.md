---
name: backlog
description: Keep the one tracked backlog (docs/backlog.md, rows BL-nnn) - add a row for a defect, gap, pending decision or doc drift found and not fixed, point it at the owning spec's open-questions section, pick a row as the request for a new change, and delete rows on close without ever reusing an ID. Use when a reviewer, tester or the leader finds something out of scope, and at every task close-out.
argument-hint: <add "<one line>" | close BL-nnn | pick BL-nnn | triage>
---

# Backlog (pack docs-spec-driven)

One tracked list, `<backlogFile>` (default `docs/backlog.md`, template `backlog.md`). It
replaces standalone bug files, technical-debt notes, TODO lists in READMEs and "known
issues" sections that drift. Config: `packConfig.docs-spec-driven.backlogFile`,
`backlogPrefix` (default `BL`).

## Row format

```markdown
| BL-031 | P2 | defect | QR reader | Odd-length raw field forwarded without the trailing space | docs/spec/qr_reader.md section 6 |
```

Columns: ID, priority (`P1` blocking, `P2` next, `P3` when convenient), kind (`defect`,
`gap`, `decision`, `drift`), area, one line in the project's words, where the detail lives
(a spec's section 6, a module README, a test). One line per row; the detail never lives in
the backlog itself.

## Add

1. Confirm the item is not already a row (search the area and the words).
2. Write the detail where it belongs first: the owning spec's section 6 (open questions and
   known drift), or the module README when it is an editing hazard.
3. Append a row with the next free ID: highest existing `BL-nnn` + 1, including IDs that
   were already closed (never reuse; the file keeps a `Last used ID` line at the top).
4. No names of people, agents or tasks; no session dates in the row.

A finding reported by a reviewer or tester that the leader decides not to fix in the current
task goes here before the task closes (the Leader verify section says which row).

## Pick

A row can be the request for a new change: `spec-first` step 1 reads the row and the detail
it points at. The row stays until the change closes.

## Close

Delete the row when the change that fixes it closes (same commit as the fix, or the
CHANGELOG entry that records it). Update `Last used ID` only when adding. A row closed
without a fix (ruled out, won't fix) moves to the `Ruled out` section at the bottom with
the reason, so the question is not re-opened later.

## Triage

On request, or when the list exceeds about forty rows: group by area, confirm each row's
detail pointer still resolves, raise or lower priorities with the human, merge duplicates
(the older ID survives, the newer one is deleted with a note in the older row's detail).

## Never

- A second list anywhere else in the repo.
- Reusing or renumbering an ID; gaps are expected.
- Writing the analysis into the row; one line, pointer to the detail.
