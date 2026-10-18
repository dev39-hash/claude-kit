#!/usr/bin/env node
// Shared gate engine for the controller kernel. Used as a CLI and as a module.
//
//   node .claude/tools/gate-check.js --all            walk the repo (include/ examples/ qt/ tests/ src/
//                                                     cmake/, CMakeLists.txt, *.cmake, README.md, docs/**/*.md)
//   node .claude/tools/gate-check.js <files...>       check just those files
//   const { checkFile, checkAll, GATES } = require('./gate-check.js')
//
// Output: one line per finding, `path:line:col [GATE] message`. Exit 1 if any finding has severity
// error, else 0 (warnings never fail). Skipped everywhere: build*, out, .git, .claude, node_modules.
//
// "Pure core" = include/ctrl_kernel/** and every directory named core or *_core.
//
// Gates (intent):
//   ASCII        error    No byte > 0x7F in code (.h .hpp .cpp .cc .cxx .ipp, CMakeLists.txt, .cmake,
//                         .pro, .pri) and in repo markdown (README.md, docs/**). Keeps sources portable
//                         and diffs readable on every toolchain/editor.
//   L2-purity    error    Pure core files must not reach the world: no Qt includes/types (QObject,
//                         QDateTime, QThread, ...), no clock now(), time(), std::time, clock(),
//                         GetTickCount, Sleep(), sleep_for, no rand/srand/random_device, no
//                         std::thread/mutex, std::filesystem, getenv, fopen/ifstream/ofstream.
//                         Matches inside comments and string literals are ignored.
//   L2-include   error    Pure core files may include only: standard headers (not the I/O, thread,
//                         clock and filesystem ones: <filesystem> <fstream> <thread> <mutex> <future>
//                         <condition_variable> <ctime> <time.h> ...), ctrl_kernel/... headers and,
//                         in a *_core/ or core/ directory, files of the own directory
//                         ("own_dir/x.h", or "x.h" when it exists next to the file). <windows.h> and
//                         "../device_runner.h" are errors.
//   L4-timer     error    The core owns no timer: QTimer / singleShot in pure core files (the timer
//                         service lives in the shell; the core only emits start/cancel effects).
//   L5-callout   error    Handlers never call out (L5) and outputs come from outputs() only (L7):
//                         `emit x` and publish(...) in pure core files.
//   L10-blocking error    No blocking wait in qt/ and shell/adapter code: QEventLoop,
//                         BlockingQueuedConnection, .wait(, waitForFinished, processEvents.
//   L9-literal   warning  Numeric literals other than 0 and 1 (so also -1) inside pure core .cpp files
//                         and pure core headers (except policy.h and any *policy*.h): numbers are
//                         policy data. Not reported in enum initialisers, array sizes [N],
//                         preprocessor lines, constexpr declarations and static_assert.
//   WARN-PRAGMA  error    Never silence a warning: #pragma warning(disable, __pragma(warning(disable,
//                         #pragma GCC|clang diagnostic ignored, /wdNNNN and -Wno-... in code and in
//                         CMake files (CMakeLists.txt, *.cmake, *.pro, *.pri).
//   DOCS         error    Repo documentation (README.md, docs/**/*.md) is user documentation only:
//                         no .claude, Claude, Anthropic, AGENTS.md / CLAUDE.md, decision-record or
//                         work-package ids (ADR-n, DR-n, WP-, PQ-n) and no absolute paths (C:\ , /c/Users).
//
// Heuristic scanner (no real C++ parser): comments are blanked, string/char literal contents are
// blanked for identifier checks, positions are preserved so line:col are exact.
'use strict';

const fs = require('fs');
const path = require('path');

