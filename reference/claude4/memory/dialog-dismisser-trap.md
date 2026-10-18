---
name: dialog-dismisser-trap
description: "laser_host's DialogDismisser must stay short-scoped; process-wide it aborts the SDK's own dialogs"
metadata: 
  node_type: memory
  type: project
  originSessionId: 1755aee4-764a-4565-a94a-2f8acdf94b0d
  modified: 2026-10-07T05:06:21.900Z
---

`laser_host/dialog_dismisser.cpp` matches windows by CLASS (`#32770` = every
standard Windows dialog this process owns) and clicks the FIRST button it finds.
It was written for the dongle-less "Can not find dog!" prompt during
`lmc1_Initial`, but it used to run for the host's whole lifetime — and the SDK
raises a `#32770` **wait dialog during `lmc1_AxisCorrectOrigin`**, whose first
button is the abort. The host was therefore aborting its own homing every 200 ms.

**Why:** that single fact explains a defect that survived phases 8B and 9 —
`rc=140` from homing (it meant "interrupted", never "in progress"), the ~200 ms
homing cadence (the dismisser's own `Sleep(200)`), stuttering axis motion, and
**near-zero mark power after any homing**. Resolved 2026-08-07 by scoping the
dismisser to `lmc1_Initial`, the `close` command and teardown. Homing went from
29 calls / 5939 ms to **1 call / 1256 ms, rc 0**.

**How to apply:**
- Never construct a long-lived `DialogDismisser`; short RAII scope only, around a
  call known to raise a modal that no op can overlap.
- Before adding any SDK call that can show a dialog, check what would click it.
- Still open: no inventory of which other modals the SDK raises; now that the
  dismisser is scoped, such a modal during an op would block the host — tracked as
  `docs/backlog.md` BL-026.
- The investigation file was deleted 2026-10-07 (owner request); its conclusions
  are in `docs/rules/laser_sdk_runbook.md` (DialogDismisser row + "Investigating a
  bench defect") and `components/ezdlib/MarkEzd_DLL_Reference.md` §"Bench-measured
  behaviour". The full original text is gone (history squashed + gc'd).

Related: [[project-status]], [[laser-init-realmode]], [[ezd-sdk-docs]].
