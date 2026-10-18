#!/usr/bin/env node
// Tests for docs-gate.js: node test-docs-gate.js   (exit 1 on any failure)
// Builds a throwaway project with one violation per check plus the allowed counterparts, runs
// the gate in --all mode (git and tree-walk) and in --paths mode, and checks the findings.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-gate-'));
const P = path.join(T, 'proj');
const W = (rel, text) => { const a = path.join(P, rel); fs.mkdirSync(path.dirname(a), { recursive: true }); fs.writeFileSync(a, text); };

W('.claude/kit.config.json', JSON.stringify({ project: { name: 't' }, git: { identity: { name: '', email: '' } },
  packConfig: { 'docs-spec-driven': { vendorDirs: ['components/'], machinePathAllow: ['LOCAL_TOOL_DIR'] } } }));
W('docs/architecture/architecture_decisions.md', [
  '# Architecture decisions', '', '### D1 - Use one host process (2026-01-10)', 'Context. Decision.', '',
  '### D2 - JSON over stdio (2026-01-11)', 'text', '', '### D2 - duplicate heading (2026-01-12)', 'dup', '',
  '### D4 - after a gap (2026-02-01)', 'gap', ''].join('\n'));
W('docs/spec/README.md', '# Specs\n\n| File | Prefix |\n|---|---|\n| qr_reader.md | QR |\n');
W('docs/spec/qr_reader.md', [
  '# QR reader', '', '## 2. Requirements', '', '| ID | Requirement |', '|---|---|',
  '| QR-001 | The reader MUST parse the raw field. |', '| QR-002 (new) | The reader MUST forward odd-length fields. |',
  '| QR-003 | Orphan requirement with no acceptance row. |', '', '## 5. Acceptance', '',
  '| ID | Verified by |', '|---|---|', '| QR-001 | tests/qr_test parse_raw |', '| QR-002 | tests/qr_test odd_length |', ''].join('\n'));
W('docs/spec/plc_link.md', [
  '# PLC link', '', '## 2. Requirements', '', '| PLC-010 | The link MUST retry once. |', '| QR-001 | duplicate of the QR id |', ''].join('\n'));
W('docs/backlog.md', [
  '# Backlog', '', 'Last used ID: BL-002', '', '| ID | Pri | Kind | Area | Summary | Detail |', '|---|---|---|---|---|---|',
  '| BL-001 | P2 | gap | QR | first | docs/spec/qr_reader.md section 6 |', '| BL-003 | P3 | drift | PLC | third | docs/spec/plc_link.md |',
  '| BL-003 | P3 | drift | PLC | duplicate row | docs/spec/plc_link.md |', '', '## Ruled out', '', '| ID | Summary | Why not |', '|---|---|---|',
  '| BL-002 | ruled out item | not worth it |', ''].join('\n'));
W('docs/technical_debt.md', '# Debt\n- second list\n');
W('docs/history/plan/2026-01-10_qr.md', '# Plan\nPhase 7 and CP1 are fine here. Decision D1 is plan-local here.\n');
W('docs/history/phase_status.md', '# Phase 7 status\nallowed here\n');
W('docs/rules/build.md', [
  '# Build', 'See .claude/rules for the agent rules.', 'Request text lives in docs/_retired/req1.md.',
  'This was done in phase 12B.', 'The sub agent wrote this.', 'Vendor docs at https://example.com/sdk.',
  'Tool at C:\\Users\\someone\\tools\\x.exe', 'Per ADR D2 and ADR D9.', 'Requirement QR-002 and QR-077 apply; ISO-9001 is not a spec id.',
  'Row BL-001 is open, BL-002 ruled out, BL-009 closed long ago.', ''].join('\n'));
W('src/qr/reader.cpp', [
  '// Implements QR-001; see ADR D1.', '// phase 10 D7 leftover comment', '// https://example.com/spec', '// installed under C:/Qt/5.15.2',
  '// cp932 and CP932 are code pages, not checkpoints', '// machine phase: Idle/Runtime (domain word, no number)',
  'int x = 0;', ''].join('\n'));
