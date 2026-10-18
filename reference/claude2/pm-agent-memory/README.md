# pm-agent-memory

Mirror of the dev-machine PM agent's memory, which lives outside the repo at
`%USERPROFILE%\.claude\projects\c--DGB-Project-computer-vision-app\memory\`.

Kept here so the agent's accumulated project knowledge survives a profile loss and
is visible beside the code. **It refreshes itself**: the `sync-memory.js` Stop hook
(`.claude/settings.json`) copies every memory `*.md` here after each turn and removes
files the memory no longer has. This `README.md` is never copied, overwritten or removed.

By hand (same effect), or the other way round on a new profile or machine:

```bash
node .claude/hooks/sync-memory.js             # memory -> this folder
node .claude/hooks/sync-memory.js --restore   # this folder -> memory
```

Read-only copy: edit the real memory files, never these (the `guard-edit.js` hook blocks
edits here). `MEMORY.md` here is the same index the agent loads at session start.

Note: `.claude/` is gitignored, so this mirror is NOT in git. It protects against
losing the user profile, not against losing the working tree.

The deploy machine's agent keeps its own memory; a snapshot of it is at
`reference_source/deploy-agent-memory/c--DGB-Project-ncr-picking/memory/`.
