#!/usr/bin/env node
// Configure / build / test a CMake project without remembering where cmake lives
// (pack cpp-cmake-gtest). Adapted from a project-written build.js (2026).
//
//   node .claude/tools/cpp-cmake-gtest/build.js <configure|build|test|all>
//        [--config Debug|Release] [--dir <dir>] [--slot <tag>] [--release-slot]
//        [-D<VAR>=<value> ...] [--target <t>] [--filter <regex>]
//
//   configure   cmake -S <project> -B <dir> [-G <generator>] <packConfig.configureArgs> <warnings option> -D...
//   build       cmake --build <dir> --config <cfg> --parallel [--target <t>]
//   test        ctest --test-dir <dir> -C <cfg> --output-on-failure [-R <filter>]
//   all         configure (when <dir>/CMakeCache.txt is missing or any -D was given) + build + test
//
//   --config        Debug (default from packConfig.defaultConfig) or Release
//   --dir           build directory (relative to the project unless absolute); default build.leadBuildDir
//   --slot          take a build slot (wt-slot.js) for <tag> and build there; printed as "slot <tag> -> <dir>"
//   --release-slot  release the slot after the run (otherwise: node .../wt-slot.js release <tag>)
//
// kit.config.json keys used: build.leadBuildDir, build.slots, build.warningsAsErrors,
// build.toolchain.cmakeExe / ctestExe / vsRoot, packConfig.cpp-cmake-gtest.{generator,
// configureArgs, defaultConfig, warningsAsErrorsOption}.
// cmake/ctest: build.toolchain.cmakeExe, then PATH, then Visual Studio installs (vswhere, the usual
// Program Files layout). Tool output is streamed; each step ends with
//   build.js: <step> OK|FAILED (<dir>, <config>)
// Exit code: 0, or the exit code of the first failing step; 2 usage / missing tool; 1 no free slot.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadConfig, packConfig } = require('./kit-env');

const { cfg, root: PROJECT } = loadConfig();
const PC = packConfig(cfg);
const TC = (cfg.build && cfg.build.toolchain) || {};
const VS_CMAKE_REL = path.join('Common7', 'IDE', 'CommonExtensions', 'Microsoft', 'CMake', 'CMake', 'bin');
const VSWHERE = path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');

function usage(msg) {
  if (msg) process.stderr.write('build.js: ' + msg + '\n');
  process.stderr.write('usage: node .claude/tools/cpp-cmake-gtest/build.js <configure|build|test|all> ' +
    '[--config Debug|Release] [--dir <dir>] [--slot <tag>] [--release-slot] [-D<VAR>=<v> ...] [--target <t>] [--filter <re>]\n');
  process.exit(2);
}

function parseArgs(argv) {
  const o = { step: null, config: PC.defaultConfig || 'Debug', dir: null, slot: null, releaseSlot: false, defs: [], target: null, filter: null };
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
    else if (a === '--target') o.target = val();
    else if (a === '--filter' || a === '-R') o.filter = val();
    else if (a.startsWith('-D')) o.defs.push(a);
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
function runTool(exe, args) {
  process.stdout.write('> ' + exe + ' ' + args.map((a) => (/\s/.test(a) ? '"' + a + '"' : a)).join(' ') + '\n');
  const r = spawnSync(exe, args, { stdio: 'inherit', cwd: PROJECT });
  if (r.error) { process.stderr.write('build.js: cannot run ' + exe + ': ' + r.error.message + '\n'); return 2; }
  return r.status === null ? 1 : r.status;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  let slots = null;
  let dir;
  if (o.slot) {
    slots = require('./wt-slot.js');
    dir = slots.acquire(o.slot);
    if (!dir) { process.stderr.write('build.js: no free build slot (run: node .claude/tools/cpp-cmake-gtest/wt-slot.js status)\n'); process.exit(1); }
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

  const confArgs = ['-S', PROJECT, '-B', dir];
  if (PC.generator) confArgs.push('-G', PC.generator);
  if (PC.architecture) confArgs.push('-A', PC.architecture);
  for (const a of PC.configureArgs || []) confArgs.push(a);
  if (cfg.build.warningsAsErrors && PC.warningsAsErrorsOption) confArgs.push('-D' + PC.warningsAsErrorsOption + '=ON');
  for (const d of o.defs) confArgs.push(d);

  const summary = (step, code) => {
    process.stdout.write('build.js: ' + step + ' ' + (code === 0 ? 'OK' : 'FAILED') + ' (' + shown + ', ' + o.config + ')\n');
    return code;
  };
  const configure = () => summary('configure', runTool(cmake, confArgs));
  const build = () => summary('build', runTool(cmake, ['--build', dir, '--config', o.config, '--parallel'].concat(o.target ? ['--target', o.target] : [])));
  const test = () => summary('test', runTool(ctest, ['--test-dir', dir, '-C', o.config, '--output-on-failure'].concat(o.filter ? ['-R', o.filter] : [])));

  let code = 0;
  if (o.step === 'configure') code = configure();
  else if (o.step === 'build') code = build();
  else if (o.step === 'test') code = test();
  else {
    const cache = fs.existsSync(path.join(dir, 'CMakeCache.txt'));
    if (!cache || o.defs.length) code = configure();
    else process.stdout.write('build.js: configure skipped (CMakeCache.txt exists in ' + shown + '; pass -D... to reconfigure)\n');
    if (code === 0) code = build();
    if (code === 0) code = test();
    process.stdout.write('build.js: all ' + (code === 0 ? 'OK' : 'FAILED') + ' (' + shown + ', ' + o.config + ')\n');
  }
  if (slots && o.releaseSlot) { slots.release(o.slot); process.stdout.write('build.js: slot ' + o.slot + ' released\n'); }
  process.exit(code);
}

main();
