---
description: Guided feature development with codebase understanding and architecture focus
---

A structured feature-development workflow that emphasizes understanding existing code before writing new code.

## Phases

### 1. Discovery

- read the feature request carefully
- identify requirements, constraints, and acceptance criteria
- ask clarifying questions if the request is ambiguous

### 2. Codebase Exploration

- use `code-explorer` to analyze the relevant existing code
- trace execution paths and architecture layers
- understand integration points and conventions

### 3. Clarifying Questions

- present findings from exploration
- ask targeted design and edge-case questions
- wait for user response before proceeding

### 4. Architecture Design

- use `code-architect` to design the feature
- provide the implementation blueprint
- wait for approval before implementing

### 5. Spec first

- update `docs/spec/` with the agreed requirement changes (stable IDs, see
  `.claude/rules/docs-structure.md`)
- wait for the owner to review the spec delta before writing code

### 6. Implementation

- implement the feature following the approved design, in small slices that
  keep the app buildable
- comments cite only tracked repo content (`.claude/rules/code-comments.md`)
- add or extend the QtTest case in `tests/<name>` that proves the behaviour
- build every affected project 32-bit (`/cpp-build`) and run the relevant tests
- do not commit unless the user asks

### 7. Quality Review

- use `cpp-reviewer` to review the implementation (and `silent-failure-hunter`
  for device/PLC/laser paths)
- address critical and high issues
- report test totals as evidence; list what still needs a bench check

### 8. Close-out

- add the `CHANGELOG.md` entry; record an ADR if a project-wide decision was made
- summarize what was built, follow-up items, and testing instructions
