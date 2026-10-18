---
paths:
  - "**/*.cpp"
  - "**/*.h"
  - "**/*.pro"
  - "**/*.pri"
---
<!-- Adapted for ncr_picking from ECC rules/cpp/patterns.md (MIT, (c) 2026 Affaan Mustafa,
     https://github.com/affaan-m/ECC). Changes: C++17 only, Qt ownership and error idioms added,
     CMake globs removed. -->

# C++ patterns (ncr_picking, Qt 6 + C++17)

- **RAII.** Tie every resource (file, socket, SDK handle, camera buffer, lock) to an object lifetime.
  Release on every exit path, including early returns and exceptions.
- **Ownership is explicit.** A `QObject` is owned by its Qt parent, or by exactly one smart pointer,
  never both. `std::unique_ptr` by default, `std::shared_ptr` only for real shared ownership. A raw
  pointer or `QPointer` is an observer, never an owner. `deleteLater()` for objects that may still get
  events.
- **Rule of Zero / Five.** Prefer classes that need no custom special members; if you define one of
  destructor / copy / move, handle all five. `QObject` subclasses are non-copyable (`Q_DISABLE_COPY`
  is implied).
- **Value semantics.** Small types by value, large by `const&`, return by value, move sink parameters.
  Remember `cv::Mat` and Qt implicitly shared types copy cheaply but share data.
- **Errors.** Use `std::optional` for "may be absent". Qt APIs report by `bool`/status or signal —
  check them. Exceptions only for exceptional conditions, caught before a thread boundary. No
  `std::expected` (C++23).
- See the `cpp-coding-standards` skill for the full guidelines with the project addendum.
