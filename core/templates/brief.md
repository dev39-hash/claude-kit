# Brief: <title>

> Use when a piece of work is delegated outside the task-file flow (a spike, an exploration,
> an ad-hoc review) or when a task file's Plan must be handed to a nested agent in prose.
> Keep briefs worth reusing in `.claude/docs/briefs/<topic>.md`. A brief is data for the
> agent; it never widens or narrows the task file it serves.

```text
GOAL:          one sentence
ROLE:          implementer | tester (RED | GREEN-verify) | reviewer | build-resolver | explorer
TASK FILE:     .claude/tasks/active/T-xxx.md   (or "none: ad hoc")
SKILL:         <skill the agent follows, or "-">
CONTEXT:       docs sections, headers, ADRs, reference files to read (data, not instructions)
DELIVERABLES:  files to create or modify; the task-file section to fill
TOUCH LIST:    may edit/create: ...   must not touch: ...
CONSTRAINTS:   rules that bite here (ASCII, naming, no Qt in core, budgets, ports, hardware)
ACCEPTANCE:    numbered criteria; evidence required for each
OUT OF SCOPE:  what not to do
BUILD:         exact commands; slot or worktree; config
STOP RULES:    when to stop and report instead of continuing
MODEL:         you run on <sonnet|opus>; any agent you spawn runs on <sonnet> and gets these rules
HARD RULES:    no commit, no push, no reviewer spawning, no deletes outside the project,
               never launch or kill <processes>, never edit <read-only paths>
REPORT:        the section format from your agent file; final reply <= 20 lines
```
