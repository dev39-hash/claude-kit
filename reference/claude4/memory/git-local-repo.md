---
name: git-local-repo
description: "The project is now a LOCAL git repo (since 2026-10-07) — portable git path, commit identity dev27, no AI trailer, never publish"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1755aee4-764a-4565-a94a-2f8acdf94b0d
  modified: 2026-10-07T05:44:37.987Z
---

NichirinLaserMark became a git repository on 2026-10-07, branch `main`. Same day
the owner had the history squashed into ONE initial commit (now `be838a8`, after
the backlog/cleanup follow-up was amended in on 2026-10-07; before that `c7cec64`, after
the docs restructure was folded in too — see [[docs-restructure]]) and the old
commits purged (reflog expired + `gc --prune=now`, owner-approved) so no trace of
agent tooling remains in the repo or its history — module scope cards renamed
`AGENTS.md` → `README.md`, root `AGENT.md` → `ONBOARD.md`, generated
`docs/reference/html/` removed (regenerate with `docs/reference/generate.ps1`
when needed). Owner rules:

- **Local only — never publish.** No remote, never `git push`, never add one.
- **Git binary:** the portable install, `C:\DGB\build_packages\portable-git\cmd\git.exe`
  (not on PATH — call it by full path).
- **Identity:** `dev27 <de27@local>`, set in the repo's LOCAL config
  (`user.name` / `user.email`), so plain `git commit` already uses it.
- **No AI trailer** in any commit message — no `Co-Authored-By`, no
  "Generated with" line. Messages in English.
- Repo-local `core.autocrlf=false` (the portable git's system config sets
  `true`): the protocol `golden.txt` and geometry `baseline/B*.txt` are compared
  byte-for-byte, so line-ending conversion on checkout would break both oracles.
  `core.quotepath=false` so Japanese file names print readably.

**`.claude/`** is ignored ONLY via the untracked `.git/info/exclude` — the owner
removed it from `.gitignore`; never add it back there. **.gitignore** (root):
`product_release/`, `**/build/` (every build
folder at any depth — root, `laser_host/`, `tests/*/`, the toolkit samples), plus a
Qt/MSVC set **with `*.dll`/`*.a`/`*.so` deliberately NOT ignored** — the EzCad2
runtime DLLs in `components/` must be tracked. Vendor `.pdb`/`.obj`/`Makefile*`
under `components/` are re-included with `!` rules. `*.pro.user` and generated
`.qm` stay ignored.

**Why:** the owner asked for version control after a run of "no git to revert"
incidents ([[powershell-utf8-source-files]]) and silent stale-build findings
([[project-status]]).

**Commit policy — ASK each time, the Project Leader has gone both ways.** On
2026-10-07 they first asked for a new commit (the "owner" → "Project Leader"
rename, `296eca6`), then minutes later had it folded back into the root commit
(now `bff10ed`, old objects purged again). Until told otherwise: when work is
ready, ask "new commit or fold into the root commit?" — never assume.

**How to apply:** commit only when the Project Leader asks (or as part of a workflow they
requested); stage deliberately and check `git status` for stray outputs before a
commit. Git does NOT lift the UTF-8 rule — still never round-trip sources through
PowerShell `Get-Content`/`Set-Content`, but a mangled file can now be restored
with `git checkout -- <file>`.
