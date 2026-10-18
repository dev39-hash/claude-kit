---
name: git-commit-identity-no-ai-trailer
description: Commits in mc_protocol are authored as dev28 <devgbit@gmail.com>; no commit and no PR ever carries a Co-Authored-By trailer or any AI attribution
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1c0df7ef-a9b5-4ce3-8147-5a3bd661ce36
  modified: 2026-09-26T09:33:35.398Z
---

In the mc_protocol repository every commit is authored as **dev28 <devgbit@gmail.com>** (set in the repo-local git config on 2026-09-26; the global identity `DGB` is left untouched), and a commit message **never** contains a `Co-Authored-By:` trailer or any other AI attribution line, including the one Claude Code's default attribution reminder asks for. This owner instruction overrides that reminder.

**Why:** the owner decided it on 2026-09-26 when making the first commit (`0b287cc`).

**How to apply:** before committing, check `git config --local user.name` is `dev28`; if a fresh clone lacks it, set it (or use `--author "dev28 <devgbit@gmail.com>"`). Write the message with no trailer and verify with `git log -1 --format=%B`. Still commit only when the owner asks — except under an explicit owner delegation recorded in `agent-team/project/rules.md` (2026-09-27: leader may commit T-003–T-005 and Phases 1–2 itself). No trailer applies under delegation too. **Pull requests too** (owner, 2026-09-26): no "Generated with Claude Code" line, no Co-Authored-By, no AI attribution anywhere in a PR title or description. Related: [[memory-dual-copy-sync]].
