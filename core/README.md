# claude-kit core

The generic layer of the kit. Copied verbatim into `<project>/.claude/core/` by `install.js`
and activated into `.claude/rules/`, `.claude/agents/`, `.claude/skills/`,
`.claude/commands/`, `.claude/hooks/`. Never edited inside a project; improvements come back
here and are re-installed with `--update`.

| Folder | What | Read it when |
|---|---|---|
| `rules/00-06*.md` | Always-loaded rules: roles and models, git and identity, repo hygiene, language and ASCII, file and process safety, memory, evidence and verdicts | every session (automatic) |
| `workflow/WORKFLOW.md` | Task lifecycle, two human gates, task file as baton, rework loops, session recovery | before the first task |
| `workflow/PORTING.md` | How to install the kit into a project and what to fill in | setting up a project |
| `roles/team-leader.md` | The main session's contract | every session start |
| `agents/*.md` | `implementer`, `tester`, `reviewer`, `build-resolver`, `explorer` (frontmatter: tools, model) | spawning a role |
| `templates/task.md` | The baton file: Plan, RED tests, Dev notes, Test report, Review verdict, Leader verify, Commit record | intake of every task |
| `templates/brief.md`, `report.md` | Prose brief for ad-hoc delegation; the report block each role writes | delegating outside a task file |
| `templates/adr.md`, `plan.md` | Architecture decision record; plan of record | decisions, milestones |
| `templates/project-*.md`, `task-classification.md`, `definition-of-done.md`, `build-env.md` | The five project-layer files | porting |
| `templates/decisions.md`, `lessons.md` | Curated memory files | porting |
| `CLAUDE.template.md` | Skeleton of the project's `.claude/CLAUDE.md`; `{{placeholders}}` filled by `install.js` from `kit.config.json` | porting |
| `hooks/` | `guard-shell`, `guard-edit`, `subagent-model-guard`, `format`, `sync-memory`, shared `lib/`, `test-hooks.js`, `settings.template.json`; see `hooks/README.md` | installing, adding a rule |
| `skills/*/SKILL.md` | `delegate-change` (leader checklist per task), `tdd-workflow`, `verification-loop`, `architecture-decision-records`, `change-impact`, `inherit-legacy-style` | the step that needs them |
| `commands/*.md` | `/plan` (task file + Gate 1), `/test [red\|verify]`, `/review`, `/build` | driving a task from the terminal |

Design decisions behind the core: `docs/01-tong-hop-reference.md` section 5 and
`docs/02-de-xuat-giai-phap.md` in the kit repository.

Conventions for every core file: English, ASCII, no project names, no machine paths, no
status paragraphs, no dates. Values come from `kit.config.json`; explanations from
`.claude/project/*.md`.
