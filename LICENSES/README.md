# Third-party licences carried by the packs

The kit's own files (core, installer, pack rules and tools written for the kit) carry no
licence file of their own. The texts below cover the third-party material that some packs
vendor or adapt. Each pack also ships the licence file that applies to it, so an installed
`.claude/packs/<pack>/` stays self-contained; the copies here are the canonical texts and
this index says which files they cover.

| Licence | File here | Copy in the pack | Covers |
|---|---|---|---|
| MIT (ECC, Everything Claude Code) | `ECC-MIT.txt` | `packs/cpp-cmake-gtest/LICENSE-ECC-MIT.txt`, `packs/cpp-qmake-qt/LICENSE-ECC-MIT.txt` | `cpp-cmake-gtest`: skills `cpp-coding-standards`, `cpp-testing` (verbatim), rules `cpp-*.md` and `cmake-build-errors.md` (adapted), agent `silent-failure-hunter` (adapted). `cpp-qmake-qt`: rules `qt-coding-style`, `qt-patterns`, `qt-security` (adapted). Core: skills `verification-loop`, `tdd-workflow`, `architecture-decision-records`, `change-impact`, agents `explorer`, `build-resolver` (rewritten, origin noted in each file). `controller-kernel`: skill `kernel-verify` (through the core skill). `docs-spec-driven`: the decision-record workflow (adapted) |
| BSD 3-Clause (The Qt Company agent-skills) | `QT-AGENT-SKILLS-BSD-3-CLAUSE.txt` | `packs/cpp-qmake-qt/LICENSE-QT-AGENT-SKILLS.txt` and `LICENSE.txt` inside each vendored skill | `cpp-qmake-qt`: skills `qt-cpp-review`, `qt-cpp-docs` (verbatim) |
| MIT (community agent-skills collection) | `AGENT-SKILLS-MIT.txt` | `packs/agent-skills-lite/LICENSE-AGENT-SKILLS-MIT.txt` | `agent-skills-lite`: the six skills and two references (verbatim) |

Everything not listed is project-written for the kit: `work-package`, `controller-kernel`
(except `kernel-verify`), `hooks-powershell`, the core hooks, the installer, the templates.

When a pack adds third-party material: put the licence text here and in the pack, add the
row above, and note the origin at the top of each adapted file.
