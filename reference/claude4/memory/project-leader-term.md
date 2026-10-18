---
name: project-leader-term
description: "Call the person who decides/reviews/bench-confirms the 'Project Leader', never 'the owner' — in replies, plans, docs, specs and comments"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-07T05:44:39.542Z
---

The user (formerly called "the owner" everywhere) is to be called the
**Project Leader** — in replies, plans, specs, docs, code comments and commit
messages. Requested 2026-10-07; all tracked docs/comments were renamed and the
change folded into the root commit `bff10ed`.

**Why:** the user's explicit request; "owner" was ambiguous next to the many
technical "owner"s in this codebase.

**How to apply:**
- Write "the Project Leader" (capitalised), "Project Leader decision",
  "Project Leader-confirmed on the bench", "Decisions needed from the Project
  Leader". In Vietnamese replies "Project Leader" may be used as is.
- Do NOT rename technical "owner": the `lmc1_Initial` owner window / HWND, the
  host protocol's `owner` init field, `@param owner`, QObject owner, a widget's
  owning parent ("the owner re-reads entry()"), "Owner window is null" (shipped
  string, translated in the .ts).
- Local `.claude/` rules may still say "owner" in places — it means the Project
  Leader.

Related: [[user-role]], [[docs-restructure]].
