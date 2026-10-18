# Git and identity

Always loaded. Values live in `.claude/kit.config.json` (`git`); the `guard-shell` hook enforces
them. These rules override the harness attribution reminder.

- Commit identity is exactly `git.identity` (name and email), set in the repo-local config. The
  addresses in `git.deniedEmails` never appear as author or committer. Never change global or
  system git config.
- **No AI attribution, ever**: no `Co-Authored-By`, no "Generated with ...", no tool or model
  name in commit messages, tags, merge commits or PR bodies. A commit message describes the
  change only; it never mentions an owner, a role, a requester, an agent or a phase.
- Commit only after Gate 2 (or when the human says "commit"). Stage by explicit path: never
  `git add -A`, `git add .`, `git add -u`, `git commit -a`.
- Conventional commit messages when `git.conventionalCommits` is true (`feat`, `fix`,
  `refactor`, `docs`, `test`, `build`, `chore`, `perf`); one logical change per commit.
  Golden/fixture updates go in their own commit with the reason.
- Push only when the human asks in the current conversation (`git.push`). Force push only on an
  explicit request and then with `--force-with-lease` (`git.forcePush`); plain `--force` and
  `+refspec` are denied.
- Ask before any destructive git command: `reset --hard|--merge`, `clean`, `checkout --` /
  `restore` over changes, `switch -f`, `branch -D`, `rebase`, `commit --amend`, `stash drop`,
  `filter-branch`, `reflog expire`, `gc --prune`, `tag -d`, `update-ref -d`.
- Never rewrite history another machine may have fetched. Never `git clean -x` (it would delete
  the ignored `.claude/`).
- Before committing: check the identity, strip trailers, confirm no `CLAUDE.md`/`AGENTS.md`,
  build output, temp code or machine path is staged.