const GATES = {
  'ASCII': {
    severity: 'error', law: 'ASCII-only sources',
    hint: 'replace the non-ASCII character with plain ASCII (e.g. "-" for a dash, "->" for an arrow).',
  },
  'L2-purity': {
    severity: 'error', law: 'L2 (the core never peeks at the world)',
    hint: 'move the call into the shell/adapter; the core receives the value as an Event field.',
  },
  'L2-include': {
    severity: 'error', law: 'L2 (the core never peeks at the world)',
    hint: 'include/ctrl_kernel may include only standard headers and "ctrl_kernel/...".',
  },
  'L5-callout': {
    severity: 'error', law: 'L5 (handlers never call out; effects are data) / L7 (outputs come only from outputs())',
    hint: 'return an Effect (data) and let the executor or shell emit/publish it; the core never calls out.',
  },
  'WARN-PRAGMA': {
    severity: 'error', law: 'Warnings are errors on every compiler (never silenced by pragma or flag)',
    hint: 'fix the cause of the warning in the code; do not disable it with a pragma, /wd or -Wno-.',
  },
  'DOCS': {
    severity: 'error', law: 'Repo policy: user documentation only (self-contained, no tooling or process traces)',
    hint: 'remove it: docs explain what the kernel is and how to use, build and test it; no .claude, tool names, ids or absolute paths.',
  },
  'L4-timer': {
    severity: 'error', law: 'L4 (every timer has a key and a token; the core owns no QTimer)',
    hint: 'emit a start/cancel timer Effect with key+token; the TimerService in the shell owns the QTimer.',
  },
  'L10-blocking': {
    severity: 'error', law: 'L10 (no blocking wait anywhere in the lifecycle)',
    hint: 'make it an event: post the result back with a queued connection instead of waiting.',
  },
  'L9-literal': {
    severity: 'warning', law: 'L9 (numbers are policy, policy is data)',
    hint: 'move the number into Policy (or a named constexpr) and read it from there.',
  },
};

const CODE_EXT = new Set(['.h', '.hpp', '.cpp', '.cc', '.cxx', '.ipp']);
const SRC_EXT = new Set(['.cpp', '.cc', '.cxx']);
const BUILD_EXT = new Set(['.cmake', '.pro', '.pri']);
const WALK_DIRS = ['include', 'examples', 'qt', 'tests', 'src', 'cmake'];
const SKIP_DIR = /^(build.*|out|\.git|\.claude|node_modules|\.vs|\.vscode|\.idea)$/i;
const C_HEADERS = new Set(['assert.h', 'complex.h', 'ctype.h', 'errno.h', 'fenv.h', 'float.h',
  'inttypes.h', 'iso646.h', 'limits.h', 'locale.h', 'math.h', 'setjmp.h', 'signal.h', 'stdalign.h',
  'stdarg.h', 'stdbool.h', 'stddef.h', 'stdint.h', 'stdio.h', 'stdlib.h', 'string.h', 'tgmath.h',
  'time.h', 'uchar.h', 'wchar.h', 'wctype.h']);

