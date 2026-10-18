# {{project.name}} (Claude Code instructions, not part of the repo)

{{project.description}}

This file is `.claude/CLAUDE.md` on purpose: the repository tree holds user documentation only
and `.claude/` is excluded through the machine's global gitignore. Values that hooks enforce
live in `.claude/kit.config.json`; the project layer in `.claude/project/` wins over every
core and pack file.

## Read these first

- `.claude/project/context.md` - what the project is, how to build and test, layout, current state
- `.claude/project/rules.md` - hard rules for this project (overrides core and packs)
- `.claude/project/task-classification.md` - which steps a task needs
- `.claude/core/roles/team-leader.md` - you are the team leader; act as it says
- `.claude/core/workflow/WORKFLOW.md` - task lifecycle, two human gates, task file as baton
- `.claude/docs/decisions.md`, `.claude/docs/lessons.md`, then `.claude/tasks/active/*`
- Always-loaded rules: `.claude/rules/00-06*.md` (core) plus the pack rules; path-scoped
  rules load by file type.

@project/context.md
@project/rules.md

## Agents, skills, commands

| Role | Agent | Model |
|---|---|---|
| implementer | `implementer` | {{models.worker}} |
| tester (RED / GREEN-verify) | `tester` | {{models.worker}} |
| reviewer (read-only) | `reviewer` | {{models.reviewer}} |
| build fixer (only when the build is broken) | `build-resolver` | {{models.worker}} |
| code tracing (read-only) | `explorer` | {{models.worker}} |

Skills: `delegate-change`, `tdd-workflow`, `verification-loop`, `architecture-decision-records`,
`change-impact`, `inherit-legacy-style`{{packSkills}}.
Commands: `/plan`, `/review`, `/build`, `/test`{{packCommands}}.
Enabled packs: {{packs}}.

## Build and test

{{buildBlock}}

## Hooks (`.claude/settings.json`)

{{hooksBlock}}
Hooks are guard rails, not permission; the build and the tests are the source of truth.
Test them with `{{hooksTest}}`.

## Project notes

{{projectNotes}}
