---
name: shared-working-conventions-with-deploy
description: "The dev machine adopts the working conventions already set up on the deploy machine (dev27): Sonnet subagents, skills invoked explicitly, the Phase 10 contract-first WP loop and its evidence rules."
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-14T11:49:49.371Z
  originSessionId: a937e601-4db2-40dd-9714-a8499c96b4ab
---

User instruction 2026-09-21: the two machines run **one** working method, and the
deploy machine's is the one already agreed — so adopt it here rather than inventing
a dev-side variant. Read from the deploy agent's own memory, snapshotted at
`reference_source/deploy-agent-memory/c--DGB-Project-ncr-picking/memory/`.

- **Subagents run on Sonnet — including the ones a subagent spawns.** Standing since
  2026-09-18 (was Opus on 2026-09-16). Pass `model: "sonnet"` explicitly on every
  `Agent` call and on `agent()` options in a `Workflow`; an invocation `model`
  overrides frontmatter. Effort (`xhigh`) can only come from the agent definition
  file, never from the call.
  **The rule does not inherit by itself (user, 2026-09-21):** a subagent I start on
  Sonnet will still reach for Opus when *it* spawns a subagent, because my `model`
  choice applies to that one call, not to its descendants. So **write the constraint
  into the subagent's prompt** — e.g. "any agent you spawn must also run on Sonnet:
  pass model: 'sonnet'" — and carry that sentence forward at every level, so it
  propagates down the whole tree instead of stopping at depth 1.
- **SUPERSEDED on dev 2026-10-14** (see [[claude-tooling-ecc-2026-10-14]]): `using-agent-skills` and the agent-skills pack are removed on dev; use the project skills instead. (earlier:) **Invoke skills, don't recall them.** For any non-trivial task call
  `Skill(using-agent-skills)` first and follow its routing. The owner caught this on
  2026-09-07. Then surface assumptions and present a genuine fork *before* writing
  code, not after.
- **Contract-first loop** for runtime work: PQ card → DR → state/transition tables →
  table tests → pure core → 3-ring verify. Plan of record is
  `docs/plan/phase_10/README.md`; the Vietnamese working copies live in `temp_docs/`
  and must not drift from it.
- **Work packages.** One branch and one commit per WP, a tag per checkpoint. A handoff
  carries the whole specification (Accepted DR, disjoint touch-list, acceptance
  criteria, stop rules, facts the PM already verified) so the implementer executes a
  design instead of re-deriving one. Reports are evidence-based, in `reports/`.
- **Evidence rules learned the hard way, do not relearn them:**
  a negative check must *name* the test expected to go red and say why that test can
  see the change (twice a handoff prescribed a check that could not fail); verify a
  symbol exists before naming it in a handoff (`LOG_DEV_WARN` did not); QTest counts
  `initTestCase` + `cleanupTestCase` in the pass total, so **159 = 157 + 2 is correct
  — never let an agent "fix" it to 158**.
- **Ask the owner about the cell, don't infer it.** The production cell is an **MC**
  protocol PLC the app polls, whose master writes `nActiveCamera` /
  `nActivePatternGroup` only on change — not a Modbus server. A design agent assumed
  Modbus in 2026-09-18 and was wrong.
