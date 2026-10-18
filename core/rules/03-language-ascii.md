# Language and encoding

Always loaded. Extension lists live in `.claude/kit.config.json` (`encoding`); the `guard-edit`
hook rejects non-ASCII content written into a code file.

- Code, comments, commit messages and repository docs are **English**. Conversation with the
  human is in `project.replyLanguage` (Vietnamese by default); identifiers, paths and
  technical terms stay English inside it.
- Files whose extension is in `encoding.asciiExtensions` are **ASCII only**, comments included
  (MSVC C4819/C4566 and code-page machines). Paths in `encoding.asciiExempt` (vendored code,
  translation files) are exempt. Markdown under `.claude/` is exempt; `README.md` and `docs/`
  in the repo are not.
- Substitutions: dash `--` or `-`; arrows `->` `<-` `=>`; multiplication `x`; degree `deg`;
  plus-minus `+/-`; ellipsis `...`; straight quotes `"` `'`; no box drawing, no emoji.
- A character the program must display goes in as an escape (`u"\u00B0"`, `QChar(0x00B0)`) or
  through a translation file, never as a literal.
- When touching a line that holds a non-ASCII character, make that line ASCII; do not sweep
  the rest of the file unless the task says so.
- On a non-UTF-8 code-page machine never pipe a source file through
  `Get-Content | Set-Content`, `Out-File` or `>`; use the Edit/Write tools or
  `[IO.File]::WriteAllText(path, text, UTF8Encoding($false))`.
- Hook scripts and `.bat`/`.ps1` files are ASCII. Write `.bat` files with the Write tool, not
  with a shell heredoc.
