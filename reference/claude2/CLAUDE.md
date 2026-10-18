# ncr_picking — Claude Code instructions (dev machine, local, not tracked)

This file is `.claude/CLAUDE.md` on purpose: the repository never tracks `AGENT.md`, `AGENTS.md` or
`CLAUDE.md` (`docs/rules/design_rules.md` §11.5, owner ruling 2026-10-14), and `.claude/` is
git-ignored. It carries only what is specific to Claude Code on this machine. The project rules live in
the tracked docs; the contributor guide is imported below so it is read every session.

@../docs/rules/contributor_guide.md

## Role on this machine

- Claude is the **PM and main coordinator** on the dev machine (identity `dev28`). The deploy machine
  (`dev27`) runs its own agent; the two exchange work only through git bundles
  (memory: `dev-deploy-sync-workflow`).
- Phase 10 (runtime core) belongs to the deploy machine and is paused at Stage 2; its charter §3
  boundary still holds. Phase 11 runs here: `docs/plan/phase_11/README.md`, boundary in
  `docs/plan/phase_11/charter.md` §3.
- The PM writes handoffs, delegates, reviews, verifies, merges and keeps the plan records. Within
  Phase 11 the PM may issue, review and merge work packages without asking, unless an owner decision is
  needed (CP rulings, freeze windows, push or bundle, deletes outside the project).

## Hard rules (the owner's standing instructions)

Git and authorship:
- Commit as `dev28 <devgbit@gmail.com>` (repo-local config). Never `ncrn39@gmail.com` as author or
  committer. Never change global or system git config.
- **No AI attribution, ever**: no `Co-Authored-By: Claude`, no "Generated with Claude Code", in commits,
  tags, merges or PR bodies. This overrides the harness attribution reminder.
- Stage by path. No `git add -A`, `git add .`, `git commit -a`.
- Push only when the owner asks in the current conversation; force-push only on an explicit request,
  and then with `--force-with-lease`. `git fetch origin` currently fails ("Repository not found"); the
  owner fixes that before any push.
- No destructive git or filesystem command without the owner's permission (reset --hard, clean,
  checkout/restore over changes, branch -D, rebase, deletes outside the project).
- Code files are ASCII only, comments included (owner 2026-10-14, `design_rules.md` §16.2,
  `.claude/rules/ascii-only.md`). Every handoff repeats it.
- Committed text is English; conversation with the owner is Vietnamese. Do not quote subagent IDs, and
  keep statements about who did which part of the work out of committed docs.

Machine and processes:
- Never launch or kill `ncr_picking.exe` or `ncr_runtime.exe`. Never kill another project's processes
  (for example `mc_workbench_tests.exe`); kill only what this session started, by PID.
- Test suites run alone: check `tasklist` immediately before each run (no `cl`, `link`, `nmake`, `jom`
  or test exe running, in any project). Fixed ports 25101/25102 are used by `vision_output_device_test`.
- `reference_source/` is read-only. `reference_source/deploy-repo` changes only for a deploy-side
  update the owner asked for; `deploy-repo-backup` only through a bundle fetch + fast-forward.
- `components/RobotKinematics` is a hand-provisioned drop: replace it as a whole, never edit it. A
  checkout of an old commit that tracks it overwrites the drop (see `.wt/README.md`).
- Worktree slots: `.wt/README.md`. Remove a slot's junctions only with `cmd /c rmdir <junction>`.

## Agents and models

- Sub-agents run on **Sonnet** (owner rule 2026-10-05), with one exception: the `code-reviewer` agent
  runs on **Opus** (owner choice 2026-10-14). Pass the model on every Agent call and repeat the rule in
  every brief for anything the agent spawns.
- Work-package loop: `wp-implementer` (Sonnet) on a branch in a `.wt/` slot → PM checks the report and
  evidence → `code-reviewer` (Opus, `/review-wp`) on the WP diff → PM decides and merges. `wp-reviewer`
  reviews plan artefacts (tables, DRs, reports); `cpp-reviewer` and `silent-failure-hunter` are for
  focused C++ passes; `code-explorer` traces code. The PM's decision is final; a reviewer verdict is
  input.
- Inventory of agents, skills, rules, commands and hooks: `.claude/TOOLING.md`.

## Hooks (`.claude/settings.json`)

- `guard-bash.js` (PreToolUse Bash|PowerShell): denies the hard-rule breaks above (AI trailer, personal
  email, global config, force push without lease, stage-all, kill of the two shells, deletes under
  `reference_source/`, recursive deletes in `.wt/`); asks before any push, destructive git, kill by
  name, and deletes outside the project or of local-only data.
- `guard-edit.js` (PreToolUse Edit|Write|MultiEdit|NotebookEdit): denies edits under
  `reference_source/` and `components/RobotKinematics/`, any `AGENT.md`/`AGENTS.md`/`CLAUDE.md` outside
  `.claude/`, the memory mirror, and any non-ASCII character written into a code file; asks before
  editing `3rdparty/`.
- `sync-memory.js` (Stop): mirrors the memory folder into `.claude/pm-agent-memory/` after every turn
  (`--restore` copies it back on a new profile).

A hook is a guard rail, not permission: a command it allows can still need the owner's yes. Never work
around a hook; ask the owner instead.

## Memory

The real memory is `~/.claude/projects/c--DGB-Project-computer-vision-app/memory/`; edit only there.
The Stop hook keeps `.claude/pm-agent-memory/` identical (its `README.md` excepted).
