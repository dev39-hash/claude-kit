---
paths:
  - "**/*.cpp"
  - "**/*.h"
---
<!-- Adapted for ncr_picking from ECC rules/cpp/security.md (MIT, (c) 2026 Affaan Mustafa,
     https://github.com/affaan-m/ECC). Changes: CI, CMake sanitizer, clang-tidy and cppcheck lines
     removed (no CI, qmake/MSVC toolchain); Qt-parent exception and external-input rules added. -->

# C++ safety and security (ncr_picking)

## Memory safety
- No `new`/`delete` for ownership except a `QObject` handed to a Qt parent; otherwise smart pointers.
- No C-style arrays, `malloc`/`free` or raw scratch buffers without an RAII owner.
- Avoid `reinterpret_cast`; justify it in a comment where an SDK API forces it.

## Buffers and indices
- `QString`/`std::string` over `char*`; no `strcpy`, `strcat`, `sprintf`.
- Range-check every index, size and ROI before use. `cv::Rect`/`cv::Range` from configuration must be
  clipped to the image (`rect & cv::Rect(0, 0, img.cols, img.rows)`) before `img(rect)`.

## External input is untrusted
- Project files (JSON, the project database), PLC replies (MC, Modbus), camera SDK data and
  vision-output sockets are external input: validate type, range and length before use, and fail loudly
  (log with context, fault, refuse to load) instead of falling back silently.
- No `QProcess`/`system()` with strings built from external input.
- No credentials, keys or machine-specific paths in tracked files; machine paths live in the untracked
  `qmake/local_paths.pri`.

## Undefined behaviour
- Initialise every variable; no signed overflow; never dereference null or dangling pointers — check
  `findChild`, `qobject_cast`, `dynamic_cast` and registry lookups.
- Optional on MSVC: `/fsanitize=address` in a local Debug build to chase a memory bug; never commit it
  to the project files without the PM's approval.
