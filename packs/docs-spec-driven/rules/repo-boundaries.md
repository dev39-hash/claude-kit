# Repo boundaries: tracked files never point into `.claude/` (pack docs-spec-driven)

Always loaded when the pack is installed. Sharpens core rule `02-repo-hygiene.md` for a
repository that carries its own specs, decisions, backlog and plan history: because so
much is tracked, the line between the project's record and the agent's workspace must be
exact. A fresh clone, or a reader without this machine, never meets a dangling reference.

## The rule

- Tracked files never reference `.claude/` or its contents: no links, paths, file names,
  or "see the rule / skill / hook / agent X". This covers `docs/**`, every `README.md`,
  code comments, build files, test scripts, and commit messages.
- Tracked files never reference the Claude memory folders (the user-level memory or its
  mirror under `.claude/`).
- Tracked files never carry the vocabulary of the agent workspace: agent, sub agent, model
  names, session, task file, brief, work package, gate. A plan under `docs/history/` says
  what was decided and done, not who or what did it.
- Docs point only inside the tracked repo: other tracked docs, source files, tests. No
  untracked folder, no absolute path a clone would not have.
- Never copy `.claude/` content into a tracked file to work around the rule. If something
  in a kit rule matters for the project, write it into the owning tracked doc in the
  project's own words, after the human agrees, because tracked docs are the project's
  record.
- The reverse direction is allowed and preferred: `.claude/` files point at tracked docs
  instead of restating them, so the two cannot drift.
- `.claude/` stays out of the repo through the machine's global gitignore or
  `.git/info/exclude`, never through the tracked `.gitignore`.

## Before finishing an edit to a tracked file

Check the diff for `.claude`, `memory`, agent or model names, phase names and absolute
paths; remove any that slipped in. `/docs-gate --changed` does the mechanical part.
