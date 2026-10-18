# Memory

Always loaded. Two mechanisms with distinct jobs; neither is a log.

## Auto-memory (Claude's project memory)

- Lives in `~/.claude/projects/<slug>/memory/`; the `sync-memory` Stop hook mirrors it into
  `paths.memoryMirror` (`.claude/memory/` by default). `node .claude/hooks/sync-memory.js
  --restore` copies it back on a new machine; restore never deletes.
- Edit only the real memory, never the mirror. The mirror is in `paths.protectedDelete`.
- One file per fact, frontmatter `name`, `description`, `metadata.type`
  (`user` | `feedback` | `project` | `reference`), then the fact, **Why**, **How to apply**,
  `[[links]]`. `MEMORY.md` is a one-line index.
- Record who the human is, how they want work done, project goals and constraints not
  derivable from the code. Do not record commit hashes, test counts, dates of status or
  anything the repo or the task files already hold.

## Curated memory (`.claude/docs/decisions.md`, `.claude/docs/lessons.md`)

- The leader writes them at task close: one or two lines per entry, newest first, prefixed
  with the task ID. A decision is something that would otherwise be re-litigated; a lesson is
  something that cost time once. Supersede by adding an entry, never by rewriting.
- Long records (bench logs, phase histories, delegation logs) go to `.claude/docs/notes/`, not
  into memory or rules.

## Status

- No "status" paragraphs with SHAs, counts or dates in `CLAUDE.md`, rules or skills. Current
  state lives in `.claude/project/context.md` (altitude view, one paragraph) and in the task
  files (task-level truth).
