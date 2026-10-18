# Pack work-package

The work-package regime of the ncr_picking project, made generic: a handoff file is the
specification, the implementer commits on its own branch, the leader reviews and merges
`--no-ff`, parallel packages run in git worktree slots that share vendored trees by
junction, and two machines without a common remote exchange commits through range bundles
with handover notes. Install with `node install.js --target <project> --packs work-package`
(usually together with a stack pack).

## Contents

| Path | Installed as | What |
|---|---|---|
| `rules/work-package.md` | `.claude/rules/work-package/` (always loaded) | the regime's overrides of the core flow and the human gates that remain |
| `templates/wp-handoff.md`, `wp-report.md`, `wp-review.md`, `bundle-note.md` | `.claude/packs/work-package/templates/` | handoff, six-section report, review record, bundle handover note |
| `skills/work-package/` | `.claude/skills/` | leader procedure: write, issue, check, review, merge, record |
| `skills/worktree-slots/` | `.claude/skills/` | create, prepare, use and safely remove `.wt/slotN` worktrees |
| `skills/two-machine-bundle/` | `.claude/skills/` | export / import / rehearse range bundles, markers, backups, gotchas |
| `agents/wp-implementer.md` | `.claude/agents/` | one package, own branch, own commit, six-section report (worker model) |
| `agents/wp-reviewer.md` | `.claude/agents/` | read-only reviewer of tables, decision records, handoffs, reports (reviewer model) |
| `commands/review-wp.md` | `.claude/commands/` | `/review-wp <WP-xx> [branch] [base]`: core reviewer on the whole branch diff + review record |
| `hooks/wt-guard.js` | `.claude/hooks/work-package/` (PreToolUse Bash\|PowerShell) | denies recursive deletes, `git clean` and `robocopy /MIR` inside the slots dir; asks on `rmdir` of a junction and `worktree remove --force` |
| `hooks/test-wt-guard.js` | same | `node .claude/hooks/work-package/test-wt-guard.js` |
| `hooks/settings.fragment.json` | merged into `.claude/settings.json` | wires the hook; read-only permissions for `git worktree list`, `git bundle verify`, `git merge-base`, `sha256sum` |

## Config keys (`kit.config.json`)

```json
"git": { "whoCommits": "implementer-branch", "commitCadence": "wp", "integrationBranch": "main",
         "branchPattern": "wp/{id}-{slug}", "push": "ask" },
"gates": { "plan": "leader", "commit": "leader" },
"build": { "isolation": "worktrees", "worktrees": { "dir": ".wt", "count": 4, "prepareCommand": "powershell -File .wt/prepare_slot.ps1" } },
"paths": { "localOnly": [".wt/", "product_release/"], "readOnly": ["reference_source/"] },
"packConfig": {
  "work-package": {
    "wpDir": ".claude/docs/wp",
    "reportsDir": ".claude/docs/wp/reports",
    "reviewsDir": ".claude/docs/wp/reviews",
    "bundle": {
      "outDir": "product_release/bundle-to-<other>",
      "inDir": "product_release/bundle-from-<other>",
      "thisSide": "dev",
      "otherSide": { "name": "deploy", "identity": "dev27 <dev27@local>", "branch": "master" },
      "backupClone": "reference_source/other-repo-backup",
      "recordClone": "reference_source/other-repo"
    }
  }
}
```

`gates: leader` records the standing delegation; `project/rules.md` must state its scope and
the cases that still stop (checkpoints, freeze windows, push or bundle export, deletes
outside the project, the other machine's work).

Where handoffs live is the project's choice: untracked under `.claude/docs/wp/` (default)
keeps the repo free of agent vocabulary (kit rule 02); a two-machine project that needs
handoffs to travel tracks them under its plan folder and then writes them without any
agent, model or owner wording.

## Relationship to the core

`wp-implementer` replaces the core `implementer` for packages; `tester` and the core
`reviewer` are unchanged (`/review-wp` drives the reviewer). The core `guard-shell` already
asks before deletes of `paths.localOnly`; `wt-guard` adds the junction-specific denials.

## Origin

Project-written (ncr_picking, 2026); no third-party licence.
