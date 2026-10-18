# Build environment - <project name> on <machine label>

> TEMPLATE. Becomes `.claude/project/build-env.md`. This file holds the **proven** commands
> for this machine: copy them from a run that worked, never from memory. Roles report new
> facts as "Env notes" in their task-file section; the leader folds them in here. Machine
> paths live here and in `kit.config.json`, never in tracked files.

## Toolchain

| Tool | Version | Path (not on PATH unless said so) |
|---|---|---|
| Compiler | <MSVC 14.xx / GCC / Clang> | <vcvars path + arch> |
| Build system | <CMake x.y / qmake + jom / nmake> | <path> |
| Qt | <version, kit> | <path> |
| clang-format / clang-tidy | <version> | <path> or "absent" |
| Other SDKs | <OpenCV, Pylon, ...> | <path or env var> |
| git | <version> | <path if portable> |

## Configure / build / test (copy-paste exact)

```bash
# configure
<...>
# build
<...>
# test (whole tree)
<...>
# test (one suite)
<...>
# shape check
<...>
# gates / format / static analysis
<...>
```

## Parallel agents

- Build slots: `<command to acquire>` -> `<dir>`; `<command to release>`; <count> slots,
  stale after <n> h. Or: worktrees under `<dir>` with `<prepare command>`; or: "no
  isolation possible here: implementers run in sequence".
- Suites run one at a time. Check `<process list command>` for <busy processes> first.
- Fixed ports used by tests: <...>.

## Gotchas (each proven once)

- <e.g. never chain `call vcvars && set PATH=... && jom` on one line; put it in a .bat>
- <e.g. always re-run qmake before nmake/jom; stale Makefile lies>
- <e.g. after an interrupted build delete 0-byte .obj files; LNK1136 means that>
- <e.g. `.pri` files are CRLF: use the Edit tool>
- <e.g. a running `<app>.exe` holds the device; the human closes it, never kill it>

## Environment variables the project reads

| Variable | Meaning | Default |
|---|---|---|
