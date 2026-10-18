# Repo boundaries: tracked files never point into `.claude/`

`.claude/` is gitignored and exists only on this machine. Anything tracked by git
must stay self-contained, so a fresh clone (or a reader without this machine)
never meets a dangling reference.

## The rule

- **Tracked files must not reference `.claude/` or its contents** — no links,
  paths, file names, or "see the agent/rule/skill/hook X" mentions. This covers
  `docs/**`, `ONBOARD.md`, every `README.md` (root and module scope cards), code
  comments, `.pro`/`.pri`, test scripts, and commit messages. The `.claude/`
  ignore entry lives ONLY in the untracked `.git/info/exclude` — never add it to
  `.gitignore`.
- **Tracked files must not reference the Claude memory folders** (the user-level
  auto-memory or its backup in `.claude/memory`).
- **Docs point only inside the tracked repo.** A doc may link to other tracked
  docs, source files, and tests — nothing under `.claude/` and no machine-local
  path that a clone would not have.
- **Do not copy `.claude/` content into tracked files** to work around the rule.
  If something in a `.claude/` rule matters for the project, write it into the
  owning tracked doc in its own words — after the owner agrees, since tracked
  docs are the project's record.
- The reverse direction is allowed: `.claude/` files may point at tracked docs.
  Prefer a pointer over restating a tracked doc, so the two cannot drift.

## Before finishing an edit to a tracked file

Check the diff for `.claude` or `memory` paths; remove any that slipped in.
