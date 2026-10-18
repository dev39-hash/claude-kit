#!/usr/bin/env node
// PostToolUse hook, matcher: Edit|Write|MultiEdit.
// Runs the shared gate engine (../tools/gate-check.js) on the file that was just edited
// (tool_input.file_path, also for MultiEdit): ASCII, L2 purity/include, L4 timer, L10 blocking
// (errors), L5 call-outs, DOCS policy, WARN-PRAGMA (errors) and L9 literals (warnings).
//
// Skips files outside the project folder and files under .claude/ or build*/ .
// On any error finding: prints each one to stderr with the law name and a one-line fix hint and
// exits 2 (the text is fed back to Claude). Warnings alone exit 0 and are handed to Claude as
// non-blocking context: {"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":...}}.
//
// Exit codes: 0 = clean / warnings only / internal error (never blocks on its own failure),
//             2 = at least one gate error.
'use strict';

const fs = require('fs');
const path = require('path');

function slash(p) {
  let s = String(p).replace(/\\/g, '/');
  const m = s.match(/^\/([a-zA-Z])\/(.*)$/); // Git Bash path /c/x -> c:/x
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

function say(msg) { try { fs.writeSync(2, msg); } catch (_) { /* ignore */ } }

function main(raw) {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch (_) { return 0; }
  const ti = input.tool_input || {};
  const target = String(ti.file_path || ti.path || '');
  if (!target) return 0;

  const root = path.resolve(slash(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()));
  const abs = path.resolve(root, slash(target));
  const rel = path.relative(root, abs).replace(/\\/g, '/');
  if (rel.startsWith('..') || path.isAbsolute(rel)) return 0; // outside the project
  if (/^(\.claude|build[^/]*)(\/|$)/i.test(rel)) return 0;
  if (!fs.existsSync(abs)) return 0;

  const gate = require('../tools/gate-check.js');
  const findings = gate.checkFile(abs, { root });
  if (findings.length === 0) return 0;

  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity !== 'error');
  const lines = [];
  for (const f of errors) {
    lines.push(f.file + ':' + f.line + ':' + f.col + ' [' + f.gate + '] ' + f.message +
      '\n    law: ' + f.law + '\n    fix: ' + f.hint);
  }
  for (const f of warnings) {
    lines.push(f.file + ':' + f.line + ':' + f.col + ' [' + f.gate + '] warning: ' + f.message +
      '\n    law: ' + f.law + '\n    fix: ' + f.hint);
  }
  const text = '[kernel-gates] ' + errors.length + ' error(s), ' + warnings.length + ' warning(s) in ' + rel + '\n' +
    lines.join('\n') + '\n';
  if (errors.length > 0) { say(text); return 2; }
  // warnings only: non-blocking context for Claude on stdout
  try {
    fs.writeSync(1, JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } }) + '\n');
  } catch (_) { /* ignore */ }
  return 0;
}

readStdin((raw) => {
  let code = 0;
  try { code = main(raw); } catch (err) {
    say('[kernel-gates] internal error (ignored): ' + (err && err.message ? err.message : err) + '\n');
    code = 0;
  }
  process.exit(code);
});
