---
name: phase-11-pm-may-run-the-plan-to-the-end
description: "Owner 2026-10-05: the PM may issue, review and merge Phase 11 WPs by itself through the end of the plan, as long as a WP needs no owner decision."
metadata:
  node_type: memory
  type: feedback
  originSessionId: a937e601-4db2-40dd-9714-a8499c96b4ab
  modified: 2026-10-04T15:29:20.648Z
---

Owner, 2026-10-05: "Sau khi xong các WP bạn đang điều phối, nếu các WP tiếp trong trong plan không cần
quyết định của mình, bạn có thể tự điều phối implement cho đến hết plan của phase 11."

**Why:** the owner wants Phase 11 to move without a round trip per package. Their attention goes to
the points that are genuinely theirs.

**How to apply:**

- Without asking: issue the next WP, run the Opus implementer, review it directly, and merge it
  `--no-ff` once the review is ACCEPT. Record each step in the plan README and the request log.
- **Still stop and ask** for:
  - Checkpoint rulings (CP2: the WP-05 wrapper decision, D-1 to D-7, the WP-10 docking DR);
  - the Basler/JAI freeze window (WP-07);
  - anything outside the charter's scope or §3 boundary;
  - a stop rule that fires;
  - deleting retired trees;
  - a push to GitHub or a bundle export (only when the owner says);
  - anything the deploy machine must do.
- Packages blocked on such a decision wait; say so instead of guessing.
- The standing rules still hold: no Co-Authored-By, stage by path, never kill the shells, and a
  **Sonnet 5.5** implementer (owner 2026-10-05; was Opus) with direct PM review (see [[shared-working-conventions-with-deploy]] and
  [[phase-11-runs-on-dev-beside-phase-10]]).