// ---- L2 purity patterns (QTimer / singleShot are reported as L4 instead) -----------------------
const NOT_MEMBER = '(?<![\\w.])(?<!->)';
const PURITY = [
  [/^[ \t]*#[ \t]*include[ \t]*[<"]Q[^>"\n]*[>"]/gm, 'Qt include', 'code'],
  [/\bQObject\b/g, 'QObject', 'bare'],
  [/\bQDateTime\b/g, 'QDateTime', 'bare'],
  [/\bQThread\b/g, 'QThread', 'bare'],
  [/\b\w*_clock\s*::\s*now\b/g, 'clock now()', 'bare'],
  [new RegExp(NOT_MEMBER + '(?:std\\s*::\\s*)?s?rand\\s*\\(', 'g'), 'rand()/srand()', 'bare'],
  [/\bstd\s*::\s*random_device\b/g, 'std::random_device', 'bare'],
  [/\bstd\s*::\s*thread\b/g, 'std::thread', 'bare'],
  [/\bstd\s*::\s*(?:recursive_|shared_|timed_)*mutex\b/g, 'std::mutex', 'bare'],
  [/\bsleep_for\b/g, 'sleep_for', 'bare'],
  [new RegExp(NOT_MEMBER + '(?:std\\s*::\\s*)?getenv\\s*\\(', 'g'), 'getenv()', 'bare'],
  [new RegExp(NOT_MEMBER + '(?:std\\s*::\\s*)?fopen\\s*\\(', 'g'), 'fopen()', 'bare'],
  [/\bstd\s*::\s*[io]?fstream\b/g, 'file stream (std::ifstream/ofstream)', 'bare'],
  [new RegExp(NOT_MEMBER + '(?:std\\s*::\\s*)?time\\s*\\(', 'g'), 'time() / std::time', 'bare'],
  [new RegExp(NOT_MEMBER + '(?:std\\s*::\\s*)?clock\\s*\\(', 'g'), 'clock()', 'bare'],
  [new RegExp(NOT_MEMBER + 'Sleep\\s*\\(', 'g'), 'Sleep()', 'bare'],
  [/\bGetTickCount(?:64)?\b/g, 'GetTickCount', 'bare'],
  [/\bstd\s*::\s*filesystem\b/g, 'std::filesystem', 'bare'],
];
const CALLOUT = [
  [/(?<![\w.>])emit\s+[A-Za-z_]/g, 'emit (signal emission)', 'bare'],
  [/\bpublish\s*\(/g, 'publish() call', 'bare'],
];
// code and build files: never silence a warning
const WARN = [
  [/#[ \t]*pragma[ \t]+warning[ \t]*\([ \t]*disable/g, '#pragma warning(disable', 'code'],
  [/__pragma[ \t]*\([ \t]*warning[ \t]*\([ \t]*disable/g, '__pragma(warning(disable', 'code'],
  [/#[ \t]*pragma[ \t]+(?:GCC|clang)[ \t]+diagnostic[ \t]+ignored/g, '#pragma diagnostic ignored', 'code'],
  [/(?<![\w\-/])\/wd\d+/g, '/wd (MSVC warning disable)', 'code'],
  [/(?<![\w-])-Wno-[\w-]+/g, '-Wno-... (warning disable)', 'code'],
];
// docs: no traces of tooling, process or machine
const DOC_PATTERNS = [
  [/\.claude/gi, '.claude'],
  [/\bClaude\b/g, 'Claude'],
  [/\bAnthropic\b/gi, 'Anthropic'],
  [/\bAGENTS?\.md\b/gi, 'AGENTS.md'],
  [/\bCLAUDE\.md\b/gi, 'CLAUDE.md'],
  [/\bADR-\d/g, 'ADR id'],
  [/\bDR-\d/g, 'DR id'],
  [/\bWP-/g, 'WP- id'],
  [/\bPQ-\d/g, 'PQ id'],
  [/(?<![A-Za-z0-9])[A-Za-z]:\\/g, 'absolute Windows path'],
  [/(?<![\w])\/[a-zA-Z]\/Users\b/gi, 'absolute path (/c/Users)'],
];
// headers that make the pure core touch the world, even though they are "standard"
const IMPURE_STD_HEADERS = new Set(['filesystem', 'fstream', 'thread', 'mutex', 'shared_mutex',
  'condition_variable', 'future', 'semaphore', 'latch', 'barrier', 'stop_token', 'ctime', 'time.h',
  'csignal', 'signal.h', 'iostream']);
const TIMER = [[/\bQTimer\b/g, 'QTimer', 'bare'], [/\bsingleShot\b/g, 'singleShot', 'bare']];
const BLOCKING = [
  [/\bQEventLoop\b/g, 'QEventLoop', 'bare'],
  [/\bBlockingQueuedConnection\b/g, 'BlockingQueuedConnection', 'bare'],
  [/(?:\.|->)\s*wait\s*\(/g, '.wait(', 'bare'],
  [/\bwaitForFinished\b/g, 'waitForFinished', 'bare'],
  [/\bprocessEvents\b/g, 'processEvents', 'bare'],
];

// ---- path classification ----------------------------------------------------------------------
function slash(p) { return String(p).replace(/\\/g, '/'); }

function defaultRoot() { return path.resolve(slash(process.env.CLAUDE_PROJECT_DIR || process.cwd())); }

function relInfo(file, root) {
  const abs = path.resolve(root, slash(file));
  let rel = slash(path.relative(root, abs));
  const inside = !(rel.startsWith('..') || path.isAbsolute(rel));
  if (!inside) rel = slash(abs).replace(/^[A-Za-z]:/, '').replace(/^\/+/, '');
  return { abs, rel, inside };
}

function classify(rel, inside) {
  const base = path.posix.basename(rel);
  const ext = path.posix.extname(base).toLowerCase();
  const dirs = path.posix.dirname(rel).split('/').filter((s) => s && s !== '.');
  const isCpp = CODE_EXT.has(ext);
  const isBuild = base === 'CMakeLists.txt' || BUILD_EXT.has(ext);
  const isMd = ext === '.md' && (base === 'README.md' || /(^|\/)docs\//.test(rel));
  const coreInclude = /(^|\/)include\/ctrl_kernel\//.test(rel);
  const coreDir = dirs.some((d) => d === 'core' || /_core$/.test(d));
  const shell = dirs.some((d) => d === 'qt' || /(^|_)(shell|adapters?)$/.test(d));
  return {
    isCpp, isBuild, isMd,
    isSource: isCpp && SRC_EXT.has(ext),
    isHeader: isCpp && !SRC_EXT.has(ext),
    policyFile: /policy/i.test(base),
    pure: isCpp && (coreInclude || coreDir),
    ctrlInclude: isCpp && coreInclude,
    coreDir: isCpp && coreDir,
    ownDirName: dirs.length ? dirs[dirs.length - 1] : '',
    shell: isCpp && shell,
    ascii: isCpp || isBuild || isMd,
    skipped: inside && /^(build[^/]*|out|\.git|\.claude|node_modules)(\/|$)/i.test(rel),
  };
}

// ---- scanner: blank comments (and string contents) keeping every offset -----------------------
function blankText(text) {
  const n = text.length;
  const code = text.split('');
  const bare = text.split('');
  const keep = (c) => c === '\n' || c === '\r';
  let i = 0;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '/' && d === '/') {
      let continued = false;
      while (i < n) {
        if (text[i] === '\n') {
          if (continued) { continued = false; i++; continue; }
          break;
        }
        if (!keep(text[i])) code[i] = bare[i] = ' ';
        if (text[i] !== '\r') continued = text[i] === '\\';
        i++;
      }
    } else if (c === '/' && d === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? n : end + 2;
      for (; i < stop; i++) if (!keep(text[i])) code[i] = bare[i] = ' ';
    } else if (c === '"' && text[i - 1] === 'R') {
      const open = text.indexOf('(', i + 1);
      const delim = open < 0 ? '' : text.slice(i + 1, open);
      const close = open < 0 ? -1 : text.indexOf(')' + delim + '"', open + 1);
      if (close < 0) { i++; continue; }
      for (let k = i + 1; k < close + delim.length + 1; k++) if (!keep(text[k])) bare[k] = ' ';
      i = close + delim.length + 2;
    } else if (c === '"') {
      let k = i + 1;
      while (k < n && text[k] !== '"' && text[k] !== '\n') { if (text[k] === '\\') k++; k++; }
      for (let q = i + 1; q < Math.min(k, n); q++) if (!keep(text[q])) bare[q] = ' ';
      i = k + 1;
    } else if (c === "'") {
      const prev = text[i - 1] || '';
      if (/[0-9a-fA-F]/.test(prev) && /[0-9a-fA-F]/.test(d || '')) { i++; continue; } // digit separator
      let k = i + 1;
      while (k < n && text[k] !== "'" && text[k] !== '\n') { if (text[k] === '\\') k++; k++; }
      for (let q = i + 1; q < Math.min(k, n); q++) if (!keep(text[q])) bare[q] = ' ';
      i = k + 1;
    } else {
      i++;
    }
  }
  return { code: code.join(''), bare: bare.join('') };
}

function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return (idx) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= idx) lo = mid; else hi = mid - 1;
    }
    return { line: lo + 1, col: idx - starts[lo] + 1 };
  };
}

function make(gate, display, pos, message) {
  const g = GATES[gate];
  return { file: display, line: pos.line, col: pos.col, gate, severity: g.severity,
    law: g.law, message, hint: g.hint };
}

// ---- individual gates --------------------------------------------------------------------------
function gateAscii(buf, display) {
  const out = [];
  let line = 1;
  let lineStart = 0;
  let reported = false;
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === 0x0a) { line++; lineStart = i + 1; reported = false; continue; }
    if (b > 0x7f && !reported) {
      reported = true;
      const cp = buf.slice(i, i + 4).toString('utf8').codePointAt(0);
      const what = cp && cp !== 0xfffd ? 'U+' + cp.toString(16).toUpperCase().padStart(4, '0') : 'byte 0x' + b.toString(16).toUpperCase();
      out.push(make('ASCII', display, { line, col: i - lineStart + 1 }, 'non-ASCII character (' + what + ')'));
    }
  }
  return out;
}

