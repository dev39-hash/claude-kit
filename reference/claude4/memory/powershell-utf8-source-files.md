---
name: powershell-utf8-source-files
description: Never rewrite repo source files with PowerShell Get-Content/Set-Content on this CP932 machine — it silently mangles UTF-8 comments
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1755aee4-764a-4565-a94a-2f8acdf94b0d
  modified: 2026-10-07T00:13:10.980Z
---

Never edit repo source files through a PowerShell `Get-Content ... -replace ... | Set-Content`
round-trip on this machine. Use the Edit tool instead.

**Why:** the system ANSI codepage is CP932, so `Get-Content` without `-Encoding`
decodes UTF-8 bytes as Shift-JIS and `Set-Content` re-encodes the mojibake as
UTF-8 — permanently. It hit `tests/runtime_test/main.cpp` on 2026-08-03: the
comment characters `─` `—` `→` were destroyed, and with no git in this repo
([[project-status]]) there was nothing to revert to.

**Update 2026-10-07:** the repo is now under local git ([[git-local-repo]]), so a
mangled file can be restored with `git checkout -- <file>` — but the rule itself
still stands; prevention beats recovery.

**How to apply:** for bulk edits use Edit with `replace_all`. If a scripted pass
is unavoidable, use `[System.IO.File]::ReadAllText($p,[Text.Encoding]::UTF8)` and
`WriteAllText(..., New-Object Text.UTF8Encoding($false))` — never the cmdlets.
Recovery, if it happens again: re-encode the text through CP932 and decode as
UTF-8, then repair the leftovers (each mangled `—`/`→` also swallows the space
after it and comes back as a stray `E`). Verify by listing every non-ASCII code
point in the file — this codebase only ever uses U+2014, U+2192 and U+2500.
