---
name: docs-restructure
description: "Owner-approved move to spec-driven docs (2026-10-07) — docs/spec, untracked requests, no plan phases outside docs/history, code comments cite only tracked content"
metadata:
  node_type: memory
  type: project
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-07T05:06:29.957Z
---

Owner decisions, 2026-10-07 (rules written to `.claude/rules/docs-structure.md`
and `.claude/rules/code-comments.md`):

- Specs live in `docs/spec/`, one file per capability, written from behaviour as
  built (code + tests + bench), with stable requirement IDs.
- `project_charter.md` is KEPT, translated to English, moved into `docs/spec/`.
- All other requests leave git: moved to `docs/_retired/` (ignored via
  `.git/info/exclude`) AND removed from git history (owner approved).
- Plans stay in `docs/history/plan/` but must not quote requests verbatim.
- Plan/request phase names appear only in `docs/history/`; CHANGELOG/ADR may link
  plan files as provenance. Domain "phase" (machine states) unaffected.
- Code comments may cite only tracked repo content; ADR allowed as `ADR Dn`.
- New `CHANGELOG.md`; `docs/README.md` "Phase status" moves there.

**Why:** owner wants docs-driven + spec-driven development with readable history.

**How to apply:** measured scope at decision time — ~676 plan-phase refs in 97
code files + ~250 in current-state docs. Trap: code cites plan-local IDs like
`phase 10 D7`; stripping the prefix would leave `D7` pointing at the wrong ADR —
rewrite each comment self-contained. Work module by module, build after each.
Status: DONE 2026-10-07, squashed into the single root commit (now `be838a8`). 13 specs
(602 requirements) in `docs/spec/` + index `docs/spec/README.md`; `CHANGELOG.md`
(dated, no phase numbers); old docs/README "Phase status" moved verbatim to
`docs/history/phase_status.md`; ~2700 comment lines de-phased (comments only —
verified by diff scan, full 32-bit build of all 14 projects, hardware-free suites
green, protocol golden 4/4 + geometry oracle 7/7 byte-identical); 10 phase-named
test functions renamed; uml/ de-phased (mk_sig_10 PNG re-rendered). The spec
writers' open questions and doc-vs-code contradictions are listed in each spec's
§6 — owner decisions, not yet acted on.

Follow-up 2026-10-07 (owner): `docs/backlog.md` created — the ONE prioritised list
of open defects/decisions/doc drift (`BL-nnn`, one line each, pointing at spec §6
detail). Owner: reconfigure the project first; do NOT fix the user manual yet —
manual drift is parked as BL-120..126. Deleted on owner request:
`docs/history/bug_low_power_after_axis_origin.md` and `docs/history/test_outputs/`
(content folded into the laser runbook / DLL reference / backlog), and
`docs/history/technical_debt.md` (open items → backlog, "ruled out" notes → the
backlog's last section). All folded into the single root commit `be838a8`; the
deleted files are no longer in history.
