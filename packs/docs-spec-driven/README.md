# Pack docs-spec-driven

The spec-driven documentation regime of the NichirinLaserMark project, made generic: the
repository carries its own record (specs with stable requirement IDs, one tracked decision
file cited as `ADR Dn`, one backlog `BL-nnn`, a changelog, plan history), the spec delta is
reviewed before code, plan phases live only under `docs/history/`, code comments cite only
tracked content, and nothing tracked points into `.claude/`. A mechanical gate checks the
checkable part. Install with `node install.js --target <project> --packs docs-spec-driven`
(usually together with a stack pack).

## Contents

| Path | Installed as | What |
|---|---|---|
| `rules/docs-structure.md` | `.claude/rules/docs-spec-driven/` (always loaded) | owners table, phase boundary, untracked requests, the five-step workflow, how specs are written, what the pack changes in the core |
| `rules/repo-boundaries.md` | same (always loaded) | tracked files never reference `.claude/`, memory or agent vocabulary; the reverse is allowed |
| `rules/code-comments.md` | same (path-scoped to code and build files) | comments cite only tracked content; `ADR Dn` with prefix; no phases, requests, URLs, machine paths |
| `skills/spec-first/` | `.claude/skills/` | leader procedure: request or backlog row -> plan file -> spec delta reviewed -> code citing IDs -> close-out |
| `skills/backlog/` | `.claude/skills/` | the one list: add / pick / close / triage rows, IDs never reused |
| `skills/architecture-decision-records/` | `.claude/skills/` (**replaces the core skill**) | `### Dn - title` items in the tracked decision file; never renumber; supersede by a new item |
| `commands/plan.md` | `.claude/commands/` (**replaces the core /plan**) | spec-first planning: plan file + spec delta + task file, stops at Gate 1 with the spec diff |
| `commands/docs-gate.md` | `.claude/commands/` | `/docs-gate [--changed \| --staged \| --all \| paths] [--strict]` |
| `templates/spec.md`, `plan-history.md`, `backlog.md`, `changelog.md`, `adr-item.md` | `.claude/packs/docs-spec-driven/templates/` | capability spec, tracked plan file, backlog file, changelog, decision file header and item |
| `tools/docs-gate.js` | `.claude/tools/docs-spec-driven/` | the gate (see the check list in the file header); `--json` for data |
| `tools/test-docs-gate.js` | same | `node .claude/tools/docs-spec-driven/test-docs-gate.js` |
| `tools/kit-env.js` | same | config loader shared by the tools |
| `hooks/settings.fragment.json` | merged into `.claude/settings.json` | read-only permission for the tool; no hooks |

## Config keys (`kit.config.json`, all optional; defaults shown)

```json
"packConfig": {
  "docs-spec-driven": {
    "specDir": "docs/spec",
    "plansDir": "docs/history/plan",
    "historyDir": "docs/history",
    "requestsDir": "docs/_retired",
    "adrFile": "docs/architecture/architecture_decisions.md",
    "adrPrefix": "D",
    "backlogFile": "docs/backlog.md",
    "backlogPrefix": "BL",
    "changelog": "CHANGELOG.md",
    "vendorDirs": ["components/", "3rdparty/", "third_party/", "_deps/", "node_modules/"],
    "exemptPaths": ["LICENSE*", "NOTICE*", "COPYING*", "*.license", "*.min.js"],
    "urlAllow": ["xmlns", "DOCTYPE", "SPDX-License", "schemas.", "w3.org"],
    "machinePathAllow": [],
    "extraPhaseWords": [],
    "codeExtensions": [".c", ".cc", ".cpp", ".cxx", ".h", ".hpp", ".hxx", ".inl", ".py", ".js", ".ts", ".cs", ".java", ".go", ".rs", ".cmake", ".pro", ".pri", ".ps1", ".bat", ".sh", ".ui", ".qss", ".qrc"],
    "docExtensions": [".md", ".rst", ".adoc", ".txt"]
  }
}
```

`urlAllow`, `machinePathAllow` and `extraPhaseWords` are regular expressions matched against
the line. The requests directory must be excluded through `.git/info/exclude` (never the
tracked `.gitignore`); `install.js --add-exclude` only handles `.claude`.

## Setting up a project

1. Create the files that do not exist yet from the templates: `<specDir>/README.md` (index:
   file, prefix, one line), one spec per capability, `<adrFile>` from `adr-item.md`,
   `<backlogFile>` from `backlog.md`, `CHANGELOG.md`, `<plansDir>/`.
2. `project/context.md`: point "Spec(s)" at `<specDir>`, "ADR index" at `<adrFile>`, "Plan of
   record" at the current plan file; `project/rules.md` gets the project's ADR triggers and
   the spec ID prefixes in use.
3. Run `/docs-gate --all`; fix every HIGH; put legitimate URLs and tool paths into the allow
   lists.
4. For an existing project with phase vocabulary in code and docs: rewrite comments module by
   module (never just strip the prefix), rename phase-named tests, build after each module,
   `/docs-gate --all` until clean.

## Relationship to the core

- Core rule `02-repo-hygiene.md` keeps plans and ADRs under `.claude/docs/`. With this pack,
  decisions are tracked as `Dn` items and cited as `ADR Dn`; plans are tracked under
  `<plansDir>` and may name phases; `.claude/docs/adr/` (created by the installer) is unused.
- The core `definition-of-done.md` line "tracked text mentions no plans, phases" reads as
  "no phases outside `<historyDir>`, no agent vocabulary anywhere"; the `verification-loop`
  docs grep is replaced by `/docs-gate --changed`.
- `/plan` and `architecture-decision-records` are replaced by the pack versions (the installer
  notes the override); `delegate-change`, `/review`, `/test`, `/build`, the agents and the
  hooks are unchanged.
- `guard-edit` still blocks `CLAUDE.md` / `AGENTS.md` in the tree and enforces ASCII in code
  and repo markdown (`encoding.asciiRepoMarkdown`); specs are English and ASCII.

## Origin

Rules and workflow project-written (NichirinLaserMark, 2026-10); the decision-record
workflow adapts the ECC `architecture-decision-records` skill (MIT) to a single tracked
file. No third-party text is copied verbatim.
