# WP-xx report: <title>

- **Branch:** `<branch>` at `<sha>` (base `<sha>`) - **Slot:** `<dir>/slotN` | main tree
- **Status:** complete | STOPPED AT: <stop rule, where>

## 1. Changed files

- `<path>` - <created | edited> - <one line>

## 2. Evidence

- Build: <config> <dir> QMAKE_EXIT=<n> MAKE_EXIT=<n> | `<build command>` -> <exit>
- Suite `<name>`: <passed>/<total> (<skipped>), shape check <functions> = <listed> (+2 for QtTest)
- Criterion #n: <test id | count | log line | file path>
- Baseline before: <...> ; after: <...>

## 3. Negative checks

- Test `<name>`: injected <what> -> red (<excerpt>); restored by <revert <sha> | re-applied patch <file>>; restore confirmed by <command -> outcome>.
- Cases that stayed green as expected: <...>

## 4. Deviations

- <where the work departed from the handoff, and why> | none

## 5. Findings out of scope

- <one line each; not fixed>

## 6. Open questions

- <for the leader or the human> | none

## Env notes (optional)

- <a build or toolchain fact the leader should fold into build-env.md>
