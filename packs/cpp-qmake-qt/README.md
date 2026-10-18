# Pack cpp-qmake-qt

Qt applications and libraries built with qmake and MSVC (nmake or jom) on Windows, tested
with QtTest, Qt 5 or Qt 6. Derived from the `.claude` folders of two earlier Qt projects
(ECC rules adapted) and The Qt Company's agent-skills pack. Install with
`node install.js --target <project> --packs cpp-qmake-qt`.

## Contents

| Path | Installed as | What |
|---|---|---|
| `rules/qt-coding-style.md` | `.claude/rules/cpp-qmake-qt/` (cpp, h, pro, pri) | language level, Qt ownership, naming by codebase, `.pri` registration, includes, `/utf-8`, build files |
| `rules/qt-patterns.md` | same (cpp, h) | RAII, value semantics, errors, threading (queued signals, metatypes, state not edge), config compatibility, model/view |
| `rules/qt-security.md` | same (cpp, h) | memory, SDK boundaries, untrusted PLC/scanner/file input, hardware side effects, secrets |
| `rules/qt-testing.md` | same (tests, `*_test.cpp`, pro) | one project per suite, headless run, shape check, Release loop, oracles, fakes |
| `rules/qmake-build-errors.md` | same (pro, pri) | qmake / moc / uic / MSVC error table for the build-resolver |
| `rules/qss-theming.md` | same (qss, qrc, ui) | design-token QSS rules and gotchas |
| `skills/qmake-msvc-build/` | `.claude/skills/` | vcvars via `.bat`, qmake before make, umbrella `.pro`, worktrees, triage, report |
| `skills/qttest-headless/` | `.claude/skills/` | writing and running QtTest suites alone, minimal PATH, results file, shape check, Release loop |
| `skills/qt-ui-probe/` | `.claude/skills/` | offscreen probe app instead of screenshots; Release-loop recipe |
| `skills/qt-cpp-review/`, `skills/qt-cpp-docs/` | `.claude/skills/` | The Qt Company agent-skills pack, vendored verbatim (BSD-3-Clause) |
| `hooks/settings.fragment.json` | merged into `.claude/settings.json` | read-only permissions (`tasklist`, `Get-Process`, `qmake -v`) |

The vendored Qt skills are kept byte-for-byte (they contain non-ASCII characters; vendored
code is exempt from the kit's ASCII rule). `qt-cpp-review` runs its linter with a path
relative to the skill folder: from the project root call
`python .claude/skills/qt-cpp-review/references/lint-scripts/qt_review_lint.py <files>`.
Its six parallel review agents must be spawned with `model: <models.worker>` (kit rule 00);
its `qt-cpp-docs` output goes to `doc/` folders next to sources and ends with an
"AI assistance" footer: strip that footer and keep generated docs out of the repo unless
`project/rules.md` allows them (kit rule 02).

## Config keys (`kit.config.json`)

```json
"encoding": { "codePage": "cp932", "asciiExempt": ["*.ts", "components/", "3rdparty/"] },
"processes": { "neverLaunch": ["app_name", "app_runtime"], "neverKill": ["app_name", "app_runtime"],
               "busyBeforeTests": ["cl", "link", "nmake", "jom"], "testPorts": [25101, 25102] },
"build": { "isolation": "worktrees", "worktrees": { "dir": ".wt", "count": 4, "prepareCommand": "" } },
"packConfig": {
  "cpp-qmake-qt": {
    "vcvars": "C:/Program Files (x86)/Microsoft Visual Studio/2019/Community/VC/Auxiliary/Build/vcvarsall.bat",
    "vcvarsArch": "x86",
    "qtBin": "C:/Qt/5.15.2/msvc2019/bin",
    "jomExe": "C:/Qt/Tools/QtCreator/bin/jom/jom.exe",
    "umbrellaPro": "project_all.pro",
    "buildDir": "build/cli/{cfg}",
    "binDir": "build/bin/{cfg}",
    "localPri": "qmake/local.pri",
    "minimalPath": ["{qtBin}", "<package runtime dirs>", "{binDir}", "C:/Windows/System32"],
    "widgetSuites": ["<suites that need offscreen>"],
    "uiTestLoops": 25
  }
}
```

The values above are examples; the real ones are the project's and live in
`.claude/project/build-env.md` as well.

## What stays in the project layer

Namespace and naming, error strategy (exceptions or none), module layering and the
architecture-contract test, the token table and design-rules doc, hardware gates and opt-in
environment variables, suite names and baselines, the two-machine bundle workflow (pack
`work-package`): all in `.claude/project/rules.md` and `build-env.md`.

## Licences

Adapted ECC rules: affaan-m/ECC, MIT (`LICENSE-ECC-MIT.txt`). `qt-cpp-review` and
`qt-cpp-docs`: The Qt Company Ltd, BSD-3-Clause (`LICENSE-QT-AGENT-SKILLS.txt`; each skill
folder carries its own copy).
