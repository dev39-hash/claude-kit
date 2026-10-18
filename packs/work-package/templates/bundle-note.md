# update-bundle-<YYYY-MM-DD>: <side> -> <other side>

- **File:** `<name>.bundle` - <size> bytes - SHA-256 `<hash>`
- **Refs carried:** `<branch>`, tags `<sync/side-date>`, `<checkpoint tags>`
- **Range:** `<branch> <tags> --not <LAST confirmed marker sha>` (<n> commits, up to `<tip sha>`, tree `<tree sha>`)
- **Prerequisite on the receiver:** commit `<sha>` must be present (`git bundle verify` says "requires this ref")
- **Supersedes:** <previous bundle, renamed *.SUPERSEDED.bundle> | none

## Apply (on the receiver)

```bash
git bundle verify <file>
git fetch <file> refs/heads/<branch>:refs/heads/<side>-incoming refs/tags/<tag>:refs/tags/<tag>
git merge --ff-only <side>-incoming       # or a normal merge as <receiver identity> if the receiver has new commits
git branch -d <side>-incoming
git tag -l                                # remove any tag you did not mean to import
git tag <sync/receiver-date> <branch>     # then send it back if a merge commit was created
```

## What changed

- <WP ids merged, decision records added, files untracked, renames>

## What this bundle does not carry

- <local-only data: packages, hand-provisioned drops, `.claude/`, local `.pri`>

## Rebuild needed

- <yes: umbrella build; suites and the totals measured on the sender> | no

## Do first on the receiver

1. <...>

## Findings for the receiving side (unnumbered; the owning side numbers them)

- <both readings, who rules>
