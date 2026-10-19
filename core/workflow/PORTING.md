# Porting the kit to a project

The generic layer is copied verbatim; only the project layer is written fresh. `install.js`
does steps 1-3; the rest is by hand.

1. **Install the generic layer.**
   `node <kit>/install.js --target <project root> --packs <pack,pack>`
   - copies `core/` and the chosen `packs/` into `<project>/.claude/`;
   - activates them: rules into `.claude/rules/`, agents into `.claude/agents/`, skills into
     `.claude/skills/`, commands into `.claude/commands/`, hooks into `.claude/hooks/`;
   - writes `.claude/settings.json` (hooks use `$CLAUDE_PROJECT_DIR`, never an absolute path);
   - writes `.claude/kit.config.json` from `kit.config.schema.json` defaults;
   - creates `.claude/project/` from the five templates, `.claude/docs/{plan,adr,briefs,notes}`,
     `.claude/docs/decisions.md`, `lessons.md`, `.claude/tasks/{active,done}`,
     `.claude/memory/`;
   - writes `.claude/CLAUDE.md` from `core/CLAUDE.template.md`.
   Never edit anything under `.claude/core/` or `.claude/packs/` inside a project;
   improvements go back to the kit and are re-installed with `--update`, which rewrites only
   those two folders and the activated copies, removes activated files the kit no longer
   ships (tracked in `.claude/kit.manifest.json`), and keeps `kit.config.json`, `project/`,
   `docs/`, `tasks/`, `CLAUDE.md` and any custom entries in `settings.json`.
   Other flags: `--dry-run` (print the plan), `--name <project>`, `--add-exclude` (append
   `.claude/` to `.git/info/exclude` when it is not ignored), `--test` (run the hook tests
   afterwards), `--force` (also rewrite `CLAUDE.md` and `settings.json`), `--list-packs`.
   A machine without Node takes the `hooks-powershell` pack: install from a machine with
   Node (or copy the generated `.claude/`), and the PowerShell twins of the guards are wired
   instead of the Node hooks (`packs/hooks-powershell/README.md`).

2. **Fill `kit.config.json`.** Identity and denied emails, protected / read-only / local-only
   paths, process names, ASCII extensions and exemptions, build slots and toolchain, models,
   gates, commit cadence, packs.

3. **Fill the project layer** (`.claude/project/`):
   - `context.md` - what the project is, key documents, how to build and test, layout in ten
     lines, current state (under two screens);
   - `rules.md` - hard rules: identity, boundaries, gate delegations, conventions the reviewer
     enforces, ADR triggers, anything that overrides core;
   - `task-classification.md` - start from the defaults, add project classes;
   - `definition-of-done.md` - the checklist Gate 2 uses;
   - `build-env.md` - this machine's proven commands and gotchas.
   Facts copied from old notes (test totals, skip counts, timings, which environment
   variables exist) are marked "unverified" until a run in this session shows them: the
   image_matching retrofit carried a wrong per-configuration total (687 / 775 / 687; every
   configuration ran 775) and an `OpenCV_DIR` user variable that did not exist. Read an
   environment variable back with its name printed next to the value; take totals from
   `ctest -N` on a fresh build.
   A configure argument that names the project path uses `${sourceDir}`, a per-machine
   directory `$env{NAME}` (pack cpp-cmake-gtest), so moving the tree needs no config edit.
   `install.js --update` warns when a path sits in two lists that contradict each other.

4. **Wire the memory and the leader.** Make sure `.claude/` is ignored through the global
   gitignore or `.git/info/exclude`. Edit the generated `CLAUDE.md`: read-first list, build
   commands, enabled packs (10-20 lines of project text, no status paragraphs).

5. **Test the hooks.** `node .claude/hooks/test-hooks.js` must report 0 failures. Add a case
   for every project-specific rule you put into `kit.config.json`. Check the real config with
   `node .claude/hooks/probe.js --batch <cases.txt>` (and `--mode auto` when the project runs
   in auto mode): it prints each decision and runs nothing. Never prove a deny or an ask by
   running the real command: the guards fail open, and in auto mode an ask is not a prompt.

6. **Dry-run one small real task** end to end (plan -> gates -> done) before trusting the
   setup. Watch that each sub agent actually read the project layer: its section in the task
   file shows whether it followed the project commands.

Checklist of what is generic vs project:

| Generic (copy, never edit per project) | Project (write fresh) |
|---|---|
| `core/` and `packs/` (rules, workflow, roles, agents, skills, commands, hooks, templates) | `kit.config.json`, `project/*.md` |
| `CLAUDE.template.md` skeleton | the project lines in `CLAUDE.md` |
| hook scripts | hook test cases for project rules |
| templates | `docs/`, `tasks/`, `memory/` (live) |
