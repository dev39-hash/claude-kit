#!/usr/bin/env node
// Tests for gate-check.js and kernel-gates.js: node test-kernel-gates.js   (exit 1 on any failure)
// Builds a throwaway project with one violation per gate plus the allowed counterparts, checks
// the findings of the engine per file, the --all walk and the --json CLI, then the hook's exit
// codes and output shape.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'kernel-gates-'));
const P = path.join(T, 'proj');
const W = (rel, text) => { const a = path.join(P, rel); fs.mkdirSync(path.dirname(a), { recursive: true }); fs.writeFileSync(a, text); };

W('.claude/kit.config.json', JSON.stringify({ project: { name: 't' }, git: { identity: { name: '', email: '' } }, packs: ['controller-kernel'] }));
W('include/ctrl_kernel/blocks.h', ['#ifndef CTRL_KERNEL_BLOCKS_H', '#define CTRL_KERNEL_BLOCKS_H', '#include <array>', '#include <optional>',
  '#include "ctrl_kernel/ids.h"', 'namespace ctrl { struct Timers { int slots[8]; }; }', '#endif', ''].join('\n'));
W('include/ctrl_kernel/bad.h', ['#include <thread>', '#include <QObject>', '#include <cstdint>',
  'namespace ctrl {', 'struct Bad {', '    QTimer *t{nullptr};', '    void go() { auto now = std::chrono::steady_clock::now(); emit done(); }',
  '};', '}', ''].join('\n'));
W('pump_core/pump_core.h', ['#ifndef PUMP_CORE_H', '#define PUMP_CORE_H', '#include <vector>', '#include "ctrl_kernel/blocks.h"', '#include "pump_core/events.h"', '#include "events.h"', '#endif', ''].join('\n'));
W('pump_core/events.h', '#pragma once\nstruct Setup {};\n');
W('pump_core/pump_core.cpp', ['#include "pump_core/pump_core.h"', '#include "../device.h"', '// QTimer in a comment is fine, 2000 too',
  'const char *s = "QTimer 3000";', 'int handler() {', '    int a = 0, b = 1, deadline = 2000;', '    int arr[8];', '    constexpr int k = 5;',
  '    enum class E { X = 7 };', '    return std::rand() + deadline + arr[b] + k + a;', '}', ''].join('\n'));
W('pump_core/warn_only.cpp', '#include "pump_core/pump_core.h"\nint f() { return 42; }\n');
W('pump_core/policy.h', 'struct Policy { int startDeadlineMs{3000}; int attempts{10}; };\n');
W('qt/shell.cpp', ['#include <QEventLoop>', '#pragma warning(disable: 4996)', 'void run(QObject *o, QThread *t) {',
  '    QEventLoop loop; loop.exec();', '    QMetaObject::invokeMethod(o, "x", Qt::BlockingQueuedConnection);', '    t->wait();', '}', ''].join('\n'));
W('src/app.cpp', '#include <QObject>\nint v = 42; // not a core, not a shell\n');
const E_ACUTE = String.fromCharCode(0xe9);
const ARROW = String.fromCharCode(0x2192);
W('src/odd.cpp', 'int x = 1; // caf' + E_ACUTE + '\n');
W('3rdparty/vendor/v.cpp', 'int y = 2; // ' + E_ACUTE + ' vendored, exempt\n');
W('docs/guide.md', '# Guide\n\nUse the arrow ' + ARROW + ' here.\n');
W('CMakeLists.txt', '# -Wno-unused in a comment is fine\nadd_library(x pump_core/pump_core.cpp)\ntarget_compile_options(x PRIVATE /wd4996)\n');
W('build/gen.cpp', '#include <QTimer>\n');
W('.claude/scratch/n.cpp', 'QTimer t;\n');