function runPatterns(list, gate, view, at, display, label, out) {
  for (const [re0, what, src] of list) {
    const re = new RegExp(re0.source, re0.flags);
    const text = view[src];
    let m;
    while ((m = re.exec(text))) {
      out.push(make(gate, display, at(m.index), label(what)));
      if (m[0].length === 0) re.lastIndex++;
    }
  }
}

// own = { dir, name } for files in a core directory (own-directory includes allowed), else null
function gateInclude(view, at, display, out, own) {
  const re = /^[ \t]*#[ \t]*include[ \t]*([<"])([^>"\n]+)[>"]/gm;
  let m;
  while ((m = re.exec(view.code))) {
    const name = m[2].trim();
    let ok;
    let why = 'is neither a standard header nor ctrl_kernel/...';
    if (name.startsWith('ctrl_kernel/')) ok = true;
    else if (m[1] === '<') {
      ok = !/[./]/.test(name) || C_HEADERS.has(name);
      if (ok && IMPURE_STD_HEADERS.has(name)) { ok = false; why = 'reaches the world (I/O, threads, clock or filesystem)'; }
    } else if (own && !/(^|\/)\.\.(\/|$)/.test(name) && !path.isAbsolute(name)) {
      const prefix = own.name + '/';
      ok = name.startsWith(prefix) || fs.existsSync(path.join(own.dir, name));
      if (!ok) why = 'is not a file of the own directory (' + own.name + '/), a standard header or ctrl_kernel/...';
    }
    if (!ok) {
      out.push(make('L2-include', display, at(m.index),
        'include of ' + m[1] + name + (m[1] === '<' ? '>' : '"') + ' ' + why));
    }
  }
}

