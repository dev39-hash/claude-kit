#!/usr/bin/env node
// Configure / build / test the kernel without remembering where cmake lives.
//
//   node .claude/tools/build.js <configure|build|test|all> [--config Debug|Release] [--qt]
//                               [--dir <dir>] [--slot <tag>]
//
//   configure   cmake -S <project> -B <dir>            (+ -DCTRL_KERNEL_BUILD_QT=ON -DCMAKE_PREFIX_PATH=<Qt> with --qt)
//   build       cmake --build <dir> --config <config> --parallel
//   test        ctest --test-dir <dir> -C <config> --output-on-failure
//   all         configure (only when <dir>/CMakeCache.txt is missing, or --qt is asked and the cache
//               was configured without Qt) + build + test
//
//   --config    Debug (default) or Release (any CMake configuration name is passed through)
//   --qt        the Qt half; default dir becomes build-qt. Qt dir: env CTRL_QT_DIR, else C:/Qt/6.11.1/msvc2022_64
//   --dir       build directory (relative to the project folder unless absolute); default build
//   --slot      take a build slot (wt-slot.js) for <tag> and build there; the slot dir is printed.
//               Release it afterwards: node .claude/tools/wt-slot.js release <tag>
//
// cmake/ctest are looked up on PATH first, then in the Visual Studio 18 Community install, then in any
// other Visual Studio install found with vswhere or under C:\Program Files\Microsoft Visual Studio.
// Output of the tools is streamed. Exit code: 0, or the exit code of the first failing step
// (2 for usage errors / missing tools). Each step ends with a summary line
//   build.js: <step> OK|FAILED (<dir>, <config>)
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT = path.resolve(process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..'));
const VS_CMAKE_REL = path.join('Common7', 'IDE', 'CommonExtensions', 'Microsoft', 'CMake', 'CMake', 'bin');
const VS18 = 'C:\\Program Files\\Microsoft Visual Studio\\18\\Community';
const VSWHERE = 'C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe';
const DEFAULT_QT = 'C:/Qt/6.11.1/msvc2022_64';

function usage(msg) {
  if (msg) process.stderr.write('build.js: ' + msg + '\n');
  process.stderr.write('usage: node .claude/tools/build.js <configure|build|test|all> ' +
    '[--config Debug|Release] [--qt] [--dir <dir>] [--slot <tag>]\n');
  process.exit(2);
}

function parseArgs(argv) {
  const o = { step: null, config: 'Debug', qt: false, dir: null, slot: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { if (i + 1 >= argv.length) usage('missing value for ' + a); return argv[++i]; };
    if (a === '--config') o.config = val();
    else if (a.startsWith('--config=')) o.config = a.slice(9);
    else if (a === '--qt') o.qt = true;
    else if (a === '--dir') o.dir = val();
    else if (a.startsWith('--dir=')) o.dir = a.slice(6);
    else if (a === '--slot') o.slot = val();
    else if (a.startsWith('--slot=')) o.slot = a.slice(7);
    else if (a === '-h' || a === '--help') usage();
    else if (!o.step && !a.startsWith('-')) o.step = a;
    else usage('unknown argument ' + a);
  }
  if (!['configure', 'build', 'test', 'all'].includes(o.step)) usage(o.step ? 'unknown step ' + o.step : 'missing step');
  if (o.dir && o.slot) usage('--dir and --slot are mutually exclusive');
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
  add(VS18);
  if (fs.existsSync(VSWHERE)) {
    for (const args of [['-latest', '-property', 'installationPath'], ['-products', '*', '-property', 'installationPath']]) {
      const r = spawnSync(VSWHERE, args, { encoding: 'utf8' });
      if (r.status === 0) for (const l of r.stdout.split(/\r?\n/)) add(l.trim());
    }
  }
  // last resort: scan the usual layout  <Program Files>\Microsoft Visual Studio\<version>\<edition>
  for (const pf of ['C:\\Program Files', 'C:\\Program Files (x86)']) {
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
  const p = onPath(tool);
  if (p) return p;
  for (const vs of vsInstalls()) {
    const c = path.join(vs, VS_CMAKE_REL, exeName(tool));
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ---- running steps ---------------------------------------------------------------------------
function qtDir() {
  const d = process.env.CTRL_QT_DIR || (fs.existsSync(DEFAULT_QT) ? DEFAULT_QT : '');
  return d ? d.replace(/\\/g, '/') : '';
}

function runTool(exe, args) {
  process.stdout.write('> ' + exe + ' ' + args.map((a) => (/\s/.test(a) ? '"' + a + '"' : a)).join(' ') + '\n');
  const r = spawnSync(exe, args, { stdio: 'inherit', cwd: PROJECT });
  if (r.error) { process.stderr.write('build.js: cannot run ' + exe + ': ' + r.error.message + '\n'); return 2; }
  return r.status === null ? 1 : r.status;
}

function cacheHasQt(dir) {
  try { return /^CTRL_KERNEL_BUILD_QT:BOOL=ON\s*$/m.test(fs.readFileSync(path.join(dir, 'CMakeCache.txt'), 'utf8')); }
  catch (_) { return false; }
}

function main() {
  const o = parseArgs(process.argv.slice(2));

  let dir;
  if (o.slot) {
    const slots = require('./wt-slot.js');
    dir = slots.acquire(o.slot);
    if (!dir) { process.stderr.write('build.js: no free build slot (run: node .claude/tools/wt-slot.js status)\n'); process.exit(1); }
    process.stdout.write('build.js: slot ' + o.slot + ' -> ' + dir + '\n');
  } else {
    dir = path.resolve(PROJECT, o.dir || (o.qt ? 'build-qt' : 'build'));
  }
  const label = path.relative(PROJECT, dir).replace(/\\/g, '/') || '.';
  const shown = label.startsWith('..') ? dir : label;

  const cmake = findTool('cmake');
  const ctest = findTool('ctest');
  const needCmake = o.step !== 'test';
  if (needCmake && !cmake) usage('cmake not found (PATH, Visual Studio 18, vswhere)');
  if ((o.step === 'test' || o.step === 'all') && !ctest) usage('ctest not found (PATH, Visual Studio 18, vswhere)');

  let qtArgs = [];
  if (o.qt) {
    const q = qtDir();
    if (!q) usage('--qt needs a Qt install: set CTRL_QT_DIR or install ' + DEFAULT_QT);
    qtArgs = ['-DCTRL_KERNEL_BUILD_QT=ON', '-DCMAKE_PREFIX_PATH=' + q];
  }

  const summary = (step, code) => {
    process.stdout.write('build.js: ' + step + ' ' + (code === 0 ? 'OK' : 'FAILED') + ' (' + shown + ', ' + o.config + ')\n');
    return code;
  };
  const configure = () => summary('configure', runTool(cmake, ['-S', PROJECT, '-B', dir].concat(qtArgs)));
  const build = () => summary('build', runTool(cmake, ['--build', dir, '--config', o.config, '--parallel']));
  const test = () => summary('test', runTool(ctest, ['--test-dir', dir, '-C', o.config, '--output-on-failure']));

  let code = 0;
  if (o.step === 'configure') code = configure();
  else if (o.step === 'build') code = build();
  else if (o.step === 'test') code = test();
  else {
    const cache = fs.existsSync(path.join(dir, 'CMakeCache.txt'));
    if (!cache || (o.qt && !cacheHasQt(dir))) code = configure();
    else process.stdout.write('build.js: configure skipped (CMakeCache.txt exists in ' + shown + ')\n');
    if (code === 0) code = build();
    if (code === 0) code = test();
    process.stdout.write('build.js: all ' + (code === 0 ? 'OK' : 'FAILED') + ' (' + shown + ', ' + o.config + ')\n');
  }
  process.exit(code);
}

main();