W('src/qr/phase_7_test.cpp', '// file name carries a phase\n');
W('CMakeLists.txt', '# project build\n# https://cmake.org is a URL in a build file\n');
W('CHANGELOG.md', '# Changelog\n\n## Unreleased\n');
W('README.md', '# Project\nUser docs only.\n');
W('components/vendor/sdk.h', '// phase 3 vendored text with .claude and https://vendor.example\n');
W('LICENSE', 'MIT https://opensource.org/licenses/MIT phase 1 of nothing\n');
W('qmake/local.pri', 'LOCAL_TOOL_DIR = C:/Users/me/tools\n');
W('build/out.txt', '.claude phase 99 untracked build output\n');
W('.gitignore', 'build/\n');

const PS = fs.readFileSync(path.join(P, 'docs/rules/build.md'), 'utf8');
if (!PS.includes('_retired')) throw new Error('fixture');

const gate = path.join(__dirname, 'docs-gate.js');
function run(args) {
  const r = spawnSync(process.execPath, [gate].concat(args), { cwd: P, encoding: 'utf8', env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: P }) });
  if (r.status === 2) throw new Error('gate crashed: ' + r.stderr);
  return { status: r.status, out: JSON.parse(r.stdout) };
}

let failures = 0;
function expect(name, cond, detail) { console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : '  ' + (detail || ''))); if (!cond) failures++; }
function has(f, check, file, line) { return f.findings.some((x) => x.check === check && x.file === file && (line === undefined || x.line === line)); }
function count(f, check, file) { return f.findings.filter((x) => x.check === check && (!file || x.file === file)).length; }

function checkAll(res, label) {
  const f = res.out;
  const L = (n) => label + ': ' + n;
  expect(L('exit 1 on HIGH'), res.status === 1, String(res.status));
  expect(L('adr-dup D2'), has(f, 'adr-dup', 'docs/architecture/architecture_decisions.md', 9));
  expect(L('adr-gap D4'), has(f, 'adr-gap', 'docs/architecture/architecture_decisions.md'));
  expect(L('adr-missing D9 in doc'), has(f, 'adr-missing', 'docs/rules/build.md', 8));
  expect(L('ADR D2 and D1 accepted'), count(f, 'adr-missing') === 1, JSON.stringify(f.findings.filter((x) => x.check === 'adr-missing')));
  expect(L('spec-dup QR-001 once'), count(f, 'spec-dup') === 1 && f.findings.find((x) => x.check === 'spec-dup').message.startsWith('QR-001 '), JSON.stringify(f.findings.filter((x) => x.check === 'spec-dup')));
  expect(L('spec-no-accept QR-003'), has(f, 'spec-no-accept', 'docs/spec/qr_reader.md', 9));
  expect(L('spec-no-accept only once'), count(f, 'spec-no-accept') === 1);
  expect(L('spec-marker (new)'), has(f, 'spec-marker', 'docs/spec/qr_reader.md', 8));
  expect(L('spec-unknown QR-077'), has(f, 'spec-unknown', 'docs/rules/build.md', 9));
  expect(L('ISO-9001 ignored'), !f.findings.some((x) => x.message.startsWith('ISO-9001')));
  expect(L('QR-002 accepted'), !f.findings.some((x) => x.message.startsWith('QR-002 ')));
  expect(L('backlog-dup BL-003'), has(f, 'backlog-dup', 'docs/backlog.md', 9));
  expect(L('backlog-lastid'), has(f, 'backlog-lastid', 'docs/backlog.md'));
  expect(L('backlog-stale BL-009'), has(f, 'backlog-stale', 'docs/rules/build.md', 10));
  expect(L('BL-001 / BL-002 accepted'), count(f, 'backlog-stale') === 1);
  expect(L('backlog-second'), has(f, 'backlog-second', 'docs/technical_debt.md'));
  expect(L('claude-ref in doc'), has(f, 'claude-ref', 'docs/rules/build.md', 2));
  expect(L('request-ref'), has(f, 'request-ref', 'docs/rules/build.md', 3));
  expect(L('phase 12B in doc'), has(f, 'phase', 'docs/rules/build.md', 4));
  expect(L('phase in code comment'), has(f, 'phase', 'src/qr/reader.cpp', 2));
  expect(L('phase in file name'), has(f, 'phase', 'src/qr/phase_7_test.cpp', 0));
  expect(L('CP932 and domain phase accepted'), !has(f, 'phase', 'src/qr/reader.cpp', 5) && !has(f, 'phase', 'src/qr/reader.cpp', 6));
  expect(L('history dir exempt from phase'), count(f, 'phase', 'docs/history/plan/2026-01-10_qr.md') === 0 && count(f, 'phase', 'docs/history/phase_status.md') === 0);
  expect(L('agent-vocab'), has(f, 'agent-vocab', 'docs/rules/build.md', 5));
  expect(L('url in doc LOW'), f.findings.some((x) => x.check === 'url' && x.file === 'docs/rules/build.md' && x.severity === 'LOW'));
  expect(L('url in code MEDIUM'), f.findings.some((x) => x.check === 'url' && x.file === 'src/qr/reader.cpp' && x.severity === 'MEDIUM'));
  expect(L('url in CMakeLists'), has(f, 'url', 'CMakeLists.txt', 2));
  expect(L('machine-path doc'), has(f, 'machine-path', 'docs/rules/build.md', 7));
  expect(L('machine-path code'), has(f, 'machine-path', 'src/qr/reader.cpp', 4));
  expect(L('machinePathAllow honoured'), count(f, 'machine-path', 'qmake/local.pri') === 0);
  expect(L('vendor dir exempt'), count(f, null, 'components/vendor/sdk.h') === 0 && !f.findings.some((x) => x.file === 'components/vendor/sdk.h'));
  expect(L('LICENSE exempt'), !f.findings.some((x) => x.file === 'LICENSE'));
  expect(L('.claude not scanned'), !f.findings.some((x) => x.file.startsWith('.claude/')));
  expect(L('build output not scanned'), !f.findings.some((x) => x.file.startsWith('build/')));
  expect(L('no changelog finding'), count(f, 'changelog') === 0);
}

