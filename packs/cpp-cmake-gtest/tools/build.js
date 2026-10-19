#!/usr/bin/env node
// Configure / build / test a CMake project without remembering where cmake lives
// (pack cpp-cmake-gtest). Adapted from a project-written build.js (2026).
//
//   node .claude/tools/cpp-cmake-gtest/build.js <configure|build|test|all>
//        [--config Debug|Release] [--dir <dir>] [--slot <tag>] [--empty-slot] [--release-slot]
//        [--fresh] [--no-reconfigure] [--log-dir <dir>] [--no-log]
//        [-D<VAR>=<value> ...] [--target <t>] [--filter <regex>]
//
//   configure   cmake -S <project> -B <dir> [-G <generator>] <packConfig.configureArgs> <warnings option> -D...
//   build       cmake --build <dir> --config <cfg> --parallel [--target <t>]
//   test        ctest --test-dir <dir> -C <cfg> --output-on-failure [-R <filter>]
//   all         configure when needed (see below) + build + test
//
//   --config         Debug (default from packConfig.defaultConfig) or Release
//   --dir            build directory (relative to the project unless absolute); default build.leadBuildDir
//   --slot           take a build slot (wt-slot.js) for <tag> and build there; printed as "slot <tag> -> <dir>"
//   --empty-slot     with --slot: take a slot that holds no CMake cache (a true first build)
//   --release-slot   release the slot after the run (otherwise: node .../wt-slot.js release <tag>)
//   --fresh          empty the build directory first (only a directory inside the project that
//                    matches build.buildDirPatterns or the slot dir; a slot keeps its lock), then configure
//   --no-reconfigure never reconfigure on its own (build / all); a -D whose value the cache already
//                    holds does not force a configure
//   --log-dir        where step logs go; default <paths.scratch>/build-logs (outside the build
//                    dir, which may be emptied); --no-log writes none
//
// When `build` or `all` reconfigures by itself: no CMakeCache.txt; any -D given; --fresh; a CMake
// input (CMakeLists.txt, *.cmake, *.in, CMakePresets.json) newer than the cache; the set of
// source files differs from the one recorded at the last configure (<dir>/.kit-build-inputs.json).
// That keeps a tree configured with CMAKE_SUPPRESS_REGENERATION (packConfig.suppressRegeneration)
// honest after a new or removed source file.
// A cache that belongs to another source or build directory (a moved tree) stops every step:
// rerun with --fresh.
//
// configureArgs may use $env{NAME} (an environment variable; an unset one is an error) and
// ${sourceDir} (the project root with forward slashes), so a tree move needs no config edit.
//
// kit.config.json keys used: build.leadBuildDir, build.slots, build.buildDirPatterns,
// build.warningsAsErrors, build.toolchain.cmakeExe / ctestExe / vsRoot, paths.scratch,
// paths.readOnly, packConfig.cpp-cmake-gtest.{generator, architecture, configureArgs,
// defaultConfig, warningsAsErrorsOption, suppressRegeneration, testCountRegex}.
// cmake/ctest: build.toolchain.cmakeExe, then PATH, then Visual Studio installs (vswhere, the usual
// Program Files layout). Children run with MSBUILDDISABLENODEREUSE=1 so no idle MSBuild node
// outlives the run. Tool output is streamed and logged; each step ends with
//   build.js: <step> OK|FAILED (<dir>, <config>) <seconds> s, <n> warning(s), <n> error(s)[, tests ...]; log <file>
// Exit code: 0, or the exit code of the first failing step; 2 usage / missing tool / foreign cache;
// 1 no free slot.

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { loadConfig, packConfig } = require('./kit-env');

const { cfg, root: PROJECT } = loadConfig();
const PC = packConfig(cfg);
const TC = (cfg.build && cfg.build.toolchain) || {};
const VS_CMAKE_REL = path.join('Common7', 'IDE', 'CommonExtensions', 'Microsoft', 'CMake', 'CMake', 'bin');
const VSWHERE = path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');

function usage(msg) {
  if (msg) process.stderr.write('build.js: ' + msg + '\n');
  process.stderr.write('usage: node .claude/tools/cpp-cmake-gtest/build.js <configure|build|test|all> ' +
    '[--config Debug|Release] [--dir <dir>] [--slot <tag>] [--empty-slot] [--release-slot] [--fresh] [--no-reconfigure] ' +
    '[--log-dir <dir>] [--no-log] [-D<VAR>=<v> ...] [--target <t>] [--filter <re>]\n');
  process.exit(2);
}

