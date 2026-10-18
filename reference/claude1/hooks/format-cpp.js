#!/usr/bin/env node
// PostToolUse hook, matcher: Edit|Write|MultiEdit.
// Runs `clang-format -i --style=file` on the edited C++ file (.h .hpp .hh .inl .ipp .cpp .cc .cxx).
//
// Runs ONLY when a `.clang-format` file exists at the project root: this hook never formats with a
// default or fallback style. Skips files outside the project and under build/, build-*/, .claude/.
// clang-format is searched on PATH, then in Visual Studio's bundled LLVM, then LLVM's install dir;
// if none is found it does nothing.
//
// Exit codes: always 0 (formatting problems are reported as a note on stderr, never block an edit).
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CPP_EXT = new Set(['.cpp', '.cc', '.cxx', '.h', '.hpp', '.hh', '.inl', '.ipp']);

function findClangFormat() {
  const tryExe = (exe) => {
    try { execFileSync(exe, ['--version'], { stdio: 'ignore', timeout: 5000 }); return exe; }
    catch (_) { return null; }
  };
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const candidates = [];
  for (const root of [pf, pf86]) {
    for (const ver of ['18', '2022', '2019']) {
      for (const ed of ['Community', 'Professional', 'Enterprise', 'BuildTools']) {
        candidates.push(path.join(root, 'Microsoft Visual Studio', ver, ed, 'VC', 'Tools', 'Llvm', 'x64', 'bin', 'clang-format.exe'));
      }
    }
  }
  candidates.push(path.join(pf, 'LLVM', 'bin', 'clang-format.exe'));
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return tryExe('clang-format');
}

function normSlash(p) {
  let s = String(p).replace(/\\/g, '/');
  const m = s.match(/^\/([a-zA-Z])\/(.*)$/);
  if (m) s = m[1] + ':/' + m[2];
  return s;
}

function readStdin(cb) {
  let raw = '';
  let done = false;
  const finish = () => { if (!done) { done = true; cb(raw); } };
  const timer = setTimeout(finish, 4000);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', () => { clearTimeout(timer); finish(); });
  process.stdin.on('error', () => { clearTimeout(timer); finish(); });
}

function main(raw) {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch (_) { return; }
  const ti = input.tool_input || {};
  const target = String(ti.file_path || ti.path || '');
  if (!target) return;

  const root = path.resolve(normSlash(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()));
  if (!fs.existsSync(path.join(root, '.clang-format'))) return; // no style file -> never format

  const abs = path.resolve(root, normSlash(target));
  const rel = path.relative(root, abs).replace(/\\/g, '/');
  if (rel.startsWith('..') || path.isAbsolute(rel)) return; // outside the project
  if (!CPP_EXT.has(path.extname(rel).toLowerCase())) return;
  if (/^(build|build-[^/]*|\.claude)\//i.test(rel) || /(^|\/)(_deps|third_party)\//i.test(rel)) return;
  if (!fs.existsSync(abs)) return;

  const exe = findClangFormat();
  if (!exe) return;

  try {
    execFileSync(exe, ['-i', '--style=file', '--fallback-style=none', abs],
      { cwd: root, stdio: ['ignore', 'ignore', 'pipe'], timeout: 15000 });
  } catch (err) {
    const msg = (err && err.stderr) ? String(err.stderr).trim() : String(err);
    try { fs.writeSync(2, '[format-cpp] clang-format skipped: ' + msg.split('\n')[0] + '\n'); } catch (_) { /* ignore */ }
  }
}

readStdin((raw) => {
  try { main(raw); } catch (err) {
    try { fs.writeSync(2, '[format-cpp] internal error (ignored): ' + (err && err.message ? err.message : err) + '\n'); } catch (_) { /* ignore */ }
  }
  process.exit(0);
});
