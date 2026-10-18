# Brief M4 fix round (Opus review verdict Block)

Not tracked. Base spec: `.claude/docs/briefs/m4-persistence.md`. Rules: `.claude/rules/project.md`
(ALL sections: ASCII, vocabulary gate with the single exemption `src/model/legacy_keys.cpp`, no
references to untracked documents in tracked files, English only). M4 is uncommitted; work on the
working tree as is. Probe sources the reviewer used (scratch, read-only for you):
`C:\Users\dgb07\AppData\Local\Temp\claude\c--DGB-Project-image-matching\da23465f-c88f-4d7e-b0d2-5fd7fcb59ee2\scratchpad\probe\{probe.cpp,pgm.cpp}`.

Three agents run in parallel: implementer A (schema/reader/validation), implementer B (manager,
image I/O, docs), tester (tests for every item). Do not edit the other agent's files; if you
need something from the other side, state the assumption in your report.

## Implementer A: files `src/model/json_schema*.{h,cpp}`, `src/model/json_node_reader.cpp`,
## `src/model/condition_registry.cpp`, `src/model/json_schema_legacy.cpp`, `src/model/legacy_keys.*`,
## `src/model/match_group.cpp` / `src/model/match_pattern*.cpp` (validate only), the config headers' docs

- C2: in `readDocument`, BEFORE building any cv::FileStorage, pre-scan the bytes: reject size >
  `kMaxDocumentBytes` (64 MiB, constexpr in `json_schema.h`); track string state (honour backslash
  escapes) and `{`/`[` nesting depth; reject depth > `kMaxDocumentDepth` (32). Clear message. Leading
  UTF-8 BOM and whitespace remain accepted.
- H1 + LOW path: `isSafeRelativePath` becomes a whitelist: exactly `images/<name>.png` where
  `<name>` matches `[A-Za-z0-9_.-]+` (so no further separators, no ':', no backslash, no invalid
  UTF-8, no non-ASCII), name not `.`/`..`-only, and not a Windows device name (CON, PRN, AUX, NUL,
  COM1-9, LPT1-9, case-insensitive, with or without extension). Reject in the reader with the
  pattern context path.
- H4 + LOW: `MatchGroupConfig::validate()` rejects null entries in conditions and setConditions,
  negative group index, and names longer than `kMaxNameBytes` (255 bytes, public constexpr next to
  the config; same check in `MatchPatternConfig::validate()` for pattern names and zone names).
  Empty names stay rejected/accepted exactly as today. The writer also refuses a null condition
  defensively (no deref).
- M1: `finalizeGroup` rejects a Correlation group that has a condition with
  `requiresForeground()` or any pattern with clearance zones (context path in the message), matching
  the ImageMatcher rule. Legacy path keeps its drop-with-warning behaviour.
- M7: built-in condition readers report the failing key; `readCondition` returns a message that
  contains the key and the caller adds `conditions[i]` / `setConditions[i]` to the context.
- Legacy fidelity: the reference built box sizes as integer `cv::Size` from floats. Read
  `reference_source/matching/` (computeCollisionGeometry or equivalent) to confirm the exact
  conversion (truncate vs round) and apply the same to legacy sizes before `opposedBoxZones`.
  Report what you found with file:line.
- LOW: v1 document with both the nested and the flat angle uses the nested one (verify, keep).

## Implementer B: files `include/mtc/pattern_group_manager.h`, `src/model/pattern_group_manager*.{h,cpp}`,
## image I/O helpers used by the manager, `docs/persistence.md`

- C1: removeGroup/removePattern/renameGroup/renamePattern (and any other mutator taking a name
  that may alias stored state) copy the names into locals before mutating; events use the copies.
- H2 + M2: before decoding a pattern image: `fs::file_size` <= `kMaxImageFileBytes` (128 MiB);
  the first 8 bytes are the PNG signature; parse the IHDR chunk (must be the first chunk) and reject
  width or height 0, > `kMaxImageSide` (16384) or width*height > `kMaxImagePixels` (64 Mpx); then
  `cv::imdecode(..., IMREAD_GRAYSCALE)` and require CV_8UC1 non-empty. Constants are public
  constexpr in the manager header (documented) or an internal header: your choice, documented.
  Use `symlink_status` and require a regular file (no symlink, device, FIFO).
- H1: wrap every `u8path`/path conversion in load and save so no std::exception escapes; return a
  ManagerResult naming the pattern.
- H3: image file names are content-addressed: `images/g<G>_p<P>_<crc32 8 lowercase hex>.png`
  where the crc32 is over the encoded PNG bytes (implement a small table-based CRC-32 internally,
  no new dependency). If the target already exists with identical size and crc, skip writing.
  Never overwrite a file referenced by the CURRENT on-disk library.json. Order: write new images,
  write JSON to `library.json.tmp`, flush+close, rename over library.json, then remove
  unreferenced generated images. `isGeneratedImageName` matches exactly
  `g(0|[1-9][0-9]*)_p(0|[1-9][0-9]*)(_[0-9a-f]{8})?\.png` (old-style names included), compared on
  the native wide name so non-UTF-16 names cannot throw (M9); everything else in `images/` is left
  alone. On a failed JSON write remove `library.json.tmp`.
