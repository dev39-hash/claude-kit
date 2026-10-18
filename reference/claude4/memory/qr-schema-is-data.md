---
name: qr-schema-is-data
description: "The QR parser layout is data in a resource JSON, but it is PERSISTED into the saved config — a new resource file does not reach a machine that already saved one"
metadata: 
  node_type: memory
  type: project
  originSessionId: 1755aee4-764a-4565-a94a-2f8acdf94b0d
  modified: 2026-08-17T06:33:44.099Z
---

The phase-10 QR parser is fully data-driven: `resrc/qr/qr_default_schema.json`
(`:/qr/qr_default_schema.json`) holds the content length, the format markers and
every field's offset/length/D-tag. No layout is compiled into logic.

**The trap:** that schema is **persisted into the saved configuration**
(`MarkingConfig.qrCodeReader.schema`). The resource is only a **fallback**, read
when the stored key is absent or unparseable. So shipping a corrected JSON does
**not** change a machine that has already saved a schema — to roll a layout change
out, export/import the config or clear the stored schema so the fallback takes
over. Test a schema change on a machine whose stored schema was cleared, or you
are testing the old layout.

**Why it matters:** it is what let the one genuinely uncertain part of the spec
(the Product number / Product marking offsets) ship as specified — correcting it
is a JSON edit, not a code change. That safety only holds if the rollout path is
understood.

Word count per field is **`ceil(len/2)`**, not `len/2`. Full reference:
`docs/rules/qr_code_schema.md`. See [[project-status]].
