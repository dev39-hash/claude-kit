#!/usr/bin/env node
// Gate engine for controllers built on the controller kernel (pack controller-kernel). CLI and
// module; the kernel-gates.js hook runs it on every edited file.
//
//   node .claude/tools/controller-kernel/gate-check.js --all [--json]     walk packConfig walkDirs,
//                                                                         top-level CMake files, README.md, docs/
//   node .claude/tools/controller-kernel/gate-check.js <files...> [--json]
//   const { checkFile, checkAll, GATES, format } = require('.../gate-check.js')
//
// Output: one line per finding, `path:line:col [GATE] message`, then a summary line. Exit 1 when
// any finding has severity error, else 0 (warnings never fail).
//
// "Pure core" = include/<kernelInclude>/** and every directory whose name matches one of
// packConfig coreDirs (default: core, *_core). "Shell" = directories matching shellDirs
// (default: qt, shell, *_shell, adapter, adapters). Skipped everywhere: .git, .claude,
// node_modules and build.buildDirPatterns from kit.config.json.
//
// Gates:
//   ASCII        error    no byte > 0x7F in the files the kit's ASCII rule covers
//                         (encoding.asciiExtensions / asciiExempt / asciiRepoMarkdown)
//   L2-purity    error    pure core: no Qt includes or types, clock now(), time(), clock(),
//                         GetTickCount, Sleep(), sleep_for, rand/srand/random_device, std::thread,
//                         std::mutex, std::filesystem, getenv, fopen, file streams
//                         (comments and string literals are ignored)
//   L2-include   error    pure core: only standard headers (not the I/O, thread, clock and
//                         filesystem ones), "<kernelInclude>/..." and, in a core directory, files
//                         of the own directory
//   L4-timer     error    pure core: no QTimer / singleShot (the shell's timer service owns timers)
//   L5-callout   error    pure core: no `emit x` and no publish(...) (effects are data)
//   L10-blocking error    shell: no QEventLoop, BlockingQueuedConnection, .wait(, waitForFinished,
//                         processEvents
//   WARN-PRAGMA  error    code and build files: no #pragma warning(disable, __pragma(warning(disable,
//                         #pragma GCC|clang diagnostic ignored, /wdNNNN, -Wno-...
//   L9-literal   warning  pure core .cpp files and non-policy headers: numeric literals other than
//                         0 and 1 (numbers are Policy data); not in enum bodies, array sizes,
//                         preprocessor lines, constexpr / static_assert, *Policy structs.
//                         packConfig literalGate: "warning" (default) | "off"
//
// Heuristic scanner, not a C++ parser: comments are blanked, string and char literal contents
// are blanked for identifier checks, offsets are preserved so line:col are exact.
'use strict';

const fs = require('fs');
const path = require('path');
const env = require('./kit-env');

const GATES = {
  'ASCII': {
    severity: 'error', law: 'ASCII-only sources',
    hint: 'replace the non-ASCII character with plain ASCII ("-" for a dash, "->" for an arrow, "deg", "+/-").',
  },
  'L2-purity': {
    severity: 'error', law: 'L2 (the core never peeks at the world)',
    hint: 'move the call into the shell or adapter; the core receives the value as an Event field.',
  },
  'L2-include': {
    severity: 'error', law: 'L2 (the core never peeks at the world)',
    hint: 'a pure core includes only standard headers, the kernel headers and files of its own directory.',
  },
  'L4-timer': {
    severity: 'error', law: 'L4 (every timer has a key and a token; the core owns no real timer)',
    hint: 'emit a StartTimer / CancelTimer Effect with key and token; the shell\'s timer service owns the QTimer.',
  },
  'L5-callout': {
    severity: 'error', law: 'L5 (handlers never call out; effects are data) / L7 (outputs come only from outputs())',
    hint: 'return an Effect (data) and let the executor or shell emit or publish it; the core never calls out.',
  },
  'L10-blocking': {
    severity: 'error', law: 'L10 (no blocking wait anywhere in the lifecycle)',
    hint: 'make it an event: post the result back with a queued connection instead of waiting.',
  },
  'WARN-PRAGMA': {
    severity: 'error', law: 'Warnings are errors on every compiler (never silenced by pragma or flag)',
    hint: 'fix the cause of the warning in the code; do not disable it with a pragma, /wd or -Wno-.',
  },
  'L9-literal': {
    severity: 'warning', law: 'L9 (numbers are policy, policy is data)',
    hint: 'move the number into Policy (or a named constexpr) and read it from there.',
  },
};