- M3: check `fs::file_size(library.json)` <= `kMaxDocumentBytes` before reading (use the constant
  from `src/model/json_schema.h`; A adds it: if it is not there yet when you build, add
  `constexpr std::size_t kMaxDocumentBytes = 64u * 1024u * 1024u;` in `json_schema.h` yourself and
  say so). Avoid the extra copies (trimLeading returns an offset or a string_view).
- M4: dispatch skips observers removed during dispatch (look up by id before each call);
  observers added during dispatch get the next event, not this one. Document reentrancy (mutating
  the manager from an observer is allowed but the observer sees later events after the current
  one finishes dispatching; or forbid it and document: your choice, keep it safe).
- M5: setGroupConfig/setPatternConfig that change the name carry the previous name in oldName.
- M6: build the stored copy without cloning rawImage (copy every field except the image).
- LOW: toJson leaves `out` unchanged on failure (serialize into a local); load() fills the caller's
  report only on success (or clears it on failure: document which); moved-from manager: document
  and add an assert in debug.
- Docs `docs/persistence.md`: say "pattern without a training image" instead of the internal
  field; document the file layout with content-addressed names, the save order, stale-image
  cleanup rule, the input limits (document size, depth, image limits, path whitelist, name
  length) and the Correlation+clearance rejection. Self-contained, no links outside the repo.

## Tester: `tests/unit/json_schema_test.cpp`, `tests/unit/pattern_group_manager_test.cpp`
## (new files allowed if a file passes ~800 lines, e.g. `pattern_group_manager_io_test.cpp`)

Write tests for: (1) aliasing names in removeGroup/removePattern/renameGroup/renamePattern with an
observer (payload correct, no crash); (2) depth-10000 document fails cleanly via readDocument and
fromJson, oversized document (> 64 MiB, build it in memory once) fails; (3) image path rejection:
`../x.png`, `/x.png`, `C:x.png`, `images/x.png:ads`, `images\\x.png`, `images//x.png`, invalid
UTF-8 bytes, `images/CON.png`, `images/a/b.png`, `x.png` (not under images/), accepted
`images/g0_p0_0123abcd.png`; (4) PNG with IHDR declaring 100000x100000 rejected before decode
(craft the bytes: signature + IHDR with valid crc is not needed if the code does not check crc;
make the test independent of that by writing a correct crc), non-PNG bytes under a .png name
rejected, 16-bit and 3-channel PNGs load as CV_8UC1; (5) save after removing group 0 never
overwrites a file the previous library.json references (check file contents of the old names are
unchanged before the rename by saving into a dir where the old document is kept and comparing),
and the old library still loads pixel-equal when the JSON rename is made to fail (e.g. make
`library.json.tmp` a directory so the write fails); (6) stale cleanup: unreferenced generated
images removed, `G0_P0.PNG`, `g0_p0.png.bak`, `g01_p1.png`, `notes.png` survive; (7) null condition
rejected by addGroup and by validate; negative group index and a 256-byte name rejected; (8) v3
Correlation group with a Clearance condition or zones rejected; (9) duplicate group name/index and
duplicate pattern name/index in a document rejected, manager unchanged; (10) leading BOM and
whitespace accepted, v1 nested angle wins; (11) observer removing another observer during
dispatch: the removed one is not called; observer calling clear() during dispatch does not crash;
(12) setGroupConfig renaming reports oldName; (13) a condition read error names the key and
`conditions[0]`; (14) M8: replace the non-ASCII literal in pattern_group_manager_test.cpp with
escapes. Tests that cannot be made deterministic on Windows (permissions) are skipped with a
reason rather than flaky. Allocation: none. Report which tests are RED against the current tree
and why.

## Common

BUILD: `SLOT=$(node .claude/tools/wt-slot.js acquire <tag>)` (tags: m4fix-a, m4fix-b, m4fix-test);
configure in the slot with every option explicit:
`-G "Visual Studio 18 2026" -A x64 -DOpenCV_DIR="$BINPICK_OPENCV_DIR" -DMTC_WARNINGS_AS_ERRORS=ON -DBUILD_SHARED_LIBS=OFF -DMTC_BUILD_TESTS=ON -DMTC_BUILD_REFERENCE_HARNESS=OFF`
(cmake at `/c/Program Files/Microsoft Visual Studio/18/Community/Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/`).
Build only the targets you need (another agent's half-done edits may break other targets for a
while; if a failure is in the other agent's files, wait a minute and retry, do not fix it).
Release the slot at the end. SUB-AGENTS: workers model "sonnet"; reviews model "opus".
Do not commit. Report: changes per item, test results, anything not done and why.
