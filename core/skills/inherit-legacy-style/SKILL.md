---
name: inherit-legacy-style
description: Prevent AI style drift on a hand-written legacy codebase - scan the sources for implicit conventions across four dimensions (file anatomy, state and control flow, infrastructure placement, error handling), resolve conflicts with the human one at a time, and write an enforceable .claude/rules/legacy-style.md (golden files, checkable rules, DONTs). Use when onboarding the kit onto an existing project or when generated code starts to look foreign.
metadata:
  origin: community skill, adapted once in a Qt application project; paths and git access adapted to the kit
allowed-tools: Read, Glob, Grep, Bash, Write, AskUserQuestion
---

# Inherit legacy style

Language- and framework-agnostic. Output: `.claude/rules/legacy-style.md`, auto-loaded by
Claude Code, so no hook and no `CLAUDE.md` edit is needed. Written conventions the project
already has (`project/rules.md`, module READMEs, a tracked style doc, pack rules) win over
anything inferred; record only what they do not state.

## Prerequisites

- Git read-only commands only (`ls-files`, `log`, `diff`, `rev-parse`), through `git.gitExe`
  when git is not on PATH.
- Source scope: the project's source globs from `project/context.md`; skip `paths.readOnly`,
  `encoding.asciiExempt` (vendored code), `build.buildDirPatterns`.

## Step 0: detect the mode

`.claude/rules/legacy-style.md` absent -> **Branch A, first full scan**; present ->
**Branch B, incremental sniff**. Announce the mode and the scale tier in one line; never ask
the human to pick.

## Branch A: first full scan

1. **Measure scale** with `git ls-files -- <source globs> | wc -l` and pick a tier:

   | Tier | Source files | Strategy |
   |---|---|---|
   | Small | up to ~50 | full close read of every source |
   | Medium | 50-500 | infrastructure layer full read; business layer 2-3 samples per dimension |
   | Large | over ~500 | strict sampling with a budget cap; `--stat` first, targeted reads |

2. **Scan four dimensions**:
   1. File anatomy: in-file declaration order (includes, types, main logic, helpers, exports).
   2. State and control flow: naming of state, flags, async or polled state, pagination,
      iteration idioms.
   3. Infrastructure: where cross-cutting code lives (logging, config, adapters, utilities).
   4. Error handling: exceptions vs return codes vs result types; null and range checks;
      what is logged and where.

3. **Signal threshold** before interrupting the human:
   - weak signal (minority under 5 % and under 10 occurrences): majority wins silently,
     minority goes to DONTs;
   - strong signal (near-even split, or a semantic fork on a core dimension): grill;
   - small project exception: at tier Small, "3 vs 2" is not a majority; grill it.

4. **Grilling protocol**: exactly one question at a time, with evidence from two paths and
   four options: `1` follow X, `2` follow Y, `3` this is evolution, update the rules,
   `4` I have a new rule. Wait for the answer, then the next conflict. Never stack questions.

5. **Write `.claude/rules/legacy-style.md`** with a header (commit fingerprint, scale tier,
   date) and three mandatory sections:
   - **Golden files**: real exemplar paths annotated with what each demonstrates;
   - **Naming and state-control rules**: concrete, checkable conventions;
   - **DONTs**: anti-patterns that must not propagate (and bugs seen in exemplars, flagged).

## Branch B: incremental sniff

1. Read the existing rules; with a commit fingerprint, `git diff <hash> HEAD --stat` to find
   the delta, else `git log -3 --stat`; inspect suspect files on demand (huge diffs:
   `--stat` plus the largest changes only).
2. Compare new code against the recorded rules; conflicts go through the grilling protocol.
3. Append `### [YYYY-MM-DD] Style evolution log` at the end; never overwrite old rules;
   update the fingerprint.

## Per-turn enforcement

While `legacy-style.md` is loaded, every code-writing step opens with a one-line compliance
declaration: the golden file followed and the DONTs avoided. The reviewer checks the rules
file mechanically like `project/rules.md`.

## Anti-patterns

- Skipping the scale measurement (sampling starves a small project; full-scanning a huge one
  never ends).
- Stacking conflict questions; defaulting to a hook; judging syntax or stack quality (this
  skill aligns meta-architecture only); copying bugs from exemplars; overwriting old rules.