// 1. tree walk (no git)
checkAll(run(['--all', '--json', '--no-git']), 'walk');

// 2. git ls-files, if git is available
const gi = spawnSync('git', ['init', '-q'], { cwd: P, encoding: 'utf8' });
if (!gi.error && gi.status === 0) {
  spawnSync('git', ['add', '.'], { cwd: P, encoding: 'utf8' });
  spawnSync('git', ['-c', 'user.name=docs-gate-test', '-c', 'user.email=docs-gate-test@localhost', 'commit', '-q', '-m', 'fixture'], { cwd: P, encoding: 'utf8' });
  const res = run(['--all', '--json']);
  checkAll(res, 'git');
  expect('git: build/ ignored by git', res.out.paths.every((x) => !x.startsWith('build/')));
  // 3. --paths scope: only the named file's findings, cross-file facts still loaded
  const sub = run(['--paths', 'src/qr/reader.cpp', '--json']);
  expect('paths: only reader.cpp', sub.out.findings.every((x) => x.file === 'src/qr/reader.cpp'), JSON.stringify(sub.out.findings.map((x) => x.file)));
  expect('paths: adr facts loaded (D1 accepted, phase flagged)', has(sub.out, 'phase', 'src/qr/reader.cpp', 2) && count(sub.out, 'adr-missing') === 0);
  // 4. --changed: modify one clean file, expect only that file
  fs.appendFileSync(path.join(P, 'README.md'), 'Edited in phase 3.\n');
  const ch = run(['--changed', '--json']);
  expect('changed: README only', ch.out.files === 1 && ch.out.paths[0] === 'README.md', JSON.stringify(ch.out.paths));
  expect('changed: phase flagged', has(ch.out, 'phase', 'README.md', 3));
  // 5. clean file passes with exit 0
  const ok = run(['--paths', 'CHANGELOG.md', '--json']);
  expect('clean file: exit 0', ok.status === 0 && ok.out.findings.length === 0);
  // 6. --strict fails on MEDIUM
  const st = run(['--paths', 'CMakeLists.txt', '--json', '--strict']);
  expect('strict: MEDIUM fails', st.status === 1 && st.out.counts.HIGH === 0 && st.out.counts.MEDIUM === 1);
} else {
  console.log('skip git cases (git not available)');
}

// 7. missing decision file: a citation is HIGH
fs.rmSync(path.join(P, 'docs/architecture/architecture_decisions.md'));
const nf = run(['--paths', 'src/qr/reader.cpp', '--json']);
expect('adr file missing -> adr-missing', has(nf.out, 'adr-missing', 'src/qr/reader.cpp', 1));

console.log('failures: ' + failures);
try { fs.rmSync(T, { recursive: true, force: true }); } catch (_) { /* temp */ }
process.exit(failures ? 1 : 0);
