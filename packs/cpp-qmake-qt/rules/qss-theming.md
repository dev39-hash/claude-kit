---
paths:
  - "**/*.qss"
  - "**/*.qrc"
  - "**/*.ui"
  - "**/theme_manager.*"
---
# QSS theming with design tokens (pack cpp-qmake-qt)

> From the NichirinLaserMark `ThemeManager` lessons. Applies to projects that use a token
> system (`@{group.token}` placeholders resolved before `setStyleSheet`); `project/rules.md`
> names the token table location and the design-rules document.

- Qt has no QSS variables: a `ThemeManager::resolveTokens(qss, theme)` step substitutes each
  `@{group.token}` with the per-theme value BEFORE `setStyleSheet`. Token values live in code
  (one table); the tracked design-rules doc holds the rules and the name inventory.
- Global sheets (`dark.qss`, `light.qss`) use tokens plus Qt class/property selectors ONLY: no
  per-object `#objectName` rules, tokens over raw hex.
- Per-widget or per-form styling goes in its own sheet (`<form>_dark.qss` / `_light.qss`),
  loaded through the widget's `reloadStyleSheet()` on `themeChanged`, registered in the
  `.qrc`; `#objectName` rules are allowed there and layer over the global sheet.
- Font sizes are tokens too (one per custom-widget role) so each is tuned in one place;
  only the size is a token inside the `font:` shorthand.
- A token used in QSS must exist in the table: an unresolved `@{...}` is left verbatim and Qt
  drops the rule or the WHOLE sheet; this fires even inside `/* comments */`, so never write a
  literal `@{...}`-looking placeholder in QSS prose. If a whole theme stops applying, look for
  an unresolved token or a syntax error first.
- Colours painted from C++ (no stylesheet) fall back to the active `QPalette` and match
  severity to the state tokens.
- New `ui/` widget files are registered in the module `.pri` (SOURCES + HEADERS) or the
  uic-generated `setupUi` fails to link. Promoted widgets are declared at global scope.
- On a code-page machine read and write `.qss` with explicit UTF-8 (`[IO.File]` with
  `UTF8Encoding($false)`), never `Get-Content -Raw`.
