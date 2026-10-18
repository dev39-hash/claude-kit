---
name: qss-token-theming
description: How theming works (ThemeManager token system) + qss rules for this project
metadata: 
  node_type: memory
  type: reference
  originSessionId: fa698ee3-4ad0-40d9-adea-e1856997d8f7
---

Written rules live in **`docs/rules/ui_design_rules.md`** (created 2026-07-21; §5 colour
groups, §5.10 font tokens, §6 direct-painted colours, §7 palette sync — the § numbers are
referenced from code comments, keep them stable). Token VALUES stay in `tokenTable()` (code),
the doc holds rules + name inventory only.

Theming = `ThemeManager` (`src/core/utils/theme_manager.{h,cpp}`) token system. QSS uses
**`@{group.token}` placeholders** (e.g. `@{bg.surface}`, `@{border.default}`,
`@{accent.primary}`) — Qt has no QSS variables, so `ThemeManager::resolveTokens(qss, isDark)`
substitutes each token with the per-theme hex/rgba from the §5 token table (in
`theme_manager.cpp`) BEFORE `setStyleSheet`. `apply()` does this for the installed style;
`main.cpp` calls `ThemeManager::instance()` at startup; the Control > Theme > Dark/Light menu
(`mainwindow.cpp`) calls `applyStyle()`.

**Font-size tokens (2026-07-21):** the same `@{...}` mechanism now also carries **font sizes**
(§5.10 in `tokenTable()`), one token **per custom-widget role** so each is tuned in one place —
`font.qlabel.normal` (global base `QLabel`), `font.statuslamp.{name,state}`, `font.connectionstate`,
`font.sendstatehint`, `font.statustext`, `font.typechip`, `font.statepill`,
`font.eventlog.{time,level,source,message}`, `font.signalmonitor.{name,risingedge,value}`,
`font.runtime.{section,caption,value,button}` (RuntimeForm HMI). Font size is **theme-independent**: each token's
`{dark, light}` pair holds the SAME value (owner chose to unify — before this, `dark.qss` and
`light.qss` had diverging per-role sizes). Values were seeded from the light/design set, then
the owner tunes them directly in the §5.10 table (single point of control — the whole reason
for the tokens). Used inside the `font:` shorthand as `font: 700 @{font.statustext} "Segoe UI";`
(only the size is a token; weight/family stay literal).

**Rules for qss (owner feedback):**
- Global `dark.qss` / `light.qss` (`:/styles/`, loaded by ThemeManager) must use **tokens** +
  Qt **class/property** selectors ONLY. **No literal per-object `#objectName` rules** in the
  global files, and prefer tokens over raw hex.
- Per-widget/per-form complex styling goes in its **own** qss (`signals_monitor_widget_*.qss`;
  `runtime_form_*.qss` — a per-FORM sheet targeting the form's children by `#objectName`, which
  IS allowed here), loaded via `reloadStyleSheet()` (read the `_dark`/`_light` file for the active
  theme → `resolveTokens()` → `setStyleSheet`, re-run on `themeChanged`), and MUST be added to
  `resrc.qrc`. The form's own base styles (StatusLamp/FrameBox/QPushButton/QLabel) still come from
  the global sheet; the per-form `#objectName` rules layer on top (more specific → they win).
- A token used in qss must exist in the §5 table or `resolveTokens` leaves it verbatim (→ Qt
  drops that rule) and logs once — this fires even inside a `/* comment */`, so don't write a
  literal `@{...}`-looking placeholder in qss prose.

**Gotchas:**
- The reference-codebase `@{...}` tokens broke the theme until `resolveTokens` was wired into
  `apply()` (else Qt can't parse `@{...}` and drops the WHOLE sheet). If a whole theme stops
  applying, check for an unresolved `@{...}` / stray syntax error.
- Editing qss on this CP932 machine: read/write with **explicit UTF-8** (`[System.IO.File]`
  ReadAllText/WriteAllText UTF-8) — `Get-Content -Raw` mis-decodes the box-drawing comment chars.
- New `ui/` widget files must be registered in `src/ui/ui.pri` (SOURCES+HEADERS) or they don't
  compile → link error from the uic-generated `setupUi`. Dead ADS (`ads--*`) styling was removed
  from the global qss (app uses `QStackedWidget`, not Advanced Docking).

Related: [[project-status]].
