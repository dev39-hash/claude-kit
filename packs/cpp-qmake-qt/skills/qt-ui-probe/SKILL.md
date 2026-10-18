---
name: qt-ui-probe
description: Measure Qt widget behaviour instead of reasoning about it - a throwaway offscreen probe application built from the module .pri files that drives real input with QTest and writes findings to a file; plus the Release-loop recipe for catching use-after-free in widget code. Use when a UI question (focus, visibility, click routing, model/view updates) cannot be answered by reading, and when verifying any widget change.
argument-hint: <widget or behaviour to probe>
---

# Qt UI probe (pack cpp-qmake-qt)

Screenshots are not evidence and the human reviews the UI themselves; behaviour is measured
with a probe. Twice the reasoning gave the wrong answer and the probe the right one in
minutes.

## Building a probe

1. In the session scratchpad (or `paths.scratch`), create a tiny console app `.pro` with
   `QT += core gui widgets testlib` that includes the module `.pri` files the widget needs
   (not the app's own `.pri`), and the local `.pri` for package paths.
2. Run it under `QT_QPA_PLATFORM=offscreen`; next to the exe put the Qt runtime DLLs and
   `platforms/qoffscreen.dll` (or use the minimal PATH from `qttest-headless`).
3. `qDebug` / `qInfo` go nowhere from a GUI-linked process: write findings to a `QFile`.
4. Drive real input with `QTest::mouseClick` / `keyClick`, not `setFocus()`; they answer
   different questions.
5. **Click the widget `QApplication::widgetAt()` names, not the one you mean**: a spin box
   with `NoButtons` ignores presses outside its arrows and they propagate to the parent,
   which once reported a focus steal that did not exist.
6. Address `QListWidget` rows through `itemWidget(item(i))`, never `findChildren()`: a
   replaced item widget is released with `deleteLater()` without reparenting, so
   `findChildren()` still sees the old population. Flush with
   `QCoreApplication::sendPostedEvents(nullptr, QEvent::DeferredDelete)` before counting.
7. Record the probe source and its output in the task file's Test report; delete the probe
   afterwards (it lives in the scratchpad, never in the repo).

## Release loop for widget suites

- Build the suite in Release, run it 25-40 times in a loop (`for /l` in a `.bat`, or a
  PowerShell loop) with offscreen, count exits `-1073741819` (`0xC0000005`); run the single
  suspicious slot 40 times with `<exe> <slot>`.
- Any crash is a blocker; attach a debugger (`cdb`) to the crashing run to locate it.
- Typical culprits: a stale `QModelIndex` read by a proxy during a delayed layout after a
  removal; a widget deleted while an event for it is queued; a timer firing after its owner
  died.

## Reporting

```text
Probe:   <what was measured> - <file written>
Finding: <observed behaviour> (expected <...>)
Loop:    <n> runs Release/offscreen, <crashes> crashes, slot <name> x40: <crashes>
```
