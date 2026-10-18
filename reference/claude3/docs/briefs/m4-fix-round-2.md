# Brief M4 fix round 2 (Opus re-review verdict Block)

Not tracked. Previous rounds: `.claude/docs/briefs/m4-persistence.md`, `m4-fix-round.md`.
Rules: `.claude/rules/project.md` (ALL sections). Reviewer probes (scratch, read-only):
`C:\Users\dgb07\AppData\Local\Temp\claude\c--DGB-Project-image-matching\da23465f-c88f-4d7e-b0d2-5fd7fcb59ee2\scratchpad\probe2\`
(`probe2.cpp`, `gen.py`, `docs\{xml,yaml,jsoncomment,yamlflat}\library.json`).
IMPORTANT build note: a previous agent's object file was stale (compiled from a half-saved
source and then considered up to date). Build with `--clean-first` once at the start and at the
end of your work.

## Implementer (all src/include/docs items)

CRITICAL (C2 bypass):
- `readDocument`: after `leadingSkip`, require the first byte to be `{`, else fail
  "not a JSON document" (this disables OpenCV's YAML/XML auto-detection, which ignores
  FORMAT_JSON on read). Reject any NUL byte in the document.
- `prescan`: outside strings, reject `/` (the writer never emits comments; message "comments are
  not supported"). Keep the depth/size caps.

HIGH (names that FileStorage cannot round-trip):
- `MatchGroupConfig::validate()` / `MatchPatternConfig::validate()` (group, pattern and zone
  names) and `MatchGroup::setName` / `renamePattern`: reject names containing control bytes
  (< 0x20 or 0x7F), `"` or `\`, and names whose first and last bytes are both `'`. Document the
  rule next to `kMaxNameBytes`.
- `save()` and `toJson()`: after serializing, parse the produced text with
  `persist::readDocument` (same registry) before any file I/O / before assigning `out`; fail
  with "document does not read back: <reason>" if it fails. This also covers strings written by
  custom condition writers.

MEDIUM:
- `pattern_group_manager_io.cpp` load/fromJson: call `adopt()` (Loaded event) and assign the
  report AFTER the try block, so an observer exception propagates as documented and the
  failure path never runs after the model was replaced.
- `json_schema_read.cpp:288`: no copy when nothing was skipped
  (`std::string trimmed; if (skip) trimmed = json.substr(skip); const std::string& text = skip ? trimmed : json;`).
- `docs/persistence.md`: a pattern without a training image is written with `"image": ""`;
  example uses content-addressed names; "fail with a message instead of crashing" stays only
  with the new guarantees stated precisely (JSON only, no comments, size/depth caps); name rules.

LOW (do them all):
- `writeIfDifferent`: compare the bytes (`existing == bytes`), not size + crc.
- `pattern_image_io.cpp`: pass the size cap into the read (read at most cap+1 bytes, fail if
  more), removing the TOCTOU.
- `<dir>/images` must be a real directory (`symlink_status`), not a symlink/junction, before
  writes and before cleanup; else fail.
- `json_schema_internal.h:101-103`: update the `isSafeRelativePath` doc to the whitelist.
- Rename the second `isSafeRelativePath(fs::path)` in `pattern_group_manager_io.cpp`
  (e.g. `isInsideImagesDir`).
- `include/mtc/pattern_group_manager.h:231`: no internal path in the public comment; split
  `self()` into `const Impl& self() const` and `Impl& self()`.
- Lines over 100 columns: run clang-format (VS LLVM dir) on every file you touched.
- `addGroup`, `setGroupConfig`, `addPattern`, `setPatternConfig`: enforce the Correlation rule
  (no `requiresForeground()` condition, no zones) at mutation time with the same message as the
  reader (reuse one function).

## Tester

Tests for: comment-hidden depth (block and line comment), documents starting with `%YAML` and
`<?xml` rejected, NUL byte rejected, the probe2 documents through load() (copy the generated
documents' shapes into the test, do not read the scratchpad); names `'A'`, `"A"`, `"`, `a\b`,
`a\0b` (std::string with an embedded NUL), tab rejected by validate/addGroup/addPattern/zone;
a custom condition writer that writes a string `'x'` makes save()/toJson() fail and leaves
library.json untouched; observer throwing on Loaded propagates and (document what the model
holds: the new content, as documented); `persist::checkPngHeader` unit tests (16384 accepted,
16385 rejected, 8192x8193 rejected, 8192x8192 accepted, zero side, < 29 bytes, IHDR not first,
wrong chunk length); `crc32("123456789") == 0xCBF43926` against the production function; legacy
fractional box size w=10.5, h=20.6 -> zones of a 10x21 box (cvRound half to even: 10.5 -> 10);
images dir as a junction/symlink rejected (skip with reason when not creatable); Correlation
rule at addGroup/addPattern.

## Common

BUILD: slots (tags m4fix2-impl, m4fix2-test), configure with every option explicit:
`-G "Visual Studio 18 2026" -A x64 -DOpenCV_DIR="$BINPICK_OPENCV_DIR" -DMTC_WARNINGS_AS_ERRORS=ON -DBUILD_SHARED_LIBS=OFF -DMTC_BUILD_TESTS=ON -DMTC_BUILD_REFERENCE_HARNESS=OFF`.
Use `cmake --build <slot> --config Debug --parallel 8` (never `-- /m` from Git Bash).
Do not kill processes you did not start. Release slots at the end. SUB-AGENTS: workers model
"sonnet"; reviews model "opus". Do not commit. Report per item with file:line and test counts.
