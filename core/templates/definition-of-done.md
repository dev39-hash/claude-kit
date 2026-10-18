# Definition of done - <project name>

> TEMPLATE. Becomes `.claude/project/definition-of-done.md`. The leader walks this list in
> **Leader verify** before Gate 2. Mark items that do not apply to the project "n/a" with a
> reason instead of deleting them.

## Correctness

- [ ] Every acceptance criterion in the task file has evidence (test id, count, log, path).
- [ ] New behaviour has a test that fails without the change (negative check recorded).
- [ ] No existing test, golden, fixture or baseline was edited to make a run pass.
- [ ] Expected values come from the spec or reference, not from the code under test.

## Build

- [ ] Whole tree builds in every configuration the project ships (<Debug/Release, static/shared, each toolchain>).
- [ ] Zero warnings with warnings-as-errors; nothing silenced by pragma or flag.
- [ ] Every test project that includes a touched module was rebuilt and run.
- [ ] Static analysis / format / gate tools ran or were reported `SKIPPED` by name.

## Contract and compatibility

- [ ] Public API, schema, wire names, config keys unchanged, or changed with an ADR and the
      task file saying so.
- [ ] New config keys are optional on load; saved configs on installed machines still load.
- [ ] Goldens/baselines regenerated only with the flag and a reason, in their own commit.

## Quality

- [ ] Touch list respected; no unlisted file changed.
- [ ] No temp code, debug output, injected negative checks, machine paths or build output
      in the diff.
- [ ] ASCII-only code files; English; project naming; Doxygen on public symbols.
- [ ] Reviewer verdict APPROVE, or WARN with each finding fixed or accepted with a reason.

## Documentation

- [ ] Module README / user docs / CHANGELOG updated with the behaviour they describe.
- [ ] Tracked text mentions no `.claude`, agents, plans, phases, owners.
- [ ] ADR written and indexed when the task required one.

## Process

- [ ] Task file complete: every section filled, Gate 1 and Gate 2 approvals recorded.
- [ ] Commit per `rules.md`: identity, no trailer, staged by path, conventional message.
- [ ] Decisions and lessons distilled; `project/context.md` current state updated if drifted.
- [ ] Build slots / worktrees released; background processes stopped; scratch cleaned.