const CODE_EXT = new Set(['.h', '.hpp', '.hh', '.cpp', '.cc', '.cxx', '.ipp', '.inl']);
const SRC_EXT = new Set(['.cpp', '.cc', '.cxx']);
const BUILD_EXT = new Set(['.cmake', '.pro', '.pri']);
const C_HEADERS = new Set(['assert.h', 'complex.h', 'ctype.h', 'errno.h', 'fenv.h', 'float.h',
  'inttypes.h', 'iso646.h', 'limits.h', 'locale.h', 'math.h', 'setjmp.h', 'signal.h', 'stdalign.h',
  'stdarg.h', 'stdbool.h', 'stddef.h', 'stdint.h', 'stdio.h', 'stdlib.h', 'string.h', 'tgmath.h',
  'time.h', 'uchar.h', 'wchar.h', 'wctype.h']);
// standard headers that make a pure core touch the world
const IMPURE_STD_HEADERS = ['filesystem', 'fstream', 'thread', 'mutex', 'shared_mutex',
  'condition_variable', 'future', 'semaphore', 'latch', 'barrier', 'stop_token', 'ctime', 'time.h',
  'csignal', 'signal.h', 'iostream'];

// ---- patterns: [regex, label, view] where view is 'code' (strings kept) or 'bare' (strings blanked)
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
const WARN = [
  [/#[ \t]*pragma[ \t]+warning[ \t]*\([ \t]*disable/g, '#pragma warning(disable', 'code'],
  [/__pragma[ \t]*\([ \t]*warning[ \t]*\([ \t]*disable/g, '__pragma(warning(disable', 'code'],
  [/#[ \t]*pragma[ \t]+(?:GCC|clang)[ \t]+diagnostic[ \t]+ignored/g, '#pragma diagnostic ignored', 'code'],
  [/(?<![\w\-/])\/wd\d+/g, '/wd (MSVC warning disable)', 'code'],
  [/(?<![\w-])-Wno-[\w-]+/g, '-Wno-... (warning disable)', 'code'],
];
const TIMER = [[/\bQTimer\b/g, 'QTimer', 'bare'], [/\bsingleShot\b/g, 'singleShot', 'bare']];
const BLOCKING = [
  [/\bQEventLoop\b/g, 'QEventLoop', 'bare'],
  [/\bBlockingQueuedConnection\b/g, 'BlockingQueuedConnection', 'bare'],
  [/(?:\.|->)\s*wait\s*\(/g, '.wait(', 'bare'],
  [/\bwaitForFinished\b/g, 'waitForFinished', 'bare'],
  [/\bprocessEvents\b/g, 'processEvents', 'bare'],
];

// ---- context: config + compiled matchers --------------------------------------------------------
function slash(p) { return String(p).replace(/\\/g, '/'); }

function makeContext(opts) {
  const o = opts || {};
  const P = env.lib('paths');
  let cfg = o.cfg;
  let root = o.root;
  if (!cfg || !root) {
    const loaded = env.loadConfig();
    cfg = cfg || loaded.cfg;
    root = root || loaded.root;
  }
  const pc = env.packConfig(cfg);
  const res = (list) => (list || []).map((g) => P.globToRe(String(g).toLowerCase()));
  return {
    P, cfg, pc,
    root: path.resolve(slash(root)),
    coreDirRes: res(pc.coreDirs),
    shellDirRes: res(pc.shellDirs),
    policyRes: res(pc.policyFiles),
    impure: new Set(IMPURE_STD_HEADERS.concat(pc.extraImpureHeaders || [])),
    skip: ['.git/', '.claude/', 'node_modules/'].concat((cfg.build && cfg.build.buildDirPatterns) || []),
  };
}

function relInfo(file, ctx) {
  const abs = path.resolve(ctx.root, slash(file));
  let rel = slash(path.relative(ctx.root, abs));
  const inside = !(rel.startsWith('..') || path.isAbsolute(rel));
  if (!inside) rel = slash(abs).replace(/^[A-Za-z]:/, '').replace(/^\/+/, '');
  return { abs, rel, inside };
}

function classify(info, ctx) {
  const rel = info.rel;
  const base = path.posix.basename(rel);
  const ext = path.posix.extname(base).toLowerCase();
  const dirs = path.posix.dirname(rel).split('/').filter((s) => s && s !== '.');
  const lower = (s) => s.toLowerCase();
  const isCpp = CODE_EXT.has(ext);
  const isBuild = base === 'CMakeLists.txt' || BUILD_EXT.has(ext);
  const coreInclude = new RegExp('(^|/)include/' + ctx.pc.kernelInclude.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/').test(rel);
  const coreDir = dirs.some((d) => ctx.coreDirRes.some((re) => re.test(lower(d))));
  const shell = dirs.some((d) => ctx.shellDirRes.some((re) => re.test(lower(d))));
  const nAbs = ctx.P.norm(info.abs);
  const nRoot = ctx.P.norm(ctx.root);
  let ascii;
  if (info.inside) ascii = ctx.P.asciiCovered(nAbs, nRoot, ctx.cfg);
  else ascii = isCpp || isBuild;
  return {
    isCpp, isBuild,
    isSource: isCpp && SRC_EXT.has(ext),
    isHeader: isCpp && !SRC_EXT.has(ext),
    policyFile: ctx.policyRes.some((re) => re.test(lower(base))),
    pure: isCpp && (coreInclude || coreDir),
    kernelInclude: isCpp && coreInclude,
    coreDir: isCpp && coreDir,
    ownDirName: dirs.length ? dirs[dirs.length - 1] : '',
    shell: isCpp && shell,
    ascii,
    skipped: info.inside && !!ctx.P.matchAny(nAbs, nRoot, ctx.skip),
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

// CMake / qmake: # comments, #[[ ]] bracket comments and "strings" blanked
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
  return { file: display, line: pos.line, col: pos.col, gate, severity: g.severity, law: g.law, message, hint: g.hint };
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
function gateInclude(view, at, display, out, own, ctx) {
  const re = /^[ \t]*#[ \t]*include[ \t]*([<"])([^>"\n]+)[>"]/gm;
  const kernel = ctx.pc.kernelInclude + '/';
  let m;
  while ((m = re.exec(view.code))) {
    const name = m[2].trim();
    let ok = false;
    let why = 'is neither a standard header nor ' + kernel + '...';
    if (name.startsWith(kernel)) ok = true;
    else if (m[1] === '<') {
      ok = !/[./]/.test(name) || C_HEADERS.has(name);
      if (ok && ctx.impure.has(name)) { ok = false; why = 'reaches the world (I/O, threads, clock or filesystem)'; }
    } else if (own && !/(^|\/)\.\.(\/|$)/.test(name) && !path.isAbsolute(name)) {
      const prefix = own.name + '/';
      ok = name.startsWith(prefix) || fs.existsSync(path.join(own.dir, name));
      if (!ok) why = 'is not a file of the own directory (' + own.name + '/), a standard header or ' + kernel + '...';
    }
    if (!ok) out.push(make('L2-include', display, at(m.index), 'include of ' + m[1] + name + (m[1] === '<' ? '>' : '"') + ' ' + why));
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
  const braced = (re) => {
    while ((m = re.exec(bare))) {
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
  };
  braced(/\benum\b/g);
  braced(/\b(?:struct|class)\s+\w*Policy\b/g); // a *Policy struct is policy data
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
    out.push(make('L9-literal', display, at(idx), 'numeric literal ' + m[0] + ' in pure core code (only 0 and 1 are allowed inline)'));
  }
}

// ---- public API --------------------------------------------------------------------------------
// opts: { root, cfg, ctx } - all optional; without them kit.config.json of the project is loaded.
function checkFile(file, opts) {
  const ctx = (opts && opts.ctx) || makeContext(opts);
  const info = relInfo(file, ctx);
  const c = classify(info, ctx);
  if (c.skipped) return [];
  if (!c.ascii && !c.isCpp && !c.isBuild) return [];
  let buf;
  try { buf = fs.readFileSync(info.abs); } catch (_) { return []; }
  const display = info.inside ? info.rel : slash(info.abs);
  const out = [];
  if (c.ascii) out.push(...gateAscii(buf, display));
  if (c.isCpp) {
    const text = buf.toString('utf8');
    const view = blankText(text);
    const at = lineIndex(text);
    if (c.pure) {
      runPatterns(PURITY, 'L2-purity', view, at, display, (w) => 'forbidden in the pure core: ' + w, out);
      runPatterns(TIMER, 'L4-timer', view, at, display, (w) => 'timer in the pure core: ' + w, out);
      runPatterns(CALLOUT, 'L5-callout', view, at, display, (w) => 'the core must not call out: ' + w, out);
      if (ctx.pc.literalGate !== 'off' && (c.isSource || (c.isHeader && !c.policyFile))) gateLiteral(view, at, display, out);
      const own = c.coreDir && !c.kernelInclude ? { dir: path.dirname(info.abs), name: c.ownDirName } : null;
      gateInclude(view, at, display, out, own, ctx);
    }
    if (c.shell) runPatterns(BLOCKING, 'L10-blocking', view, at, display, (w) => 'blocking wait in shell/adapter code: ' + w, out);
    runPatterns(WARN, 'WARN-PRAGMA', view, at, display, (w) => 'warning silenced: ' + w, out);
  } else if (c.isBuild) {
    const text = buf.toString('utf8');
    const code = blankHash(text);
    runPatterns(WARN, 'WARN-PRAGMA', { code, bare: code }, lineIndex(text), display, (w) => 'warning silenced: ' + w, out);
  }
  const seen = new Set();
  return out
    .filter((f) => { const k = f.gate + ':' + f.line + ':' + f.col; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.line - b.line || a.col - b.col);
}

function walk(dir, ctx, files) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!ctx.P.matchAny(ctx.P.norm(p), ctx.P.norm(ctx.root), ctx.skip)) walk(p, ctx, files);
    } else if (e.isFile()) files.push(p);
  }
}

function collectAll(ctx) {
  const files = [];
  for (const d of ctx.pc.walkDirs || []) {
    const p = path.join(ctx.root, d);
    if (fs.existsSync(p)) walk(p, ctx, files);
  }
  let top = [];
  try { top = fs.readdirSync(ctx.root, { withFileTypes: true }); } catch (_) { /* ignore */ }
  for (const e of top) {
    if (!e.isFile()) continue;
    if (e.name === 'CMakeLists.txt' || e.name === 'README.md' || /\.(cmake|pro|pri)$/i.test(e.name)) files.push(path.join(ctx.root, e.name));
  }
  const docs = path.join(ctx.root, 'docs');
  if (fs.existsSync(docs) && !(ctx.pc.walkDirs || []).includes('docs')) walk(docs, ctx, files);
  return Array.from(new Set(files));
}

function checkAll(opts) {
  const ctx = (opts && opts.ctx) || makeContext(opts);
  const out = [];
  for (const f of collectAll(ctx)) out.push(...checkFile(f, { ctx }));
  return out;
}

function format(f) {
  return f.file + ':' + f.line + ':' + f.col + ' [' + f.gate + '] ' + (f.severity === 'warning' ? 'warning: ' : '') + f.message;
}

module.exports = { checkFile, checkAll, makeContext, GATES, format };

if (require.main === module) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const rest = args.filter((a) => a !== '--json');
  let findings = [];
  try {
    if (rest.length === 0 || rest.includes('--help')) {
      process.stderr.write('usage: gate-check.js --all | <files...>  [--json]\n');
      process.exit(rest.length === 0 ? 2 : 0);
    }
    const ctx = makeContext();
    if (rest.includes('--all')) findings = checkAll({ ctx });
    else for (const f of rest) findings.push(...checkFile(f, { ctx }));
  } catch (err) {
    process.stderr.write('[gate-check] internal error: ' + (err && err.stack ? err.stack : err) + '\n');
    process.exit(2);
  }
  const errors = findings.filter((f) => f.severity === 'error').length;
  if (json) {
    process.stdout.write(JSON.stringify({ errors, warnings: findings.length - errors, findings }, null, 2) + '\n');
  } else {
    for (const f of findings) process.stdout.write(format(f) + '\n');
    process.stdout.write('gate-check: ' + errors + ' error(s), ' + (findings.length - errors) + ' warning(s)\n');
  }
  process.exit(errors > 0 ? 1 : 0);
}
