#!/usr/bin/env node
// PreToolUse hook, matcher: Edit|Write|MultiEdit.
// The repo tree holds user documentation only: instruction files for tools do not belong in it.
// Blocks creating or editing a file named CLAUDE.md, AGENTS.md or AGENT.md (any case) anywhere in
// the project folder, except under .claude/ (where .claude/CLAUDE.md is the one legitimate home).
// Files outside the project folder are not this hook's business.
//
// Exit codes: 0 = allow (also on any internal error), 2 = block (reason on stderr).
'use strict';

const fs = require('fs');
const path = require('path');

const FORBIDDEN_NAMES = new Set(['claude.md', 'agents.md', 'agent.md']);

function norm(p) {
  let s = String(p).replace(/\\/g, '/');
  const m = s.match(/^\/([a-zA-Z])(\/(.*))?$/); // Git Bash: /c/foo -> c:/foo
  if (m) s = m[1] + ':/' + (m[3] || '');
  s = s.toLowerCase();
  const drive = s.match(/^([a-z]:)(.*)$/);
  const rest = path.posix.normalize(drive ? drive[2] || '/' : s);
  return ((drive ? drive[1] : '') + rest).replace(/\/+$/, '');
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

  const root = norm(process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..'));
  const cwd = norm(input.cwd || root);
  const t = target.replace(/\\/g, '/');
  const abs = /^([a-zA-Z]:\/|\/)/.test(t) ? norm(t) : norm(cwd + '/' + t);

  if (!FORBIDDEN_NAMES.has(path.posix.basename(abs))) return 0;
  if (!(abs === root || abs.startsWith(root + '/'))) return 0; // outside the project
  if (abs.startsWith(root + '/.claude/')) return 0; // the one legitimate home
  say('[protect-tree] Blocked: ' + target + '\n' +
    'CLAUDE.md, AGENTS.md and AGENT.md must not exist in the repo tree (it holds user documentation only).\n' +
    'Put instructions in .claude/CLAUDE.md or .claude/rules/, plans and notes in .claude/docs/.\n');
  return 2;
}

readStdin((raw) => {
  let code = 0;
  try { code = main(raw); } catch (err) {
    say('[protect-tree] internal error (allowing): ' + (err && err.message ? err.message : err) + '\n');
    code = 0;
  }
  process.exit(code);
});
