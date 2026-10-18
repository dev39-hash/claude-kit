# Repository and documentation hygiene

Always loaded. The `guard-edit` hook enforces the file-name rules.

- The repository holds **user documentation only**: `README.md` files and `docs/` say what the
  project is and how to use, build and test it. Tracked text never mentions AI, agents, Claude,
  plans, briefs, work packages, phases, decision-record numbers, owners or people's roles.
- Never create `CLAUDE.md`, `AGENTS.md` or `AGENT.md` anywhere in the tree. Instructions live
  in `.claude/CLAUDE.md` and `.claude/rules/`; plans, ADRs, briefs and notes in
  `.claude/docs/{plan,adr,briefs,notes}/`; task files in `.claude/tasks/`.
- `.claude/` stays out of the repo through the machine's global gitignore or
  `.git/info/exclude`, never through the repo `.gitignore`.
- Docs are self-contained: no links to `.claude/`, to untracked folders or to absolute paths.
  `.claude/` may point at tracked docs; tracked docs never point back.
- One fact lives in one place; other documents point to it. Docs describe the current state,
  not history. One `README.md` per module; `CHANGELOG.md` at the root when the project has
  versions.
- An ADR (`.claude/docs/adr/`, skill `architecture-decision-records`) is required for a change
  to a public API, a contract, a schema, a wire format, or a new dependency; the project file
  `.claude/project/rules.md` may add triggers.
- No machine-specific paths, credentials or secrets in tracked files. Machine paths live in an
  untracked local file the build reads (for example `qmake/local.pri`, a CMake cache variable).
- Cite symbols and section headings in committed text, never line numbers.
- Files copied from third-party packs keep their licence file and name their source in a
  comment.
- Before finishing an edit to a tracked file, check the diff for `.claude`, `memory`, agent
  names, phase names and absolute paths.