// ---- comment blanking for CMake / qmake (# comments, #[[ ]] bracket comments, "strings") ------
function blankHash(text) {
  const out = text.split('');
  const n = text.length;
  let i = 0;
  const blank = (a, b) => { for (let k = a; k < b; k++) if (out[k] !== '\n' && out[k] !== '\r') out[k] = ' '; };
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      i++;
      while (i < n && text[i] !== '"') { if (text[i] === '\\') i++; i++; }
      i++;
    } else if (c === '#') {
      const br = text.slice(i).match(/^#\[(=*)\[/);
      if (br) {
        const close = text.indexOf(']' + br[1] + ']', i + br[0].length);
        const stop = close < 0 ? n : close + br[1].length + 2;
        blank(i, stop);
        i = stop;
      } else {
        let k = i;
        while (k < n && text[k] !== '\n') k++;
        blank(i, k);
        i = k;
      }
    } else {
      i++;
    }
  }
  return out.join('');
}

function gateDocs(text, at, display, out) {
  for (const [re0, what] of DOC_PATTERNS) {
    const re = new RegExp(re0.source, re0.flags);
    let m;
    while ((m = re.exec(text))) {
      out.push(make('DOCS', display, at(m.index), 'repo documentation must not mention "' + m[0] + '" (' + what + ')'));
      if (m[0].length === 0) re.lastIndex++;
    }
  }
}

