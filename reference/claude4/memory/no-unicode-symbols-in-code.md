---
name: no-unicode-symbols-in-code
description: "Write source code ASCII-only - no em dash, section sign, box-drawing banners, arrows etc. in .h/.cpp/.pro/.pri/.ui/.qss/.ps1/.gitignore comments or strings"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e59a6789-0824-467d-a823-86eff093bc4e
  modified: 2026-10-09T01:10:28.678Z
---

Do not put Unicode symbols in the codebase: no em dash, bullet, section sign, arrows,
multiplication sign, ellipsis, box-drawing banners, curly quotes. Use ASCII: `-`, `section 4.1`,
`->`, `x`, `...`, `# -----` / `// =====` banners.

**Why:** Project Leader, 2026-10-09: the compiler warns on them and they add nothing.

**How to apply:**
- The rule is now written in the tracked `docs/rules/build_and_verification.md`, "Source encoding"
  (table of replacements + the `git grep -I -nP "[^\x00-\x7F]" ...` check). Point there; do not restate.
- Run that check before every commit (no output = clean).
- Exempt: `<translation>` text in `app/translations/*.ts` (each `<source>` mirrors a code string
  and must stay ASCII - change both together, then verify with lupdate on a COPY of the .ts:
  "0 new"), vendored `components/`, Markdown docs, `uml/*.puml`.
- Whole-tree sweep done 2026-10-09 (145 files; .ts sources updated, 675/0; Release + Debug
  build clean, all board-off tests + geometry oracle green).

Related: [[powershell-utf8-source-files]], [[qss-token-theming]].
