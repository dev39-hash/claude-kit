---
name: ezd-sdk-docs
description: MarkEzd/LMC1 SDK reference docs live in components/ezdlib — consult them before reasoning about SDK behavior or rc values empirically
metadata: 
  node_type: memory
  type: reference
  originSessionId: 1755aee4-764a-4565-a94a-2f8acdf94b0d
  modified: 2026-08-03T02:34:25.386Z
---

The vendor laser SDK is documented IN-REPO at `components/ezdlib/`:

- `MarkEzd_DLL_Reference.md` — the main reference. **§4 "Status codes
  (`LMC1_ERR_*`)"** is the full rc table (0 SUCCESS, 1 EZCADRUN, 5 HARDVER,
  7 STOPSIGNAL, 8 USERSTOP, 11 NOINITIAL, 12 READFILE, 16 NOTTEXT, 18 NOFINDENT,
  19 STATUE, ...), each row marked as coming from the header or from this
  project's own investigation.
- `MarkEzdDll_API.md` — the API surface.
- `Markezd-example.pdf` — vendor examples.

**Why this matters:** the repo has no `LMC1_ERR_*` enum in `src/`, so grepping the
source for an rc value finds nothing and it is tempting to describe a code
empirically ("rc=8 is the stop status, observed"). Read the reference instead and
name the constant. The owner corrected me on exactly this in the Phase 7 session
(2026-08-03).

Related: [[laser-init-realmode]] (rc=5 HARDVER = sim init with a real board),
[[build-laser-host-gotchas]].
