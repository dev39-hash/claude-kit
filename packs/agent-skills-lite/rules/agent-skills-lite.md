# Skill pack: advisory techniques (pack agent-skills-lite)

> Always loaded. Six skills vendored verbatim from the community `agent-skills` collection
> (MIT, `LICENSE-AGENT-SKILLS-MIT.txt` in the pack) plus two references. They are
> **advisory techniques**: the core rules, the role contracts (`core/agents/*.md`,
> `core/roles/team-leader.md`), `.claude/project/rules.md` and the task's approved Plan win
> over any step in a skill.

## Which role reads which skill

The Plan names the skills a role should apply; the defaults below hold when it names none.
Each role reads its skills' `SKILL.md` before starting and applies them where they fit.

| Role | Skills |
|---|---|
| implementer | `test-driven-development`, `incremental-implementation`, `source-driven-development` (API "since" and deprecation checks against official docs), `debugging-and-error-recovery` |
| tester | `test-driven-development` (the Prove-It pattern for bug reports) |
| reviewer | `code-review-and-quality`; plus `doubt-driven-development` when the task class or the Plan asks for an adversarial fresh-context pass |
| leader | `doubt-driven-development` (it orchestrates fresh-context reviewers from the main session); `references/orchestration-patterns.md` |

## Void steps

Anything in a skill that commits, pushes, opens or merges a PR, installs tools, or asks for
one approval covering many tasks is void: the kit's workflow (two human gates, leader
commits, `git.whoCommits`) decides those. In particular:

- `incremental-implementation`, step "Commit": becomes "record the slice in Dev notes".
- `source-driven-development`: web fetches follow the project's network rules; a source that
  cannot be fetched is cited as "not verified", never guessed.
- `doubt-driven-development`: the fresh-context reviewers it spawns are sub agents; rule
  `00-roles-and-models.md` applies (reviewer model, `model` passed explicitly, no fork).
- `code-review-and-quality`: its severity words (Critical / Required / Optional / Nit) map
  onto the kit's `BLOCK / HIGH / MEDIUM / LOW`; the verdict written into the task file uses the
  kit's vocabulary.

## Links inside the skills

The skills link to `../../references/<file>.md`. `definition-of-done.md` and
`orchestration-patterns.md` are installed (`.claude/references/`). The project's own standing
bar is `.claude/project/definition-of-done.md`; it wins over the generic reference. Links to
`testing-patterns.md`, `security-checklist.md`, `performance-checklist.md` and to skills that
are not installed (`git-workflow-and-versioning`, `security-and-hardening`,
`browser-testing-with-devtools`, the `code-reviewer` persona, ...) do not resolve here on
purpose: they are web or JavaScript oriented or they duplicate kit roles.

Do not edit the vendored files; a project-specific change is an override in
`.claude/project/rules.md`, so an upstream update can be re-copied without a merge.