function parseArgs(argv) {
  const o = { step: null, config: PC.defaultConfig || 'Debug', dir: null, slot: null, releaseSlot: false, emptySlot: false, fresh: false, noReconfigure: false, logDir: null, noLog: false, defs: [], target: null, filter: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { if (i + 1 >= argv.length) usage('missing value for ' + a); return argv[++i]; };
    if (a === '--config') o.config = val();
    else if (a.startsWith('--config=')) o.config = a.slice(9);
    else if (a === '--dir') o.dir = val();
    else if (a.startsWith('--dir=')) o.dir = a.slice(6);
    else if (a === '--slot') o.slot = val();
    else if (a.startsWith('--slot=')) o.slot = a.slice(7);
    else if (a === '--release-slot') o.releaseSlot = true;
    else if (a === '--empty-slot') o.emptySlot = true;
    else if (a === '--fresh') o.fresh = true;
    else if (a === '--no-reconfigure') o.noReconfigure = true;
    else if (a === '--log-dir') o.logDir = val();
    else if (a === '--no-log') o.noLog = true;
    else if (a === '--target') o.target = val();
    else if (a === '--filter' || a === '-R') o.filter = val();
    else if (a.startsWith('-D')) o.defs.push(a);
    else if (a === '-h' || a === '--help') usage();
    else if (!o.step && !a.startsWith('-')) o.step = a;
    else usage('unknown argument ' + a);
  }
  if (!['configure', 'build', 'test', 'all'].includes(o.step)) usage(o.step ? 'unknown step ' + o.step : 'missing step');
  if (o.dir && o.slot) usage('--dir and --slot are mutually exclusive');
  if (o.emptySlot && !o.slot) usage('--empty-slot needs --slot');
  return o;
}

// ---- tool lookup -----------------------------------------------------------------------------
function exeName(tool) { return process.platform === 'win32' ? tool + '.exe' : tool; }

function onPath(tool) {
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', '.bat'] : [''];
  for (const dir of String(process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const e of exts) {
      const p = path.join(dir.replace(/^"|"$/g, ''), tool + e);
      try { if (fs.statSync(p).isFile()) return p; } catch (_) { /* next */ }
    }
  }
  return null;
}

function vsInstalls() {
  const out = [];
  const add = (p) => { if (p && !out.includes(p)) out.push(p); };
  if (TC.vsRoot) add(TC.vsRoot);
  if (fs.existsSync(VSWHERE)) {
    for (const args of [['-latest', '-property', 'installationPath'], ['-products', '*', '-property', 'installationPath']]) {
      const r = spawnSync(VSWHERE, args, { encoding: 'utf8' });
      if (r.status === 0) for (const l of r.stdout.split(/\r?\n/)) add(l.trim());
    }
  }
  for (const pf of [process.env.ProgramFiles || 'C:\\Program Files', process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)']) {
    const base = path.join(pf, 'Microsoft Visual Studio');
    let versions = [];
    try { versions = fs.readdirSync(base).sort().reverse(); } catch (_) { continue; }
    for (const v of versions) {
      let eds = [];
      try { eds = fs.readdirSync(path.join(base, v)); } catch (_) { continue; }
      for (const e of eds) add(path.join(base, v, e));
    }
  }
  return out;
}

