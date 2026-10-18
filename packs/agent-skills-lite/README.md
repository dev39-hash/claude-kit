# Pack agent-skills-lite

Six generic engineering-technique skills and two references, vendored verbatim from the
community `agent-skills` collection (MIT), with one kit rule that scopes them: they advise,
the kit's workflow decides. Install with
`node install.js --target <project> --packs agent-skills-lite` (usually together with a stack
pack).

## Contents

| Path | Installed as | What |
|---|---|---|
| `rules/agent-skills-lite.md` | `.claude/rules/agent-skills-lite/` (always loaded) | advisory status, default role-to-skill mapping, void steps, how the links resolve |
| `skills/test-driven-development/` | `.claude/skills/` | red-green-refactor, Prove-It for bug reports, "discover the stack first" |
| `skills/incremental-implementation/` | `.claude/skills/` | thin vertical slices with verification per slice (its commit step is void) |
| `skills/source-driven-development/` | `.claude/skills/` | ground API decisions in official documentation: detect, fetch, implement, cite |
| `skills/debugging-and-error-recovery/` | `.claude/skills/` | stop-the-line triage in five steps |
| `skills/code-review-and-quality/` | `.claude/skills/` | five-axis review, change sizing, severity labels |
| `skills/doubt-driven-development/` | `.claude/skills/` | fresh-context adversarial review: claim, extract, doubt, reconcile, stop |
| `references/definition-of-done.md` | `.claude/references/` | the generic standing bar the skills cite; the project's own `project/definition-of-done.md` wins |
| `references/orchestration-patterns.md` | `.claude/references/` | multi-persona patterns and anti-patterns ("personas do not invoke personas") |
| `LICENSE-AGENT-SKILLS-MIT.txt` | `.claude/packs/agent-skills-lite/` | the MIT licence of the vendored files |

No hooks, no commands, no config keys. The upstream slash commands are not vendored: they
commit by themselves, install tooling or run deploy checklists, all of which the kit's
workflow replaces.

## Why these six

They are technique skills that apply to any language and any stack. The upstream collection
also carries web, JavaScript and deployment skills (frontend UI, Core Web Vitals, CI/CD,
shipping) and planning or spec skills that duplicate the kit's own task file, `/plan` and
`docs-spec-driven` pack; those were left out on purpose.

## Vendoring rules

The skill and reference files are byte-identical to upstream (version 0.6.10) and contain
non-ASCII punctuation; they are exempt from the kit's ASCII rule as third-party text. Never
edit them in the kit or in a project: an upstream update is re-copied over them, and a
project-specific change goes into `.claude/project/rules.md` as an override. The kit rule in
`rules/` is the only file of this pack written for the kit.

## Licence

`LICENSE-AGENT-SKILLS-MIT.txt` (MIT, the upstream author). The kit's `LICENSES/README.md`
lists every third-party licence the packs carry.
