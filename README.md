# claude-kit

A reusable `.claude/` starter kit for Claude Code projects: a generic core (rules, workflow,
roles, agents, skills, commands, hooks, templates), optional packs per stack or way of
working, and a thin project layer written fresh per project. Built from the `.claude`
folders of five earlier projects (`reference/`, read-only) and the decisions recorded in
`docs/`.

```text
install.js               node install.js --target <project> --packs <a,b>   (see core/workflow/PORTING.md)
kit.config.schema.json   every project-specific value, with defaults
core/                    generic layer: rules/ workflow/ roles/ agents/ skills/ commands/ hooks/ templates/
packs/                   cpp-cmake-gtest, cpp-qmake-qt, work-package, docs-spec-driven (more to come: controller-kernel, ...)
docs/                    01-tong-hop-reference.md (synthesis), 02-de-xuat-giai-phap.md (design), inventory/
reference/               snapshots of the five source projects; never edited, not installed
```

Rules for every kit file: English, ASCII, no project names, no machine paths, no status
paragraphs. Hook tests: `node core/hooks/test-hooks.js`. Read `core/README.md` next.
