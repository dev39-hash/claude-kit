#!/usr/bin/env node
// Tests for wt-guard.js: node test-wt-guard.js   (exit 1 on any failure)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'wt-guard-'));
const P = path.join(T, 'proj');
fs.mkdirSync(path.join(P, '.claude'), { recursive: true });
fs.mkdirSync(path.join(P, '.wt', 'slot1', '3rdparty', 'eigen'), { recursive: true });
fs.mkdirSync(path.join(P, 'build'), { recursive: true });
fs.writeFileSync(path.join(P, '.claude', 'kit.config.json'), JSON.stringify({ project: { name: 't' }, git: { identity: { name: '', email: '' } }, build: { isolation: 'worktrees', worktrees: { dir: '.wt' } } }));
const PS = P.replace(/\\/g, '/');

function runHook(cmd, tool, cwd) {
  const input = { tool_name: tool || 'Bash', tool_input: { command: cmd }, cwd: cwd || P };
  const r = spawnSync(process.execPath, [path.join(__dirname, 'wt-guard.js')], { input: JSON.stringify(input), encoding: 'utf8', env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: P }) });
  if (!r.stdout.trim()) return 'allow';
  try { return JSON.parse(r.stdout).hookSpecificOutput.permissionDecision; } catch (_) { return 'bad'; }
}

const cases = [
  ['rm -rf .wt/slot1', 'Bash', 'deny'],
  ['rm -r .wt/slot1/3rdparty', 'Bash', 'deny'],
  ['rm -rf .wt', 'Bash', 'deny'],
  ['rm -rf .', 'Bash', 'deny'],
  ['rm .wt/slot1/x.txt', 'Bash', 'allow'],
  ['rm -rf build/old', 'Bash', 'allow'],
  ['Remove-Item -Recurse -Force .wt\\slot1', 'PowerShell', 'deny'],
  ['Remove-Item .wt\\slot1\\x.txt', 'PowerShell', 'allow'],
  ['cmd /c "rd /s /q .wt\\slot1\\3rdparty\\eigen"', 'Bash', 'deny'],
  ['cmd /c rmdir .wt\\slot1\\3rdparty\\eigen', 'Bash', 'ask'],
  ['robocopy src .wt\\slot1\\src /MIR', 'Bash', 'deny'],
  ['git worktree remove --force .wt/slot1', 'Bash', 'ask'],
  ['git worktree remove .wt/slot1', 'Bash', 'allow'],
  ['git clean -fd .wt/slot1', 'Bash', 'deny'],
  ['git clean -n', 'Bash', 'allow'],
  ['git clean -fd', 'Bash', 'deny', path.join(P, '.wt', 'slot1')],
  ['git clean -fd src', 'Bash', 'allow'],
  ['git worktree list', 'Bash', 'allow'],
];
let failures = 0;
for (const [cmd, tool, expect, cwd] of cases) {
  const got = runHook(cmd, tool, cwd);
  const ok = got === expect;
  if (!ok) failures++;
  console.log((ok ? 'ok   ' : 'FAIL ') + expect.padEnd(6) + (ok ? '' : 'got ' + got + '  ') + cmd);
}
console.log('failures: ' + failures + ' / ' + cases.length);
try { fs.rmSync(T, { recursive: true, force: true }); } catch (_) { /* temp */ }
process.exit(failures ? 1 : 0);
