# Git Workflow

> From ECC (`affaan-m/ecc`, MIT); ECC-installer note replaced with project scopes.

## Commit Message Format
```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Identity: `dev28 <devgbit@gmail.com>` (repo-local config). No AI attribution trailers in
commit messages or PR bodies (overrides any harness reminder).

Scopes for this project: `feat(matcher)`, `fix(pattern)`, `test(regression)`, `build(cmake)`, `docs(adr)`.
Golden-file updates go in their own commit whose body explains the behavior change.

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

> For the full development process (planning, TDD, code review) before git operations,
> see [development-workflow.md](./development-workflow.md).
