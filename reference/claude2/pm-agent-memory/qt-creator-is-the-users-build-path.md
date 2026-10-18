---
name: qt-creator-is-the-users-build-path
description: "The user builds directly in Qt Creator, so build configuration must live in the qmake project, not in shell environment variables."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e98fdcf1-2c13-48a6-a0ae-3cb544df894f
  modified: 2026-08-23T03:08:52.023Z
---

The user builds this project **directly in Qt Creator**, not from a terminal. When asked
on 2026-08-23 how to handle the missing `OPENCV_*` / `PYLON_*` build variables, they chose
"configure it in the Qt project so you and I share one environment" over setting Windows
user-scope environment variables.

**Why:** Qt Creator inherits whatever environment launched it. An agent that exports
variables in its own shell and a developer building in the IDE can silently resolve two
different OpenCV installs. Configuration that qmake itself reads is the only thing both
paths share.

**How to apply:** put machine-local dependency paths in `qmake/local_paths.pri` (untracked;
template at `qmake/local_paths.pri.example`), read as a *fallback* after the command line
and the environment so `AGENT.md`'s "local paths come from environment variables" rule
still holds. Do not propose exporting variables in a shell as the fix, and do not change
Windows environment variables without asking.

Related: [[phase-6-work-is-untracked]]
