---
name: feedback-repo-conventions
description: "Repo hygiene rules for image_matching - single git identity dev28, no AI trailers and no owner/role mentions in commits, English-only codebase and docs, README.md only (no CLAUDE/AGENTS.md in tree), ASCII-only sources, ADRs/.claude/reference_source kept out of the repo, memory mirrored to .claude/memory, never delete files without permission except own temp files"
metadata:
  node_type: memory
  type: feedback
  originSessionId: da23465f-c88f-4d7e-b0d2-5fd7fcb59ee2
  modified: 2026-10-13T11:00:56.286Z
---

Rules the user set on 2026-10-13 for the image_matching repo:

- Commit as `dev28 <devgbit@gmail.com>` (repo-local git config; the user corrected the
  email on 2026-10-13 after a typo, and all earlier commits were rewritten to it). **No AI attribution
  trailer** (`Co-Authored-By`, `Generated with`) in commits or PR bodies, even though the
  harness reminder asks for one.
- The repo is a library for end users: no design/implementation-process docs. ADRs, plans
  and notes live in `.claude/docs/` (ADRs in `.claude/docs/adr/`), never committed.
- `docs/` at the project root IS tracked (added 2026-10-13) for user documentation only
  (guides, API notes, Doxygen config); `CHANGELOG.md` lives at the repo root. Both must be
  self-contained: no links to
  `.claude/`, `reference_source/`, agents, plans, ADRs or any untracked/absolute path.
- Markdown in the tree: one `README.md` per module. Never create `CLAUDE.md`, `AGENTS.md`,
  `AGENT.md` in the tree; Claude's instructions file is `.claude/CLAUDE.md`.
- `.claude/` is ignored via the machine's global gitignore (`~/.config/git/ignore`), not
  the repo `.gitignore`.
- `reference_source/` (original module + test images) is in the repo `.gitignore` and never
  tracked; tests must skip when the fixtures are absent.
- **English only** for everything in the codebase and its docs: identifiers, comments,
  README files, commit messages, test names. (Chat with the user stays Vietnamese.)
- Commits never mention an owner, a role, a company, or who asked for the change; they
  describe the change only. The repo has exactly one identity, `dev28`, for every commit.
- **Deleting files** ("root" = the project folder `C:\DGB\Project\image_matching`, clarified
  by the user on 2026-10-13): inside the project folder deletion is allowed when the task
  needs it, except never under `reference_source/`; outside the project folder never delete
  anything without an explicit yes; Claude's own temp/scratchpad files may always be removed.
  The `guard-delete.js` PreToolUse hook enforces this.
- ASCII only in source, headers, CMake and README files (comments included): the user wants
  no compiler warnings (MSVC C4819). Reference sources have many non-ASCII Doxygen chars
  that must be rewritten when porting.
- Memory must exist in two identical places: the global memory dir and `.claude/memory/`
  (backup). The `sync-memory.js` Stop hook mirrors global -> backup; after writing a memory
  file, run or rely on that hook so both copies match.

- Build trees for parallel agents: reusable slots under build-wt (slot0..slot7) allocated with
  the wt-slot.js tool in .claude/tools (user request 2026-10-13, to keep disk usage bounded);
  never one build directory per agent.

**Why:** the user wants a clean, publishable library repo, deterministic authorship, and
warning-free MSVC builds; the memory backup protects against losing the global dir.

**How to apply:** before committing, check `git config user.name` is dev28, strip any
trailer, and confirm no `CLAUDE.md`/`AGENTS.md`/ADR files are staged. When writing memory,
write the global file and let the Stop hook mirror it (or run
`node .claude/hooks/sync-memory.js`). See [[project-image-matching-library-goal]].