function exemptRanges(bare) {
  const ranges = [];
  let m;
  const pre = /^[ \t]*#(?:[^\n\\]|\\\r?\n|\\.)*/gm;
  while ((m = pre.exec(bare))) ranges.push([m.index, m.index + m[0].length]);
  const stmt = /\b(?:constexpr|static_assert)\b/g;
  while ((m = stmt.exec(bare))) {
    const end = bare.indexOf(';', m.index);
    ranges.push([m.index, end < 0 ? bare.length : end + 1]);
  }
  const en = /\benum\b/g;
  while ((m = en.exec(bare))) {
    const brace = bare.indexOf('{', m.index);
    const semi = bare.indexOf(';', m.index);
    if (brace < 0 || (semi >= 0 && semi < brace)) continue;
    let depth = 0;
    let k = brace;
    for (; k < bare.length; k++) {
      if (bare[k] === '{') depth++;
      else if (bare[k] === '}' && --depth === 0) break;
    }
    ranges.push([m.index, k + 1]);
  }
  // A struct/class named *Policy is policy data (e.g. RolePolicy defaults in blocks.h).
  const pol = /\b(?:struct|class)\s+\w*Policy\b/g;
  while ((m = pol.exec(bare))) {
    const brace = bare.indexOf('{', m.index);
    const semi = bare.indexOf(';', m.index);
    if (brace < 0 || (semi >= 0 && semi < brace)) continue;
    let depth = 0;
    let k = brace;
    for (; k < bare.length; k++) {
      if (bare[k] === '{') depth++;
      else if (bare[k] === '}' && --depth === 0) break;
    }
    ranges.push([m.index, k + 1]);
  }
  return ranges;
}

