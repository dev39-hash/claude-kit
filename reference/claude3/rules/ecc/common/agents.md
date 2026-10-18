# Agent Orchestration

> Adapted from ECC (`affaan-m/ecc`, MIT). Only the agents installed in this project are
> listed; they use bare names (no `ecc:` prefix).

## Operating model: Claude is the project lead

The user's decision (2026-10-13): Claude leads and coordinates; it does **not** implement or
write tests directly. Sub-agents do the hands-on work. The lead:

- breaks the plan into briefs, picks the agent, writes the brief (goal, files, constraints,
  acceptance criteria, what is already ruled out);
- runs independent briefs in parallel; collects and integrates results;
- reviews reports, runs the `verification-loop` (or delegates it), commits as `dev28`;
- keeps `.claude/docs/plan/` and ADRs current.

Trivial glue the lead may do itself: edit `.claude/` config, write briefs/plans/ADRs, run
`git` and `ctest`, read files.

## Model policy: Sonnet for workers, Opus for reviewers

- **Workers** (`cpp-implementer`, `cpp-tester`, `cpp-build-resolver`, `Explore`, `Plan`,
  `general-purpose`): always pass `model: "sonnet"`, at every depth.
- **Reviewers** (`cpp-reviewer`, and any ad-hoc plan/design review): pass `model: "opus"`.
- Agent definitions in `.claude/agents/` carry the matching `model:` in their frontmatter, and
  each brief must tell the agent which model to use for anything it spawns (workers: sonnet;
  reviews: opus). Never let an agent inherit the lead's model.

## Available agents (`.claude/agents/`)

| Agent | Purpose | When to use |
|-------|---------|-------------|
| `cpp-implementer` | Implements one scoped task (port a file, add a class, wire CMake), builds, runs targeted tests | Every implementation task |
| `cpp-tester` | Writes unit / synthetic / regression GoogleTests; RED before implementation, GREEN verification after | Before and after each implementation task |
| `cpp-reviewer` (Opus) | Memory safety, modern C++, SIMD/OpenMP, Mat lifetime, performance review | After every implementation task; mandatory for SIMD/raw-buffer code |
| `cpp-build-resolver` | Fixes CMake/compile/link errors with minimal edits | When a build fails and the implementer is stuck |

Built-in agents (`Explore`, `Plan`, `general-purpose`) remain available for search, planning
and research with `model: "sonnet"`; an ad-hoc review (plan, design, final diff) uses
`general-purpose` with `model: "opus"`.

## Standard task pipeline

```
brief -> cpp-tester (RED tests)        [parallel with reading/ADR work]
      -> cpp-implementer (GREEN)
      -> cpp-build-resolver (only if the build is broken)
      -> cpp-reviewer, Opus (must Approve or Warning)
      -> lead: verification-loop, commit
```

Invoke with the Agent tool:

```text
Agent(subagent_type: "cpp-implementer", model: "sonnet", prompt: "<brief>")
```

## Brief template

```
GOAL: one sentence
CONTEXT: reference files to read, existing headers, ADRs
DELIVERABLES: files to create/modify
CONSTRAINTS: project.md rules that bite here (ASCII, naming, no Qt, SIMD owner, ...)
ACCEPTANCE: tests that must pass, build flags, review verdict
OUT OF SCOPE: what not to touch
BUILD: SLOT=$(node .claude/tools/wt-slot.js acquire <tag>); configure, build, test in $SLOT; release at the end
SUB-AGENTS: workers model "sonnet"; reviews model "opus"
```

## Delegation completion contract

1. The final message IS the deliverable. Never end a turn with "waiting for agents".
2. If you delegate, you own collecting and integrating the results.
3. Decompose only when the work cannot fit one context; do not re-delegate an already-sized task.
4. Run independent briefs in parallel in one message; keep dependent ones sequential.
