# Task classification - <project name>

> TEMPLATE. Becomes `.claude/project/task-classification.md`. The leader classifies every
> task at intake and records the class and its consequences in the task file. Tighten or
> extend per project; never loosen silently mid-project (that is a Gate 1 conversation).

| Class | What qualifies | Tester RED | Implementer | Tester verify | Reviewer |
|---|---|---|---|---|---|
| `full` *(default)* | Any change to source code, build wiring or tests | yes when behaviour is specifiable up front | yes | required | required |
| `fix` | A bug with a reproduction; behaviour change is the fix only | yes (regression test first) | yes | required | required |
| `docs` | Documentation or comment-only changes; no behaviour can change | no | yes | skip | required |
| `trivial` | Typo or whitespace in docs; mechanical rename with zero logic | no | leader may do it | skip | skip |
| `spike` | Throwaway investigation; nothing merges | no | yes (scratch only) | skip | skip; output is a note in `.claude/docs/notes/` |
| `hil` | Anything touching real hardware or a gated environment | per `full` | yes | required (hardware part may be `unverifiable here`) | required; human hardware prep confirmed **before** Gate 1 |

Rules of thumb:

- When in doubt between two classes, take the stricter one.
- A task that starts `docs` and grows a code change is reclassified `full` immediately; the
  leader updates the task file and the missing steps run.
- `trivial` still passes both human gates. Nothing skips the human.
- A change to a public API, contract, schema, wire format or dependency is `full` plus an
  ADR before Gate 1, whatever its size.
- Golden, fixture or baseline updates are never `trivial`; they are `full` with their own
  commit and a reason.

Add project-specific classes below this line (for example `protocol-core` requiring the
reviewer to diff against a reference section, or `ui` requiring the Release-loop test)
rather than editing the rows above.

| Class | What qualifies | Tester RED | Implementer | Tester verify | Reviewer |
|---|---|---|---|---|---|