function gateLiteral(view, at, display, out) {
  const bare = view.bare;
  const ranges = exemptRanges(bare);
  const num = /(?<![\w.])(?:0[xX][0-9a-fA-F']+|\d[\d']*\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)[uUlLfFzZ]*(?![\w.])/g;
  let m;
  while ((m = num.exec(bare))) {
    const idx = m.index;
    if (ranges.some((r) => idx >= r[0] && idx < r[1])) continue;
    const raw = m[0].replace(/'/g, '').replace(/[uUlLfFzZ]+$/, '');
    const val = /^0[xX]/.test(raw) ? parseInt(raw, 16) : parseFloat(raw);
    if (val === 0 || val === 1) continue;
    let p = idx - 1;
    while (p >= 0 && /\s/.test(bare[p])) p--;
    let q = idx + m[0].length;
    while (q < bare.length && /\s/.test(bare[q])) q++;
    if (bare[p] === '[' && bare[q] === ']') continue; // array size
    out.push(make('L9-literal', display, at(idx),
      'numeric literal ' + m[0] + ' in pure core code (only 0 and 1 are allowed inline)'));
  }
}

// ---- public API --------------------------------------------------------------------------------
function checkFile(file, opts) {
  const root = path.resolve(slash((opts && opts.root) || defaultRoot()));
  const info = relInfo(file, root);
  const c = classify(info.rel, info.inside);
  if (c.skipped || !c.ascii) return [];
  let buf;
  try { buf = fs.readFileSync(info.abs); } catch (_) { return []; }
  const display = info.inside ? info.rel : slash(info.abs);
  const out = [];
  out.push(...gateAscii(buf, display));
  if (c.isCpp) {
    const text = buf.toString('utf8');
    const view = blankText(text);
    const at = lineIndex(text);
    if (c.pure) {
      runPatterns(PURITY, 'L2-purity', view, at, display, (w) => 'forbidden in the pure core: ' + w, out);
      runPatterns(TIMER, 'L4-timer', view, at, display, (w) => 'timer in the pure core: ' + w, out);
      runPatterns(CALLOUT, 'L5-callout', view, at, display, (w) => 'the core must not call out: ' + w, out);
      if (c.isSource || (c.isHeader && !c.policyFile)) gateLiteral(view, at, display, out);
      const own = c.coreDir && !c.ctrlInclude ? { dir: path.dirname(info.abs), name: c.ownDirName } : null;
      gateInclude(view, at, display, out, own);
    }
    if (c.shell) runPatterns(BLOCKING, 'L10-blocking', view, at, display, (w) => 'blocking wait in shell/adapter code: ' + w, out);
    runPatterns(WARN, 'WARN-PRAGMA', view, at, display, (w) => 'warning silenced: ' + w, out);
  } else if (c.isBuild) {
    const text = buf.toString('utf8');
    const code = blankHash(text);
    runPatterns(WARN, 'WARN-PRAGMA', { code, bare: code }, lineIndex(text), display, (w) => 'warning silenced: ' + w, out);
  } else if (c.isMd) {
    const text = buf.toString('utf8');
    gateDocs(text, lineIndex(text), display, out);
  }
  const seen = new Set();
  return out
    .filter((f) => { const k = f.gate + ':' + f.line + ':' + f.col; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.line - b.line || a.col - b.col);
}

function walk(dir, root, files) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIR.test(e.name)) walk(p, root, files); }
    else if (e.isFile()) files.push(p);
  }
}

function collectAll(root) {
  const files = [];
  for (const d of WALK_DIRS) {
    const p = path.join(root, d);
    if (fs.existsSync(p)) walk(p, root, files);
  }
  let top = [];
  try { top = fs.readdirSync(root, { withFileTypes: true }); } catch (_) { /* ignore */ }
  for (const e of top) {
    if (!e.isFile()) continue;
    if (e.name === 'CMakeLists.txt' || e.name === 'README.md' || /\.cmake$/i.test(e.name)) files.push(path.join(root, e.name));
  }
  const docs = path.join(root, 'docs');
  if (fs.existsSync(docs)) walk(docs, root, files);
  return Array.from(new Set(files));
}

function checkAll(opts) {
  const root = path.resolve(slash((opts && opts.root) || defaultRoot()));
  const out = [];
  for (const f of collectAll(root)) out.push(...checkFile(f, { root }));
  return out;
}

function format(f) {
  return f.file + ':' + f.line + ':' + f.col + ' [' + f.gate + '] ' + (f.severity === 'warning' ? 'warning: ' : '') + f.message;
}

module.exports = { checkFile, checkAll, GATES, format };

if (require.main === module) {
  const args = process.argv.slice(2);
  let findings = [];
  try {
    if (args.length === 0 || args.includes('--help')) {
      process.stderr.write('usage: gate-check.js --all | <files...>\n');
      process.exit(args.length === 0 ? 2 : 0);
    }
    if (args.includes('--all')) findings = checkAll();
    else for (const f of args) findings.push(...checkFile(f));
  } catch (err) {
    process.stderr.write('[gate-check] internal error: ' + (err && err.stack ? err.stack : err) + '\n');
    process.exit(2);
  }
  for (const f of findings) process.stdout.write(format(f) + '\n');
  const errors = findings.filter((f) => f.severity === 'error').length;
  process.stdout.write('gate-check: ' + errors + ' error(s), ' + (findings.length - errors) + ' warning(s)\n');
  process.exit(errors > 0 ? 1 : 0);
}
