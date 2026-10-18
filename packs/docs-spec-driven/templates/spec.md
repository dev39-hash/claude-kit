# <Capability name>

<One or two sentences: what this capability is and which part of the system owns it.
Describe behaviour as built and verified, in present tense, in English. IDs use the prefix
`<PREFIX>` (two to five capital letters), are stable and never reused.>

## 1. Purpose and scope

- In scope: <...>
- Out of scope: <... (point to the spec that owns it)>
- Depends on: <other specs, by file name>

## 2. Requirements

| ID | Requirement | Notes |
|---|---|---|
| <PREFIX>-001 | The system MUST <...>. | <ADR D3 when a decision explains it> |
| <PREFIX>-002 | When <condition>, the system MUST <...>, otherwise <...>. | |
| <PREFIX>-003 | <...> (removed 2026-01-15) | kept for the record; never renumbered |

Wording: one testable statement per row; MUST / MUST NOT / SHOULD; no implementation
detail unless it is the requirement. During a plan, mark a touched row `(new)`, `(changed)`
or `(removed)` after the ID; drop the markers at close-out.

## 3. Invariants

- <What is always true, in one line each; the editor of the owning module relies on these.>

## 4. Configuration

| Key | Type | Default | Meaning | Since |
|---|---|---|---|---|
| `<group.key>` | <type> | <default> | <...> | <version or date> |

New keys are optional on load; a saved configuration from an installed machine still loads.

## 5. Acceptance

| ID | Verified by | Kind |
|---|---|---|
| <PREFIX>-001 | `tests/<suite>` `<test name>` | automated |
| <PREFIX>-002 | <bench procedure in docs/rules/<runbook>.md> | bench |

Every requirement has a row. `bench` rows name who confirms and how; they are never
reported as tested by a build.

## 6. Open questions and known drift

- <Question or contradiction between this spec, the code and the tests, one line each,
  with the backlog row that tracks it: `BL-031`. Delete the line when the row closes.>