function findTool(tool) {
  const configured = TC[tool + 'Exe'];
  if (configured && fs.existsSync(configured)) return configured;
  const p = onPath(tool);
  if (p) return p;
  for (const vs of vsInstalls()) {
    const c = path.join(vs, VS_CMAKE_REL, exeName(tool));
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ---- running steps ---------------------------------------------------------------------------
const WARN_RE = /(?:^|[\s:])warning\s+[A-Z]+\d+\s*:|:\s*warning\s*:|^CMake Warning/i;
const ERR_RE = /(?:^|[\s:])(?:fatal\s+)?error\s+[A-Z]+\d+\s*:|:\s*(?:fatal\s+)?error\s*:|^CMake Error/i;
// One line per compiled translation unit: MSVC / MSBuild echo the bare source name, Ninja and
// Make print "Building CXX object" or "[n/m] Building ...".
const COMPILE_RE = /^\s*[^\s:<>|"]+\.(?:c|cc|cpp|cxx|ixx|c\+\+)\s*$|Building (?:C|CXX) object|^\[\d+\/\d+\]\s+(?:Building|Compiling)/i;

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

// Runs a tool, streams its output, tees it into a log file, counts distinct warning and error
// lines. Resolves { code, seconds, warnings, errors, text }.
function runTool(exe, args, logFile) {
  const line = '> ' + exe + ' ' + args.map((a) => (/\s/.test(a) ? '"' + a + '"' : a)).join(' ') + '\n';
  process.stdout.write(line);
  let log = null;
  if (logFile) {
    try { fs.mkdirSync(path.dirname(logFile), { recursive: true }); log = fs.openSync(logFile, 'w'); fs.writeSync(log, line); } catch (_) { log = null; }
  }
  const env = Object.assign({}, process.env, { MSBUILDDISABLENODEREUSE: '1' });
  const t0 = Date.now();
  return new Promise((resolve) => {
    let child;
    try { child = spawn(exe, args, { cwd: PROJECT, env }); } catch (err) {
      process.stderr.write('build.js: cannot run ' + exe + ': ' + err.message + '\n');
      resolve({ code: 2, seconds: 0, warnings: 0, errors: 0, compiled: 0, text: '' });
      return;
    }
    const warn = new Set(), errs = new Set();
    let compiled = 0;
    let text = '', pending = '';
    const scan = (s) => {
      pending += s;
      const parts = pending.split(/\r?\n/);
      pending = parts.pop();
      for (const l of parts) {
        const key = l.replace(/\s*\[[^\]]*\.(?:vcxproj|csproj|proj)\]\s*$/i, '').trim();
        if (ERR_RE.test(key)) errs.add(key); else if (WARN_RE.test(key)) warn.add(key);
        if (COMPILE_RE.test(key)) compiled++;
      }
    };
    const onData = (stream) => (buf) => {
      const s = buf.toString();
      stream.write(s);
      if (log !== null) { try { fs.writeSync(log, s); } catch (_) { /* ignore */ } }
      if (text.length < 4 * 1024 * 1024) text += s;
      scan(s);
    };
    child.stdout.on('data', onData(process.stdout));
    child.stderr.on('data', onData(process.stderr));
    child.on('error', (err) => { process.stderr.write('build.js: cannot run ' + exe + ': ' + err.message + '\n'); });
    child.on('close', (code) => {
      scan('\n');
      if (log !== null) { try { fs.closeSync(log); } catch (_) { /* ignore */ } }
      resolve({ code: code === null ? 1 : code, seconds: (Date.now() - t0) / 1000, warnings: warn.size, errors: errs.size, compiled, text });
    });
  });
}

// ---- cache and inputs ------------------------------------------------------------------------
function normDir(p) { const r = path.resolve(p).replace(/\\/g, '/').replace(/\/+$/, ''); return process.platform === 'win32' ? r.toLowerCase() : r; }

// A -D on the command line forces a configure only when the cache does not already hold that
// value (controller-kernel: the Qt half reconfigured on every run because its -D options are
// always given). Booleans compare as ON/OFF, paths with forward slashes and no trailing slash.
function defsDiffer(dir, defs) {
  let text;
  try { text = fs.readFileSync(path.join(dir, 'CMakeCache.txt'), 'utf8'); } catch (_) { return 'no CMakeCache.txt'; }
  const norm = (v) => {
    const s = String(v).trim().replace(/^"|"$/g, '').replace(/\\/g, '/').replace(/\/+$/, '');
    if (/^(on|true|yes|y|1)$/i.test(s)) return 'ON';
    if (/^(off|false|no|n|0)$/i.test(s)) return 'OFF';
    return process.platform === 'win32' ? s.toLowerCase() : s;
  };
  for (const d of defs) {
    const m = d.match(/^-D([^:=]+)(?::[A-Za-z]+)?=(.*)$/);
    if (!m) return 'a -D was given (' + d + ')';
    const c = text.match(new RegExp('^' + m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':[A-Za-z]+=(.*)$', 'm'));
    if (!c || norm(c[1]) !== norm(m[2])) return d + ' differs from the cache';
  }
  return null;
}

function readCache(dir) {
  let text;
  try { text = fs.readFileSync(path.join(dir, 'CMakeCache.txt'), 'utf8'); } catch (_) { return null; }
  const get = (k) => { const m = text.match(new RegExp('^' + k + ':[A-Z]+=(.*)$', 'm')); return m ? m[1].trim() : ''; };
  return { home: get('CMAKE_HOME_DIRECTORY'), cacheDir: get('CMAKE_CACHEFILE_DIR') };
}

// A cache written for another tree (the project moved, or a copied build dir).
function foreignCache(dir) {
  const c = readCache(dir);
  if (!c) return null;
  if (c.home && normDir(c.home) !== normDir(PROJECT)) return 'its source directory is ' + c.home;
  if (c.cacheDir && normDir(c.cacheDir) !== normDir(dir)) return 'it was written for ' + c.cacheDir;
  return null;
}

function patternRe(p) {
  const s = String(p).replace(/\\/g, '/').replace(/\/+$/, '');
  return new RegExp('^' + s.replace(/[.+^${}()|[\]]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]') + '(/|$)', 'i');
}
const SKIP_RES = ['.git', '.claude', 'node_modules'].concat(cfg.build.buildDirPatterns || []).concat(cfg.paths.readOnly || []).map(patternRe);
const SOURCE_EXT = /\.(c|cc|cpp|cxx|h|hh|hpp|hxx|inl|ipp|ixx)$/i;
const CMAKE_INPUT = /(^CMakeLists\.txt$|\.cmake$|\.in$|^CMake(User)?Presets\.json$)/i;

function scanInputs(buildDir) {
  const bd = normDir(buildDir);
  const sources = [];
  let newest = 0, newestFile = '';
  const walk = (abs, rel) => {
    let ents;
    try { ents = fs.readdirSync(abs, { withFileTypes: true }); } catch (_) { return; }
    for (const e of ents) {
      const r = rel ? rel + '/' + e.name : e.name;
      const a = path.join(abs, e.name);
      if (e.isDirectory()) {
        if (SKIP_RES.some((re) => re.test(r)) || normDir(a) === bd) continue;
        walk(a, r);
      } else if (e.isFile()) {
        if (SOURCE_EXT.test(e.name)) sources.push(r);
        if (CMAKE_INPUT.test(e.name)) {
          let m = 0;
          try { m = fs.statSync(a).mtimeMs; } catch (_) { /* ignore */ }
          if (m > newest) { newest = m; newestFile = r; }
        }
      }
    }
  };
  walk(PROJECT, '');
  sources.sort();
  return { sources, newest, newestFile };
}

const INPUTS_FILE = '.kit-build-inputs.json';

// Why the tree needs a configure before building, or null.
function staleReason(dir) {
  let cacheTime;
  try { cacheTime = fs.statSync(path.join(dir, 'CMakeCache.txt')).mtimeMs; } catch (_) { return 'no CMakeCache.txt'; }
  const now = scanInputs(dir);
  if (now.newest > cacheTime) return now.newestFile + ' is newer than the cache';
  let rec = null;
  try { rec = JSON.parse(fs.readFileSync(path.join(dir, INPUTS_FILE), 'utf8')); } catch (_) { return 'no source list recorded at the last configure'; }
  const before = new Set(rec.sources || []);
  const added = now.sources.filter((s) => !before.has(s));
  const after = new Set(now.sources);
  const removed = (rec.sources || []).filter((s) => !after.has(s));
  if (added.length || removed.length) {
    return 'source files changed since the last configure (' + (added.length ? '+' + added.slice(0, 3).join(', +') : '') +
      (added.length && removed.length ? '; ' : '') + (removed.length ? '-' + removed.slice(0, 3).join(', -') : '') + ')';
  }
  return null;
}

function recordInputs(dir) {
  try { fs.writeFileSync(path.join(dir, INPUTS_FILE), JSON.stringify({ time: new Date().toISOString(), sources: scanInputs(dir).sources })); } catch (_) { /* ignore */ }
}

// --fresh empties only a build directory inside the project: one that matches
// build.buildDirPatterns or lies under the slot dir. The slot lock survives.
function wipeBuildDir(dir) {
  const rel = path.relative(PROJECT, dir).replace(/\\/g, '/');
  const slotRoot = path.resolve(PROJECT, (cfg.build.slots && cfg.build.slots.dir) || 'build-wt');
  const inSlots = !path.relative(slotRoot, dir).startsWith('..') && normDir(dir) !== normDir(slotRoot);
  const isBuild = (cfg.build.buildDirPatterns || []).map(patternRe).some((re) => re.test(rel));
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel) || !(inSlots || isBuild)) {
    usage('--fresh refuses to empty ' + dir + ': not a build directory inside the project (build.buildDirPatterns, build.slots.dir)');
  }
  let n = 0;
  let ents = [];
  try { ents = fs.readdirSync(dir); } catch (_) { return 0; }
  for (const e of ents) {
    if (e === '.lock') continue;
    fs.rmSync(path.join(dir, e), { recursive: true, force: true });
    n++;
  }
  return n;
}

// $env{NAME} and ${sourceDir} in configureArgs.
function expandArg(a) {
  return String(a)
    .replace(/\$\{sourceDir\}/g, PROJECT.replace(/\\/g, '/'))
    .replace(/\$env\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (m, n) => {
      const v = process.env[n];
      if (v === undefined || v === '') usage('configureArgs uses $env{' + n + '} but the environment variable ' + n + ' is not set');
      return v;
    });
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  let slots = null;
  let dir;
  if (o.slot) {
    slots = require('./wt-slot.js');
    dir = slots.acquire(o.slot, { empty: o.emptySlot });
    if (!dir) {
      process.stderr.write('build.js: no free ' + (o.emptySlot ? 'empty ' : '') + 'build slot (run: node .claude/tools/cpp-cmake-gtest/wt-slot.js status' +
        (o.emptySlot ? '; or take any slot with --fresh' : '') + ')\n');
      process.exit(1);
    }
    process.stdout.write('build.js: slot ' + o.slot + ' -> ' + dir + '\n');
  } else {
    dir = path.resolve(PROJECT, o.dir || cfg.build.leadBuildDir || 'build');
  }
  const label = path.relative(PROJECT, dir).replace(/\\/g, '/') || '.';
  const shown = label.startsWith('..') ? dir : label;

  const cmake = findTool('cmake');
  const ctest = findTool('ctest');
  if (o.step !== 'test' && !cmake) usage('cmake not found (build.toolchain.cmakeExe, PATH, Visual Studio)');
  if ((o.step === 'test' || o.step === 'all') && !ctest) usage('ctest not found (build.toolchain.ctestExe, PATH, Visual Studio)');

  if (o.fresh) {
    const n = wipeBuildDir(dir);
    process.stdout.write('build.js: --fresh emptied ' + shown + ' (' + n + ' entries)\n');
  } else {
    const foreign = foreignCache(dir);
    if (foreign) {
      process.stderr.write('build.js: the CMake cache in ' + shown + ' belongs to another tree (' + foreign + '); MSBuild state ' +
        'would also point there. Rerun with --fresh to empty it and configure from scratch.\n');
      process.exit(2);
    }
  }

  const confArgs = ['-S', PROJECT, '-B', dir];
  if (PC.generator) confArgs.push('-G', PC.generator);
  if (PC.architecture) confArgs.push('-A', PC.architecture);
  for (const a of PC.configureArgs || []) confArgs.push(expandArg(a));
  if (PC.suppressRegeneration && !confArgs.some((a) => /^-DCMAKE_SUPPRESS_REGENERATION[:=]/.test(a))) confArgs.push('-DCMAKE_SUPPRESS_REGENERATION=ON');
  if (cfg.build.warningsAsErrors && PC.warningsAsErrorsOption) confArgs.push('-D' + PC.warningsAsErrorsOption + '=ON');
  for (const d of o.defs) confArgs.push(d);

  const logDir = o.noLog ? null : path.resolve(PROJECT, o.logDir || path.join(cfg.paths.scratch || '.claude/scratch', 'build-logs'));
  const runId = stamp() + '_' + label.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') + '_' + o.config;
  const logFor = (step) => (logDir ? path.join(logDir, runId + '_' + step + '.log') : null);

  const summary = (step, r, extra) => {
    const lf = logFor(step);
    process.stdout.write('build.js: ' + step + ' ' + (r.code === 0 ? 'OK' : 'FAILED') + ' (' + shown + ', ' + o.config + ') ' +
      r.seconds.toFixed(1) + ' s, ' + r.warnings + ' warning(s), ' + r.errors + ' error(s)' + (extra ? ', ' + extra : '') +
      (lf ? '; log ' + path.relative(PROJECT, lf).replace(/\\/g, '/') : '') + '\n');
    return r.code;
  };
  const configure = async () => {
    const r = await runTool(cmake, confArgs, logFor('configure'));
    if (r.code === 0) recordInputs(dir);
    return summary('configure', r);
  };
  // An up-to-date build ("no work to do") proves nothing about compiling: the summary says so,
  // so a verification report cannot count it as compile evidence (mc_protocol dry-run).
  const build = async () => {
    const r = await runTool(cmake, ['--build', dir, '--config', o.config, '--parallel'].concat(o.target ? ['--target', o.target] : []), logFor('build'));
    const extra = r.compiled ? r.compiled + ' file(s) compiled'
      : 'NOTHING COMPILED (up to date: not compile evidence; use --fresh or touch a source)';
    return summary('build', r, extra);
  };
  const test = async () => {
    // packConfig.testCountRegex: a test program that reports its own count (one CTest entry,
    // many tests inside). ctest then runs with -V so the program's output reaches the log, and
    // the summary adds the program's totals: groups 1 = tests, 2 = failures (summed over every
    // match, so several programs add up).
    let countRe = null;
    if (PC.testCountRegex) { try { countRe = new RegExp(PC.testCountRegex, 'g'); } catch (_) { usage('packConfig.cpp-cmake-gtest.testCountRegex is not a valid regular expression'); } }
    const r = await runTool(ctest, ['--test-dir', dir, '-C', o.config, countRe ? '-V' : '--output-on-failure'].concat(o.filter ? ['-R', o.filter] : []), logFor('test'));
    const m = r.text.match(/(\d+)% tests passed, (\d+) tests? failed out of (\d+)/);
    const skipped = (r.text.match(/\(Skipped\)/g) || []).length;
    let extra = m ? 'tests ' + (Number(m[3]) - Number(m[2])) + ' / ' + m[3] + ' passed, ' + m[2] + ' failed, ' + skipped + ' skipped' : 'no ctest summary line';
    if (countRe) {
      let n = 0, f = 0, k = 0, x;
      while ((x = countRe.exec(r.text))) { n += Number(x[1] || 0); f += Number(x[2] || 0); k++; if (!x[0]) countRe.lastIndex++; }
      extra += k ? '; program: ' + n + ' test(s), ' + f + ' failure(s)' : '; program count NOT FOUND (testCountRegex matched nothing)';
    }
    return summary('test', r, extra);
  };
  const needConfigure = () => {
    if (o.fresh) return '--fresh';
    if (o.defs.length) {
      const changed = defsDiffer(dir, o.defs);
      if (changed) return changed;
    }
    if (o.noReconfigure) return fs.existsSync(path.join(dir, 'CMakeCache.txt')) ? null : 'no CMakeCache.txt';
    return staleReason(dir);
  };

  let code = 0;
  if (o.step === 'configure') code = await configure();
  else if (o.step === 'test') {
    const why = staleReason(dir);
    if (why) process.stdout.write('build.js: WARNING the tree may be stale (' + why + '); run build or all first\n');
    code = await test();
  } else {
    const why = needConfigure();
    if (why) { process.stdout.write('build.js: configure (' + why + ')\n'); code = await configure(); }
    else if (o.step === 'all') process.stdout.write('build.js: configure skipped (cache current in ' + shown + ')\n');
    if (code === 0) code = await build();
    if (code === 0 && o.step === 'all') code = await test();
    if (o.step === 'all') process.stdout.write('build.js: all ' + (code === 0 ? 'OK' : 'FAILED') + ' (' + shown + ', ' + o.config + ')\n');
  }
  if (slots && o.releaseSlot) { slots.release(o.slot); process.stdout.write('build.js: slot ' + o.slot + ' released\n'); }
  process.exit(code);
}

main().catch((err) => { process.stderr.write('build.js: ' + (err && err.stack ? err.stack : err) + '\n'); process.exit(2); });