- **CURRENT exception (owner, 2026-10-14):** the `code-reviewer` agent runs on **Opus** (`/review-wp`,
  pre-merge review of a WP's whole diff). Everything below still holds for every other agent; the PM
  still decides the merge. See [[claude-tooling-ecc-2026-10-14]].
- **CURRENT (owner, 2026-10-05): "Từ lần gọi các sub agent tiếp theo hãy gọi sonnet 5.5 thay vì opus".**
  Every subagent from now on, Phase 11 implementers included, runs on **Sonnet 5.5**: pass
  `model: 'sonnet'` on every Agent call, and write into each prompt that any agent it spawns also runs on
  Sonnet. The PM still reviews Phase 11 packages directly, with no `wp-reviewer`, and the prompt says
  "do not start a reviewer agent". Agents already running on Opus when this was said (WP-03 v2, WP-03c,
  WP-04) finish as they are.
- (superseded 2026-10-05, model only) **For Phase 11 from WP-03b's successor on (owner, 2026-10-04, late):** "ở các task tiếp theo
  trong phase 11 bạn hãy gọi implementer opus5.5 bạn sẽ trực tiếp review mà không gọi reviewer". So
  from now on, Phase 11 implementers are `wp-implementer` with **`model: 'opus'`** (Opus 5.5). Pass it
  on the call, because it overrides the file's `sonnet` frontmatter. Any agent an implementer spawns
  uses the same model. **No `wp-reviewer`.** The PM reviews directly: open every changed file, re-run
  the checks, cross-check the touch-list, and try a negative check where doubt remains. WP-03b, already
  running on Sonnet when this was said, finishes as it is; the PM reviews it directly. The
  Sonnet-everywhere rule below still holds for Phase 10 and for any agent that is not a Phase 11
  implementer.
- (earlier) **Phase 11 WPs are delegated exactly as the workflow says (owner, 2026-10-04):** a fresh
  `wp-implementer` subagent implements each package, a fresh `wp-reviewer` subagent reviews it, and
  both run on **Sonnet** (`model: 'sonnet'`, currently Sonnet 5.5). The PM — this session — writes and
  commits the handoff first, gives the implementer the issuing commit's SHA, then reviews and merges.
  WP-02 and the stopped WP-03 were done by the PM directly; that was a deviation, not the method.
  The agent files were adapted on 2026-10-04 for the dev machine: `git` on PATH, `main` not
  `master`, any phase, and the `using-agent-skills` skill only if it is installed (it is not on dev).
  Every agent prompt carries: no Co-Authored-By, never kill the shells, stage by path, nested agents
  on Sonnet.
- `wp-implementer` and `wp-reviewer` agent types exist on this machine too — the
  definitions are at `.claude/agents/` (verified 2026-09-21) and they are the
  intended delegation path for a WP. Nothing under `.claude/` is tracked in git,
  so those definitions do not travel in a bundle; each machine keeps its own.
- **Build and verify** the way the deploy side does: build BOTH shells through the
  umbrella `ncr_picking_all.pro` in one directory (`build\all\<config>`), never
  `ncr_picking.pro` alone — that links the editor shell and silently leaves
  `ncr_runtime.exe` stale. Re-run `qmake` before `nmake` every time. The failure
  modes the repo docs omit are in [[build-gotchas-not-in-repo-docs]].

- **WP-27 was implemented on deploy and merged (`5d449dd4`, 2026-09-28), with WP-28, WP-29 and WP-30 after it** (merged `0e9a884d`, `e2930841`, `8db77020`; all four arrived on dev 2026-10-02 in one 29-commit bundle). The owner assigned WP-27 to dev on 2026-09-25 and reversed that a day later. **Keep the lesson:** which machine implements a work package is the owner's call and can change after the handoff is written, so **do not open a branch for a package until the owner has confirmed the side**, and read a handoff's slot/build section as advice about an environment rather than as the assignment. Nothing tracked in git recorded either assignment, which is why the reversal cost nothing — keep work-split statements out of committed docs.
- **The "report it unnumbered, the owning side numbers it" convention works — proven 2026-09-28.** Dev's unnumbered flake report became **backlog item 84**, the deploy PM ruled it **test-only** (not a hole in DR-0015 rule 7) after reproducing it under a CPU-load harness (4 failures in 20 loaded, 0 in 30 idle), and fixed it in WP-27's **first** commit so WP-27's own verification could not be confused by it. Dev's report is cited by number in the item. Do this again: state both readings, name no number, say who rules.
- `phase10-cp1` was tagged on dev (annotated, dev28) at `3668c32a` on 2026-09-25 at the owner's
  request, although Checkpoint 1 actually closed on 2026-09-23. Checkpoint tags here are
  annotated and carry a paragraph of why.

**Why:** the deploy side is where the Phase 10 process was designed and paid for in
review cycles. Two divergent methods across two machines would show up as
contradictory WP reports and a plan of record nobody trusts.

**How to apply:** treat the snapshot as authoritative on *method*, not on *git*.
It is dated 2026-09-18 and its git notes are stale — `git-not-runnable-on-this-machine`
and `dev-snapshot-merges` describe branch `master`, no remotes and folder snapshots,
all superseded on 2026-09-20 by the shared-history bundle topology in
[[two-machine-git-topology-and-identities]] and [[dev-deploy-sync-workflow]].
Conversation is Vietnamese; code, comments and committed docs stay English.
Mirror every memory edit into the repo as [[pm-agent-memory-mirror]] requires.
