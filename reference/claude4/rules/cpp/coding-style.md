---
paths:
  - "**/*.cpp"
  - "**/*.h"
  - "**/*.pro"
  - "**/*.pri"
---
# C++ Coding Style (NichirinLaserMark)

Qt 5.15.2 / C++17 / MSVC 2019 32-bit. Match the surrounding code first; these
rules describe what the codebase already does.

## Language level

- C++17 only (no C++20/23 features — MSVC 2019 + Qt 5.15 kit).
- Use `auto` when the type is obvious from context; `constexpr` for compile-time constants.
- Prefer Qt types at Qt boundaries (`QString`, `QByteArray`, `QVector`, `QHash`)
  and the standard library inside pure logic, as the surrounding module does.

## Ownership

- Qt parent/child ownership is the default for `QObject`s (`new Foo(parent)`).
- Non-`QObject` heap objects: `std::unique_ptr` / `std::make_unique`.
- No raw owning pointer without a parent; `deleteLater()` for `QObject`s that may
  still have pending events.

## Naming

- Namespace `vc::` (module sub-namespaces as existing code uses them).
- Types: `PascalCase`. Functions/methods: `camelCase`.
- Members: `m_` prefix (`m_config`). Constants: `kPascalCase` (`kRcAxisError`).
- File names: `snake_case.h/.cpp`, registered in the owning module's `.pri`.

## Includes and layering

- Includes are module-qualified from `src/` (`device/laser/...`); no `..` escapes,
  no `src/` prefix.
- Lower modules never include higher ones (enforced by
  `tests/architecture_contract_test`).

## Text and comments

- Code, comments, and log strings in English.
- Comments reference only tracked repo content — see `.claude/rules/code-comments.md`
  (ADR as `ADR Dn`; no plan/request phases).
- Headers: Doxygen `/** */` per `docs/rules/doc_comment_style.md`.
- Code is ASCII only (comments and strings; `.ts` translations and `components/`
  exempt) - `docs/rules/build_and_verification.md`, "Source encoding". Every
  `.pro` still passes `/utf-8`; never rewrite a source file through PowerShell
  `Get-Content`/`Set-Content` (the machine is CP932).

## Build files

- Do not hard-code new absolute paths in `.pro`/`.pri` — local tool paths come
  from the environment (`docs/rules/build_and_verification.md`, intro).

## UI colours and styling

- Colours/fonts in qss go through `ThemeManager` design tokens; colours painted
  from C++ (no stylesheet) follow `docs/rules/ui_design_rules.md` §6 — fall back
  to the active `QPalette`, and match severity colours to the §5.5 state tokens.

## Formatting

- No clang-format config exists — keep the formatting of the file you edit.

See the `cpp-coding-standards` skill for general C++ Core Guidelines.
