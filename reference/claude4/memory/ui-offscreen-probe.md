---
name: ui-offscreen-probe
description: "How to actually MEASURE Qt widget behaviour in this repo (no ui test target, no screenshots) — a throwaway offscreen probe app"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1755aee4-764a-4565-a94a-2f8acdf94b0d
  modified: 2026-08-25T02:50:32.169Z
---

There is no `ui` test target and I must not screenshot (see [[no-ui-screenshots]]),
but UI behaviour can still be measured: build a throwaway app in the scratchpad
that includes `core/device/runtime/marking/ui` `.pri` files (not `app.pri`), runs
under `QT_QPA_PLATFORM=offscreen`, and writes findings to a file.

**Why:** twice now, reasoning about focus/visibility gave the wrong answer and the
probe gave the right one in minutes. It also catches false positives before they
ship.

**How to apply:**
- Copy Qt5Core/Gui/Widgets/Network(/Test).dll and `platforms/qoffscreen.dll` next
  to the probe exe.
- `qDebug`/`qInfo` go nowhere from a GUI-linked process — write to a `QFile`.
- Drive real input with `QT += testlib` + `QTest::mouseClick`, not `setFocus()`;
  they answer different questions.
- **Click the widget `QApplication::widgetAt()` names, not the one you mean.**
  `QTest::mouseClick(spinBox, …)` is NOT a real click: with `NoButtons`,
  `QAbstractSpinBox` ignores presses outside its arrows and they propagate to the
  parent — this reported a focus steal that does not exist.
- Address `QListWidget` rows via `itemWidget(item(i))`, never `findChildren()`:
  a replaced item widget is released with `deleteLater()` **without** reparenting,
  so `findChildren()` still sees the old population. Force it out with
  `QCoreApplication::sendPostedEvents(nullptr, QEvent::DeferredDelete)`.
