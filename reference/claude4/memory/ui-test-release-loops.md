---
name: ui-test-release-loops
description: Widget tests (placeholders_tab_test) must be looped 25-40x in RELEASE - a use-after-free in the qpb Remove path crashed ~30-50% of runs but passed 4/4 and every Debug run
metadata:
  node_type: memory
  type: feedback
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-13T02:14:22.398Z
---

Run every widget/UI QtTest (e.g. `tests/placeholders_tab_test`) in a loop of 25-40 runs on the
RELEASE build, plus offscreen, before calling it green - and tell tester agents to do so.

**Why:** 2026-10-13: `remove_needs_a_selection` (Placeholders tab Remove -> qpb model removal, stale
QModelIndex read by the proxy during a delayed layout) crashed 0xC0000005 in ~30-50% of Release runs.
The first tester ran the suite 4x and Debug 6x - all green - so it was committed in `a98c3f6`. Only a
25-run loop exposed it; cdb located it. Debug builds hid it completely.

**How to apply:** in tester briefs ask for a Release loop (>=25) of every UI test and the single
suspicious slot (>=40), report crash counts (exit -1073741819), and treat any crash as a blocker.
See [[working-arrangement]].
