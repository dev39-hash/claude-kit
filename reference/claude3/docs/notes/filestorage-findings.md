# cv::FileStorage JSON findings (task 1.11 spike, OpenCV 4.14.0, MSVC, 2026-10-13)

Pinned by tests/unit/filestorage_assumptions_test.cpp. Input for the M4 json_schema brief.

## Works

- v3-shaped document (version, groups[], typeConfig map, patterns[], clearanceZones[] with
  polygon) round-trips in MEMORY mode with FORMAT_JSON; maps in arrays and arrays in maps OK.
- Doubles bit-exact (0.9, 0.123456789012345, 1/3). INT_MAX round-trips as int. 2^40 only as
  a double: persist integers wider than 32 bits as double.
- int/double conversions never throw: double node read as int truncates; int as double OK;
  string read as int gives an unspecified value (do not rely on it).
- Missing key: node.isNone() and empty() both true, reads yield 0 or the default given to
  cv::read(node, v, default). An existing empty array/map has isNone() false and empty()
  true: test presence with isNone(), not empty().
- UTF-8 string values round-trip byte-exactly as RAW bytes; \" escapes handled.
- The parser does NOT support backslash-u escapes (throws "currently not supported"): the
  writer must emit raw UTF-8, and hand-edited files with such escapes fail to load (pinned).
- Legacy v2 (Qt-shaped) documents parse fully: unknown top-level keys ignored, objects
  nested in arrays iterate, true/false literals, integral literals, scientific notation,
  negative reals (Qt writes non-ASCII as raw UTF-8, so real v2 files load). v0/v1-only keys
  detected via isNone().
- Empty string, empty array, empty map round-trip.

## Pitfalls

- bool is written as true/false and reads back as an INT node (1/0); there is no isBool.
  Read with static_cast<int>(node) != 0.
- Keys starting with a digit throw on write. '-' and spaces in keys are accepted but the
  schema uses only [A-Za-z_][A-Za-z0-9_]*.
- Non-ASCII paths on Windows: path::string() may throw (outside ANSI code page) and
  FileStorage(file) fails to open the UTF-8 bytes. Always do I/O with std::ifstream /
  std::ofstream on std::filesystem::path in binary mode and parse/emit through MEMORY mode.
  Never pass a path to FileStorage.
- Top-level array is rejected; malformed input gives isOpened() == false or throws
  cv::Exception: wrap in try/catch and check isOpened(). Duplicate keys: first value wins.

## Schema conventions for M4

- Points/polygons as FLAT arrays [x0,y0,x1,y1,...]; check even length on read.
- Booleans written true/false, read as int != 0.
- Wide integers as double.
- Version sniffing: read "version" first; isNone() means legacy v0.
- Optional fields via cv::read(node, v, default); gripper-geometry fallbacks via isNone().
- Names (group/pattern/zone) are values, never keys: UTF-8 safe.
- File I/O: bytes + MEMORY mode, as above.
