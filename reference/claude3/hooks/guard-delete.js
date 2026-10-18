#!/usr/bin/env node
// PreToolUse hook (Bash|PowerShell): guard file-deleting commands.
// Rule (project.md, "File deletion policy"):
//   - inside the project folder: deletions are allowed, EXCEPT anything under reference_source/
//   - outside the project folder: blocked, EXCEPT Claude's own temp/scratchpad files
// Exit 2 = block (stderr shown to Claude). Exit 0 = allow. Never throws.
'use strict';

const os = require('os');
const path = require('path');

const DELETE_PATTERNS = [
  /(^|[\s;&|(])rm\s+(-[A-Za-z]*\s+)*\S/,
  /(^|[\s;&|(])rmdir\s+\S/,
  /(^|[\s;&|(])unlink\s+\S/,
  /(^|[\s;&|(])del\s+\S/i,
  /(^|[\s;&|(])erase\s+\S/i,
  /(^|[\s;&|(])rd\s+\S/i,
  /Remove-Item\b/i,
  /\bri\s+-/i, /\brm\s+-Recurse/i, /\bdel\s+-/i,
  /\[System\.IO\.(File|Directory)\]::Delete/i,
  /(^|[\s;&|(])git\s+rm\b/,
  /(^|[\s;&|(])git\s+clean\b/,
  /(^|[\s;&|(])find\b[^\n]*\s-delete\b/,
  /(^|[\s;&|(])find\b[^\n]*-exec\s+rm\b/,
  /(^|[\s;&|(])shred\s+\S/,
  /(^|[\s;&|(])truncate\s+-s\s*0\b/,
];

function norm(p) {
  let s = String(p).replace(/\\/g, '/');
  // Git Bash style /c/foo -> c:/foo
  const m = s.match(/^\/([a-zA-Z])\/(.*)$/);
  if (m) s = m[1] + ':/' + m[2];
  return s.toLowerCase().replace(/\/+$/, '');
}

function projectRoot() {
  return norm(process.env.CLAUDE_PROJECT_DIR || process.cwd());
}

function tempRoots() {
  const roots = [];
  const push = (p) => { if (p) roots.push(norm(p)); };
  push(process.env.CLAUDE_SCRATCHPAD_DIR);
  push(process.env.TMP); push(process.env.TEMP); push(process.env.TMPDIR);
  push(os.tmpdir());
  push(path.join(os.homedir(), 'AppData', 'Local', 'Temp', 'claude'));
  roots.push('/tmp');
  return roots;
}

function under(p, root) { return p === root || p.startsWith(root + '/'); }

function isAbsolute(t) { return /^([a-zA-Z]:[\\/]|\\\\|\/)/.test(t); }

// Returns { ok: true } or { ok: false, why }
function check(cmd) {
  const root = projectRoot();
  const temps = tempRoots();
  const tokens = cmd.match(/"[^"]+"|'[^']+'|[^\s;&|()]+/g) || [];

  // reference_source/ is protected whatever form the path takes (bare name, relative, absolute).
  if (/(^|[\s"'\/\\=])reference_source([\s"'\/\\]|$)/i.test(cmd)) {
    return { ok: false, why: 'targets reference_source/ (read-only reference and fixtures)' };
  }

  // A `cd` to somewhere outside the project in the same command makes relative paths unsafe.
  const cdMatches = cmd.match(/(^|[\s;&|(])(cd|Set-Location|pushd)\s+("[^"]+"|'[^']+'|\S+)/gi) || [];
  for (const c of cdMatches) {
    const target = norm(c.replace(/^.*?(cd|Set-Location|pushd)\s+/i, '').replace(/^["']|["']$/g, ''));
    if (isAbsolute(target) && !under(target, root) && !temps.some((r) => under(target, r))) {
      return { ok: false, why: 'changes directory outside the project before deleting: ' + target };
    }
  }

  for (let t of tokens) {
    t = t.replace(/^["']|["']$/g, '');
    if (/^-/.test(t)) continue;
    if (!/[\\/]/.test(t) && !/\.[A-Za-z0-9]+$/.test(t)) continue; // not path-like
    if (/^(rm|rmdir|del|erase|rd|unlink|git|find|shred|truncate|cd|pushd|node|python)$/i.test(t)) continue;
    const n = norm(t);
    const abs = isAbsolute(t) ? n : (root + '/' + n.replace(/^\.\//, ''));
    if (/(^|\/)reference_source(\/|$)/.test(abs)) {
      return { ok: false, why: 'targets reference_source/ (read-only reference and fixtures): ' + t };
    }
    if (under(abs, root)) continue;
    if (temps.some((r) => under(abs, r)) || /\/temp\/claude\//.test(abs) || /\/scratchpad(\/|$)/.test(abs)) continue;
    return { ok: false, why: 'targets a path outside the project folder: ' + t };
  }
  return { ok: true };
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }
  const cmd = String((input.tool_input && input.tool_input.command) || '');
  if (!cmd) process.exit(0);
  if (!DELETE_PATTERNS.some((re) => re.test(cmd))) process.exit(0);
  const r = check(cmd);
  if (r.ok) process.exit(0);
  process.stderr.write(
    '[guard-delete] Blocked: this delete command ' + r.why + '\n  ' + cmd.split('\n')[0] +
    '\nProject rule: deleting is allowed only inside the project folder (never reference_source/) ' +
    'or for Claude\'s own temp files. Anything else needs the user\'s explicit permission.\n');
  process.exit(2);
});