// kit repo layout (packs/<pack>/hooks/) and installed layout (.claude/hooks/<pack>/)
function firstExisting(cands) { for (const c of cands) if (fs.existsSync(c)) return c; throw new Error('not found: ' + cands.join(' | ')); }
const GATE = firstExisting([path.join(__dirname, '..', 'tools', 'gate-check.js'), path.join(__dirname, '..', '..', 'tools', 'controller-kernel', 'gate-check.js')]);
const CONFIG = firstExisting([path.join(__dirname, '..', '..', '..', 'core', 'hooks', 'lib', 'config.js'), path.join(__dirname, '..', 'lib', 'config.js')]);
const gate = require(GATE);
const ctx = gate.makeContext({ root: P, cfg: require(CONFIG).DEFAULTS });
let failures = 0;
function check(name, ok, detail) {
  if (!ok) failures++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : '  ' + (detail || '')));
}
function gatesOf(rel) {
  const f = gate.checkFile(path.join(P, rel), { ctx });
  return [...new Set(f.map((x) => x.gate))].sort().join(',');
}
const perFile = [
  ['include/ctrl_kernel/blocks.h', ''],
  ['include/ctrl_kernel/bad.h', 'L2-include,L2-purity,L4-timer,L5-callout'],
  ['pump_core/pump_core.h', ''],
  ['pump_core/pump_core.cpp', 'L2-include,L2-purity,L9-literal'],
  ['pump_core/warn_only.cpp', 'L9-literal'],
  ['pump_core/policy.h', ''],
  ['qt/shell.cpp', 'L10-blocking,WARN-PRAGMA'],
  ['src/app.cpp', ''],
  ['src/odd.cpp', 'ASCII'],
  ['3rdparty/vendor/v.cpp', ''],
  ['docs/guide.md', 'ASCII'],
  ['CMakeLists.txt', 'WARN-PRAGMA'],
  ['build/gen.cpp', ''],
  ['.claude/scratch/n.cpp', ''],
];
for (const [rel, expect] of perFile) {
  const got = gatesOf(rel);
  check('gates ' + rel + ' -> ' + (expect || '(clean)'), got === expect, 'got ' + (got || '(clean)'));
}
// details
const bad = gate.checkFile(path.join(P, 'include/ctrl_kernel/bad.h'), { ctx });
check('bad.h: <thread> reported as impure include', bad.some((f) => f.gate === 'L2-include' && /thread/.test(f.message) && f.line === 1));
check('bad.h: <QObject> is both a Qt include (purity) and a bad include', bad.filter((f) => f.line === 2).length === 2);
const core = gate.checkFile(path.join(P, 'pump_core/pump_core.cpp'), { ctx });
const lits = core.filter((f) => f.gate === 'L9-literal');
check('L9: exactly one literal (2000); 0/1, [8], constexpr, enum, comment and string are exempt', lits.length === 1 && /2000/.test(lits[0].message), JSON.stringify(lits.map((l) => l.message)));
check('L9: findings carry line:col and a hint', lits[0] && lits[0].line === 6 && lits[0].col > 0 && /Policy/.test(lits[0].hint));
check('L2-include: "../device.h" rejected, own-dir "events.h" and "pump_core/..." accepted', core.filter((f) => f.gate === 'L2-include').length === 1);
const shell = gate.checkFile(path.join(P, 'qt/shell.cpp'), { ctx });
check('L10: #include <QEventLoop>, QEventLoop, BlockingQueuedConnection, ->wait( = 4 findings', shell.filter((f) => f.gate === 'L10-blocking').length === 4, String(shell.filter((f) => f.gate === 'L10-blocking').length));
check('shell is not a pure core: QObject/QThread allowed there', !shell.some((f) => f.gate === 'L2-purity'));
// literalGate off
const ctxOff = gate.makeContext({ root: P, cfg: Object.assign({}, ctx.cfg, { packConfig: { 'controller-kernel': { literalGate: 'off' } } }) });
check('packConfig literalGate off disables L9', gate.checkFile(path.join(P, 'pump_core/warn_only.cpp'), { ctx: ctxOff }).length === 0);
// custom core dir names
const ctxDirs = gate.makeContext({ root: P, cfg: Object.assign({}, ctx.cfg, { packConfig: { 'controller-kernel': { coreDirs: ['src'], kernelInclude: 'kernel' } } }) });
check('packConfig coreDirs makes src/ a pure core', gate.checkFile(path.join(P, 'src/app.cpp'), { ctx: ctxDirs }).some((f) => f.gate === 'L2-purity'));
check('packConfig kernelInclude: ctrl_kernel/ no longer special', gate.checkFile(path.join(P, 'include/ctrl_kernel/blocks.h'), { ctx: ctxDirs }).length === 0);
// --all
const all = gate.checkAll({ ctx });
const allFiles = new Set(all.map((f) => f.file));
check('--all walks include/, qt/, src/, docs/, CMakeLists.txt (walkDirs + docs + top-level)', ['include/ctrl_kernel/bad.h', 'qt/shell.cpp', 'src/odd.cpp', 'docs/guide.md', 'CMakeLists.txt'].every((f) => allFiles.has(f)), [...allFiles].join(' '));
check('--all skips build/ and .claude/', ![...allFiles].some((f) => /^(build|\.claude)\//.test(f)));
check('--all does not walk pump_core/ (not in walkDirs; add it to packConfig walkDirs)', ![...allFiles].some((f) => /^pump_core\//.test(f)));

// CLI
const envp = Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: P });
const cli = spawnSync(process.execPath, [GATE, '--all', '--json'], { encoding: 'utf8', env: envp, cwd: P });
let js = null;
try { js = JSON.parse(cli.stdout); } catch (_) { js = null; }
check('CLI --all --json: exit 1 and parseable JSON with errors > 0', cli.status === 1 && js && js.errors > 0 && Array.isArray(js.findings), String(cli.status) + ' ' + cli.stderr);
const cliClean = spawnSync(process.execPath, [GATE, 'include/ctrl_kernel/blocks.h'], { encoding: 'utf8', env: envp, cwd: P });
check('CLI clean file: exit 0 and summary line', cliClean.status === 0 && /0 error\(s\), 0 warning\(s\)/.test(cliClean.stdout), cliClean.stdout + cliClean.stderr);

// hook
function hook(filePath, extra) {
  const input = Object.assign({ tool_name: 'Edit', tool_input: { file_path: filePath }, cwd: P }, extra || {});
  return spawnSync(process.execPath, [path.join(__dirname, 'kernel-gates.js')], { input: JSON.stringify(input), encoding: 'utf8', env: envp });
}
let r = hook(path.join(P, 'include/ctrl_kernel/bad.h'));
check('hook: gate errors -> exit 2, findings on stderr, nothing on stdout', r.status === 2 && /\[kernel-gates\] 4 error|\[kernel-gates\] \d+ error/.test(r.stderr) && /law: L2/.test(r.stderr) && r.stdout === '', String(r.status) + ' ' + r.stderr.slice(0, 80));
r = hook('pump_core/warn_only.cpp');
let ctxOut = null;
try { ctxOut = JSON.parse(r.stdout).hookSpecificOutput; } catch (_) { ctxOut = null; }
check('hook: warnings only (relative path) -> exit 0 + additionalContext', r.status === 0 && ctxOut && ctxOut.hookEventName === 'PostToolUse' && /L9-literal/.test(ctxOut.additionalContext), String(r.status) + ' ' + r.stdout.slice(0, 80));
r = hook(path.join(P, 'include/ctrl_kernel/blocks.h'));
check('hook: clean file -> exit 0, silent', r.status === 0 && r.stdout === '' && r.stderr === '');
r = hook(path.join(P, '.claude/scratch/n.cpp'));
check('hook: file under .claude/ skipped', r.status === 0 && r.stdout === '');
r = hook(path.join(P, 'build/gen.cpp'));
check('hook: file under a build dir skipped', r.status === 0 && r.stdout === '');
r = hook(path.join(T, 'elsewhere.cpp'));
check('hook: file outside the project skipped', r.status === 0 && r.stdout === '');
r = hook(path.join(P, 'pump_core/missing.cpp'));
check('hook: missing file skipped', r.status === 0 && r.stdout === '');
r = spawnSync(process.execPath, [path.join(__dirname, 'kernel-gates.js')], { input: 'not json', encoding: 'utf8', env: envp });
check('hook: unreadable input -> exit 0 (fail open)', r.status === 0);
r = spawnSync(process.execPath, [path.join(__dirname, 'kernel-gates.js')], { input: JSON.stringify({ tool_name: 'Edit', tool_input: {} }), encoding: 'utf8', env: envp });
check('hook: no file_path -> exit 0', r.status === 0 && r.stdout === '');

// sources ASCII
for (const f of [GATE, path.join(path.dirname(GATE), 'kit-env.js'), __filename, path.join(__dirname, 'kernel-gates.js')]) {
  const buf = fs.readFileSync(f);
  let ascii = true;
  for (const b of buf) if (b > 0x7f) { ascii = false; break; }
  check('ASCII source ' + path.basename(f), ascii);
}

console.log('failures: ' + failures);
try { fs.rmSync(T, { recursive: true, force: true }); } catch (_) { /* temp */ }
process.exit(failures ? 1 : 0);
