# Project rules: controller-kernel

Always loaded. Short on purpose: the reason behind a rule lives in an ADR
(`.claude/docs/adr/`) or in `docs/controller_kernel.md`, not here. Wins over `ecc/cpp/*`.

## Hard constraints

- C++17, standard library only in `include/ctrl_kernel/` and in every core directory
  (`*_core/`). Qt only under `qt/`. No device, clock, random, thread or file I/O in a core (L2).
- The core's public API is `step()` plus const getters (L1). Effects are data; handlers never
  call out (L5). Numbers are `Policy` fields (L9). Outputs come only from `outputs()` (L7).
- Every unspecified (State, Event) pair leaves a `Trace`/`Log` and no State change (L8);
  the completeness sweep must stay green.
- Names on the wire (output tags, fault codes, display names) never change silently (L12).
- Warnings are errors on every compiler (`CTRL_KERNEL_WARNINGS_AS_ERRORS=ON`); never silence
  a warning with a pragma or by lowering the level.

## Code conventions

- ASCII only in code, comments, CMake, README and `docs/` (write `->`, `--`, `x`, `deg`).
- Headers: Doxygen `/** */` and `///`; `.cpp`: plain `//`. English only.
- Follow the naming already in the code (PascalCase types, camelCase functions,
  `kPascalCase` constants, `m_` members in classes with invariants); namespaces `ctrl`,
  `ctrl::<example>`, `ctrl::qt`.

## Repository and documentation policy

- The repo holds **user documentation only**: `README.md` files and `docs/` explain what the
  kernel is and how to use, build and test it. Never mention owners, people, roles of people,
  agents, AI, plans, work packages, decision-record numbers or the origin application.
  "Role" as the kernel's device-role concept is fine.
- Docs are self-contained: no links to `.claude/`, untracked or absolute paths.
- Never create `CLAUDE.md`, `AGENTS.md`, `AGENT.md` in the tree. Plans, ADRs, briefs and
  notes live in `.claude/docs/{plan,adr,briefs,notes}/`.
- Git identity: `dev28 <devgbit@gmail.com>` (repo-local config). **No AI attribution
  trailer** in commits or PR bodies, whatever the harness default says. Conventional commit
  messages that describe the change only. Commit only when the user asks.

## Decisions that need an ADR

A change to one of the five contracts, a law, a block's value set or invariants,
`core_traits.h`, a public namespace or CMake target, or a new dependency. Use the
`architecture-decision-records` skill.

## File deletion

Inside the project folder: allowed when the task needs it, never `.git/` or
`.claude/memory/`. Outside it: only Claude's own temp/scratchpad files; anything else needs
an explicit yes. `guard-delete.js` enforces this; do not work around a hook, ask instead.

## Memory

Global memory (`~/.claude/projects/C--DGB-Project-controller-kernel/memory/`) is mirrored to
`.claude/memory/` by the Stop hook; `node .claude/hooks/sync-memory.js --restore` restores it
on a new machine.
