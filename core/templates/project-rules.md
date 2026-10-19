# Project rules - <project name>

> TEMPLATE. Becomes `.claude/project/rules.md`. These are HARD rules: every role obeys them
> and the reviewer checks them mechanically. Where a rule here contradicts `.claude/core/`
> or a pack, this file wins. Values that hooks enforce also go into `kit.config.json`;
> this file explains them. Keep standing rules only; delegation history and rulings go to
> `.claude/docs/decisions.md`.

## Version control

- Commit identity: `<name> <email>` (repo-local). Never: <denied emails>.
- Attribution trailers: forbidden (core rule; restate if the project needs a reminder).
- Commit cadence: <task | phase | wp>; who commits: <leader | implementer on its branch>.
- Branching: <work on main | one branch per task `<prefix>/T-xxx-slug` | never push without
  asking | remote status>.
- Conventional commits: <yes | no>; scopes in use: <...>.

## Gate delegations  *(delete if none)*

- Gate 1 delegated to the leader for: <classes or scope>. Still stops for: <checkpoint
  rulings, freeze windows, scope outside the charter, hardware, deletes outside the project>.
- Gate 2 delegated: <no | for classes ...>.

## Access boundaries

- Read-only paths: <...> (also in `kit.config.json` `paths.readOnly`).
- Ask before editing: <...>. Local-only data git cannot restore: <...>.
- Processes never launched or killed: <...>. Ports in use by tests: <...>.
- Anything outside `<project root>`: never read or write without asking, except the
  session scratchpad.

## Hardware / environment gates  *(delete if none)*

- <Device, licence or network access that must wait for the human; name the prerequisite,
  who confirms it, and which task class it maps to.>

## Code conventions the reviewer enforces

- Language level and toolchain: <C++17, MSVC x64, Qt 5.15 ...>.
- Naming: <follow the codebase: PascalCase types, camelCase functions, `m_` members,
  `kPascalCase` constants, snake_case files>.
- Error strategy: <exceptions at the boundary | no exceptions: bool/rc/optional + log>.
- Ownership and threading: <Qt parent XOR smart pointer; queued signals across threads; ...>.
- Includes and layering: <module-qualified includes; lower modules never include higher>.
- Comments and docs: <Doxygen `///` on public symbols; comments cite tracked content only>.
- Formatting: <`.clang-format` present: yes/no; keep the style of the file you edit>.
- Vocabulary bans or domain rules: <grep gate and its exemption, if any>.

## ADR triggers beyond the core list

- <e.g. a new matching mode, a change to the golden format, a new SUBDIRS entry>.

## Testing policy

- Framework and layout: <GoogleTest in tests/unit|synthetic|regression | QtTest one project
  per suite under tests/<name>/ | ...>.
- Required kinds of tests for a `full` task: <unit + regression | contract suite unchanged>.
- Tolerances, goldens, baselines: <table: quantity | limit | where it is checked, e.g.
  position 0.5 px, angle 0.1 deg, score 0.01; golden dir; regenerate only with
  `--update-golden` and a reason>.
- Suites that need hardware and how they skip: <...>.

## Anything else non-negotiable

- <...>
