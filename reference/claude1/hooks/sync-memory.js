#!/usr/bin/env node
// Stop hook: mirror Claude's global memory dir for this project into .claude/memory/ (backup).
//   node .claude/hooks/sync-memory.js            global  -> .claude/memory  (default, runs at Stop)
//   node .claude/hooks/sync-memory.js --restore  .claude/memory -> global  (fresh machine)
// Safety: the source must contain MEMORY.md, otherwise nothing is copied or deleted.
// Never fails the hook: all errors are reported on stderr and the exit code is 0.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
}

// Claude names the per-project dir after the project path with every non-alphanumeric char -> '-'
// (drive C, folder DGB/Project/controller-kernel -> C--DGB-Project-controller-kernel). For a restore the dir
// may not exist yet on a fresh machine: its path is then computed (and created by mirror()).
function globalMemoryDir(root, create) {
  if (process.env.CLAUDE_MEMORY_DIR) return process.env.CLAUDE_MEMORY_DIR;
  const projects = path.join(os.homedir(), '.claude', 'projects');
  const resolved = path.resolve(root).replace(/^[a-z]:/, (d) => d.toUpperCase());
  const exact = resolved.replace(/[^A-Za-z0-9]/g, '-');
  const wanted = exact.toLowerCase();
  let names = [];
  try { names = fs.readdirSync(projects); } catch (_) { return create ? path.join(projects, exact, 'memory') : null; }
  const hit = names.find((n) => n.toLowerCase() === wanted);
  if (hit) return path.join(projects, hit, 'memory');
  return create ? path.join(projects, exact, 'memory') : null;
}

function listMd(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.md') &&
      fs.statSync(path.join(dir, f)).isFile());
  } catch (_) { return []; }
}

function mirror(src, dst) {
  const files = listMd(src);
  if (!files.includes('MEMORY.md')) {
    process.stderr.write('[sync-memory] source has no MEMORY.md, nothing done: ' + src + '\n');
    return { copied: 0, removed: 0 };
  }
  fs.mkdirSync(dst, { recursive: true });
  let copied = 0, removed = 0;
  for (const f of files) {
    const a = path.join(src, f), b = path.join(dst, f);
    const data = fs.readFileSync(a);
    if (!fs.existsSync(b) || !fs.readFileSync(b).equals(data)) { fs.writeFileSync(b, data); copied++; }
  }
  for (const f of listMd(dst)) {
    if (!files.includes(f)) { fs.unlinkSync(path.join(dst, f)); removed++; }
  }
  return { copied, removed };
}

function main() {
  // The hook JSON on stdin is not needed; it is deliberately left unread so an open stdin
  // can never keep the process alive (a drain handler did exactly that when run from a shell).
  const restore = process.argv.includes('--restore');
  const root = projectRoot();
  const backup = path.join(root, '.claude', 'memory');
  const global = globalMemoryDir(root, restore);
  if (!global) {
    process.stderr.write('[sync-memory] global memory dir not found for ' + root + '\n');
    return 0;
  }
  const [src, dst] = restore ? [backup, global] : [global, backup];
  const r = mirror(src, dst);
  if (restore || r.copied || r.removed) {
    process.stderr.write('[sync-memory] ' + (restore ? 'restored' : 'mirrored') + ' ' +
      src + ' -> ' + dst + ' (copied ' + r.copied + ', removed ' + r.removed + ')\n');
  }
  return 0;
}

try { process.exitCode = main(); } catch (err) {
  process.stderr.write('[sync-memory] error: ' + (err && err.message ? err.message : err) + '\n');
  process.exitCode = 0;
}
