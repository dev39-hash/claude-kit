#!/usr/bin/env node
// PostToolUse hook, matcher: Edit|Write|MultiEdit.
// Formats the edited file with the project's formatter, ONLY when the repository carries a
// formatter config (build.formatOnEdit = "if-config-present"); the kit never formats with a
// default or fallback style, because "keep the style of the file you edit" is the rule otherwise.
//
// Formatters known today: clang-format for C/C++ (.clang-format at the project root). The
// executable comes from build.toolchain.clangFormatExe, then PATH, then Visual Studio's bundled
// LLVM, then LLVM's install dir. Skips files outside the project, under build.buildDirPatterns,
// .claude/ and encoding.asciiExempt paths.
// Always exits 0; problems are a one-line stderr note. Never blocks an edit.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { readStdin, parseInput, say } = require('./lib/io');
const config = require('./lib/config');
const P = require('./lib/paths');

const FORMATTERS = [
  {
    name: 'clang-format',
    exts: new Set(['.cpp', '.cc', '.cxx', '.h', '.hpp', '.hh', '.inl', '.ipp', '.c']),
    configFiles: ['.clang-format', '_clang-format'],
    find: findClangFormat,
    args: (abs) => ['-i', '--style=file', '--fallback-style=none', abs],
  },
];

function tryExe(exe) {
  try { execFileSync(exe, ['--version'], { stdio: 'ignore', timeout: 5000 }); return exe; } catch (_) { return null; }
}

function findClangFormat(cfg) {
  const tc = (cfg.build && cfg.build.toolchain) || {};
  if (tc.clangFormatExe && fs.existsSync(tc.clangFormatExe)) return tc.clangFormatExe;
  const onPath = tryExe('clang-format');
  if (onPath) return onPath;
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const candidates = [];
  const vsRoot = tc.vsRoot;
  if (vsRoot) candidates.push(path.join(vsRoot, 'VC', 'Tools', 'Llvm', 'x64', 'bin', 'clang-format.exe'));
  for (const root of [pf, pf86]) {
    for (const ver of ['18', '2022', '2019']) {
      for (const ed of ['Community', 'Professional', 'Enterprise', 'BuildTools']) {
        candidates.push(path.join(root, 'Microsoft Visual Studio', ver, ed, 'VC', 'Tools', 'Llvm', 'x64', 'bin', 'clang-format.exe'));
      }
    }
  }
  candidates.push(path.join(pf, 'LLVM', 'bin', 'clang-format.exe'));
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function main(input) {
  const ti = input.tool_input || {};
  const target = String(ti.file_path || ti.path || '');
  if (!target) return;
  const { cfg, root: rootFs } = config.load(input);
  if ((cfg.build && cfg.build.formatOnEdit) === 'never') return;
  const root = P.norm(rootFs);
  const cwd = P.norm(input.cwd || rootFs);
  const abs = P.isAbsolute(target) ? P.norm(target) : P.norm(cwd + '/' + target);
  const rel = P.rel(abs, root);
  if (rel === null || rel === '' || rel.startsWith('.claude/')) return;
  if (P.matchAny(abs, root, cfg.build.buildDirPatterns)) return;
  if (P.matchAny(abs, root, cfg.encoding.asciiExempt)) return;
  const ext = P.extOf(abs);
  const fmt = FORMATTERS.find((f) => f.exts.has(ext));
  if (!fmt) return;
  if (!fmt.configFiles.some((c) => fs.existsSync(path.join(rootFs, c)))) return; // no config: never format
  const real = path.join(rootFs, rel);
  if (!fs.existsSync(real)) return;
  const exe = fmt.find(cfg);
  if (!exe) { say('[format] ' + fmt.name + ' not found; skipped ' + rel); return; }
  try {
    execFileSync(exe, fmt.args(real), { cwd: rootFs, stdio: ['ignore', 'ignore', 'pipe'], timeout: 15000 });
  } catch (err) {
    const msg = (err && err.stderr) ? String(err.stderr).trim() : String(err);
    say('[format] ' + fmt.name + ' skipped: ' + msg.split('\n')[0]);
  }
}

module.exports = { main };

if (require.main === module) {
  readStdin((raw) => {
    try { const input = parseInput(raw); if (input) main(input); } catch (err) {
      say('[format] internal error (ignored): ' + (err && err.message ? err.message : err));
    }
    process.exit(0);
  });
}
