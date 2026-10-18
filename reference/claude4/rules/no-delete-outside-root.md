# Never delete files outside the project root on your own

The project root is `C:\DGB\Project\NichirinLaserMark`. Outside it, **do not
delete, move away, overwrite-to-empty, or clean up any file or folder unless the
owner explicitly asked for that specific deletion in the current conversation.**

## What counts

- Any path not under the project root: other projects under `C:\DGB\`,
  `C:\DGB\build_packages\` (portable git, harness tools), the Qt / Visual Studio
  installs, `%USERPROFILE%` (including `C:\Users\BAO\.claude\` and the
  user-level memory folder), `%TEMP%` and the session scratchpad.
- Every mechanism: `Remove-Item`/`rm`/`del`/`rmdir`/`rd`, `Move-Item` out of
  place, `[IO.File]::Delete`, `[IO.Directory]::Delete`, `robocopy /MIR` or
  `/PURGE`, `git clean` on another repo, an installer's uninstall, a script
  you write that deletes.
- Files you created yourself outside the root (temp scripts, scratch output)
  are included — leave them, and list them for the owner instead.

## What to do instead

- Need something gone outside the root? Stop, say exactly which paths and why,
  and wait for the owner's yes.
- The memory folders: a deletion in the user-level memory folder (outside the
  root) also needs the owner's yes. Until then, update the memory's content
  (mark it obsolete) rather than deleting the file, and keep the backup copy in
  `.claude/memory` identical to it.
- A tool or command that might delete outside the root as a side effect (a
  clean step, a sync with `/MIR`): check its target first; if it reaches
  outside the root, ask.

Inside the root, normal care still applies: look at the target before deleting,
and prefer reversible actions.
