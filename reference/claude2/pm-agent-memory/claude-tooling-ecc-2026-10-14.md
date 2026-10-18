---
name: claude-tooling-ecc-2026-10-14
description: "Owner 2026-10-14: agent-skills removed; ECC subset + project skills; .claude/CLAUDE.md added; AGENT.md/AGENTS.md untracked (contributor guide + module READMEs); 3 project hooks; code-reviewer agent on Opus via /review-wp."
metadata:
  node_type: memory
  type: project
  originSessionId: a937e601-4db2-40dd-9714-a8499c96b4ab
  modified: 2026-10-14T11:49:46.667Z
---

The project's local `.claude/` (git-ignored; each machine keeps its own) changed twice on 2026-10-14,
both on the owner's decisions. `.claude/TOOLING.md` is the inventory, `.claude/CLAUDE.md` the
entrypoint.

First change (ECC subset):
- addyosmani **agent-skills** (24 skills, 8 commands, agents `code-reviewer`, `security-auditor`,
  `test-engineer`, `web-performance-auditor`), the QML skills and `qt-ui-design` removed. The owner
  later deleted the `_retired_2026-10-14/` copies and the ui-ux-pro-max clone themselves; nothing of them
  is left on disk.
- Skills: `change-impact`, `cpp-coding-standards` (ECC + project addendum), `qmake-msvc-build`,
  `qttest-headless` (project), `qt-cpp-review`, `qt-cpp-docs` (kept). Rules: `cpp-patterns.md`,
  `cpp-security.md` (ECC, adapted).

Second change (after comparing with the image_matching project's `.claude`):
- `.claude/CLAUDE.md` added: role, hard rules, model policy, hooks; it imports
  `docs/rules/contributor_guide.md`.
- Repo commit `6d36a271` (merge `6d6ebd1a`): the root `AGENT.md` became
  `docs/rules/contributor_guide.md`; every module `AGENTS.md` became `README.md`; `.gitignore` lists
  `AGENT.md`, `AGENTS.md`, `CLAUDE.md`; rule `docs/rules/design_rules.md` §11.5; the contract test's
  peer check now requires each shell's `README.md` (301/0, negative check done).
- Hooks in `.claude/settings.json`: `guard-bash.js`, `guard-edit.js`, `sync-memory.js` (Stop, mirrors
  memory into `.claude/pm-agent-memory/`). Tests: `node .claude/hooks/test-guards.js` (78 cases).
- `settings.local.json` cut from 72 one-off entries to a short read-only list (old copy was only in
  the session scratchpad).
- Agents now 6: `wp-implementer`, `wp-reviewer`, `cpp-reviewer`, `silent-failure-hunter`,
  `code-explorer`, and **`code-reviewer` on Opus** (pre-merge review of a WP's whole diff), run by
  `/review-wp`.

**Why:** the owner wanted the web-oriented pack gone, rules enforced by hooks instead of memory, one
tracked set of docs for people and agents, and a stronger reviewer before merges.

**How to apply:**

- Never invoke `using-agent-skills`. Never create `AGENT.md`/`AGENTS.md`/`CLAUDE.md` in the tree.
- Before merging a WP: PM checks the report, then `/review-wp` (code-reviewer, `model: "opus"`), then
  the PM decides. All other sub-agents stay on Sonnet.
- A hook denial or ask is a rule, not an obstacle: never work around it; ask the owner.
- **Next dev→deploy bundle note must say:** agent-skills is gone on dev; `AGENT.md` and the module
  `AGENTS.md` files are renamed (deploy's agent loses its entrypoint when it applies the bundle and
  needs its own `.claude/CLAUDE.md` pointing at the contributor guide); comment-only edits touched
  Phase 10 files (`src/device/plc/modbus/modbus_tcp_{client,server}_device.cpp`,
  `src/matching/pattern_group_manager.cpp`, `src/device/virtual/virtual_device.h`,
  `src/core/auth/admin_credential_provider.h`, `tests/architecture_contract_test/main.cpp`).

See [[shared-working-conventions-with-deploy]], [[pm-agent-memory-mirror]].
