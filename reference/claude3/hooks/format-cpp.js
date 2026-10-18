#!/usr/bin/env node
// PostToolUse hook (Edit|Write|MultiEdit): run clang-format -i on the edited C++ file.
// Looks for clang-format on PATH, then inside Visual Studio's bundled LLVM, then LLVM's
// default install dir. If none is found it exits 0 silently so editing is never blocked.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CPP_EXT = new Set(['.cpp', '.cc', '.cxx', '.h', '.hpp', '.hh', '.inl']);

function findClangFormat() {
  const tryExe = (exe) => {
    try { execFileSync(exe, ['--version'], { stdio: 'ignore', timeout: 5000 }); return exe; }
    catch (_) { return null; }
  };
  const onPath = tryExe('clang-format');
  if (onPath) return onPath;

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
  return null;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }
  const ti = input.tool_input || {};
  const target = String(ti.file_path || ti.path || '');
  if (!target) process.exit(0);

  const norm = target.replace(/\\/g, '/');
  if (!CPP_EXT.has(path.extname(norm).toLowerCase())) process.exit(0);
  if (/(^|\/)(reference_source|build|_deps|third_party)\//i.test(norm)) process.exit(0);
  if (!fs.existsSync(target)) process.exit(0);

  const exe = findClangFormat();
  if (!exe) process.exit(0); // tool missing -> silently skip

  try {
    execFileSync(exe, ['-i', '--style=file', '--fallback-style=LLVM', target],
      { stdio: ['ignore', 'ignore', 'pipe'], timeout: 15000 });
  } catch (err) {
    // Formatting problems must never block the edit; surface them as a note only.
    const msg = (err && err.stderr) ? String(err.stderr).trim() : String(err);
    process.stderr.write('[format-cpp] clang-format skipped: ' + msg.split('\n')[0] + '\n');
  }
  process.exit(0);
});
