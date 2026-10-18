---
name: verification-loop
description: The leader's own verification pass before Gate 2 - configure, whole-tree build with warnings as errors, full tests with shape check, golden and baseline comparison, static analysis and format when available, docs gate, diff review against the touch list - producing a READY / NOT READY report for the Leader verify section. Use after every task's review step and before any commit.
metadata:
  origin: ECC verification-loop (MIT), rewritten tool-neutral for the kit
---

# Verification loop

Run by the leader (or a `full`-class task's final step), never delegated. Every phase says
when a tool was **skipped because it is missing**; a skipped phase is never a PASS. Commands
come from `.claude/project/context.md` and `build-env.md`; placeholders: `<configure>`,
`<build>`, `<test>`, `<shape-check>`, `<format-check>`, `<static-analysis>`, `<gates>`.

## When to use

- After the reviewer's verdict and before Gate 2 of every task.
- Before any commit, tag or bundle.
- In long sessions: phases 1, 2 and 4 after every logical step; the full loop at the end.

## Phase 1: Configure

`<configure>` in the leader's own tree (`build.leadBuildDir`), with every option explicit
(a previous task may have left another value in the cache). Fails -> STOP, `/build`.

## Phase 2: Build

`<build>` for every configuration the project ships (`definition-of-done.md` lists them).
Read the log for `error` and `warning`; zero of each with warnings as errors. Record counts.
Every test project that includes a touched module must have been rebuilt.

## Phase 3: Tests

`<test>` for the whole tree, not a single target. Then `<shape-check>`: the number of test
functions must match the listing before a total is trusted. Report passed / total / skipped,
and name every skipped test and why. Suites run one at a time with nothing in
`processes.busyBeforeTests` running. Hardware suites report `unverifiable here` when the
device is absent.

## Phase 4: Goldens, baselines, oracles

If any golden, baseline or oracle output changed, show the diff and confirm the change was
intentional, has its reason in the task file, and goes in its own commit. Unexplained drift
is FAIL. Behaviour-neutral tasks must show identical totals before and after.

## Phase 5: Format and static analysis

`<format-check>` only when the repo has a formatter config; `<static-analysis>` when the tool
exists. Otherwise `SKIPPED (<tool> missing)`. Findings are listed, not fixed here.

## Phase 6: Gates

`<gates>` when the project or a pack has them (ASCII, vocabulary, docs policy, layering,
purity). Also: `git grep -I -nP "[^\x00-\x7F]"` over the ASCII-covered files; a docs grep for
`.claude`, `Claude`, `agent`, phase names, absolute paths under `paths.docsGateRoots`.

## Phase 7: Diff review

`git status --short` and `git diff --stat` (or `--name-status <base>..HEAD`): every path on
the task's touch list; nothing under "Must not touch"; no temp code, debug output, injected
negative checks, build output, machine paths, `CLAUDE.md`/`AGENTS.md`; public symbols
documented; module README / CHANGELOG updated with the behaviour. Try a negative check where
doubt remains.

## Report (goes into the task file's Leader verify section)

```text
VERIFICATION REPORT
Configure:  PASS | FAIL
Build:      PASS | FAIL (<errors> errors, <warnings> warnings; configs: <list>)
Tests:      PASS | FAIL (<passed>/<total>, <skipped> skipped; shape check <f> = <listed>)
Goldens:    PASS | FAIL | N/A
Format:     PASS | FAIL | SKIPPED (<tool>)
Static:     PASS | FAIL | SKIPPED (<tool>)
Gates:      PASS | FAIL | N/A
Diff:       <n> files; touch list clean | <unlisted files>
Negative:   <test shown red, restored how> | not needed because <...>
Overall:    READY | NOT READY for Gate 2
Issues:
1. ...
```
