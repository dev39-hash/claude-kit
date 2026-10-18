# Architecture Decision Records

Format and workflow: `.claude/skills/architecture-decision-records/SKILL.md`.
New ADR: copy `template.md` to `NNNN-short-title.md`, fill it in, add a row here.
This directory is not tracked in git (design-process docs stay out of the library repo).

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-pure-opencv-library-from-reference-module.md) | Build the library by porting the reference matching module, pure OpenCV, no Qt | accepted | 2026-10-13 |
| [0002](0002-keep-reference-naming-convention.md) | Keep the reference code's naming convention instead of Core Guidelines underscore style | accepted | 2026-10-13 |
| [0003](0003-persistence-with-opencv-filestorage.md) | Persist pattern libraries as JSON through cv::FileStorage, no third-party JSON library | accepted | 2026-10-13 |
| [0004](0004-matching-modes-as-strategies.md) | Matching modes as strategies; correlation mode via cv::matchTemplate rotation sweep | accepted | 2026-10-13 |
| [0005](0005-no-picking-concepts-pluggable-conditions.md) | No picking or gripper concepts; two-phase match conditions with built-in clearance zones (edge-only) | accepted | 2026-10-13 |
