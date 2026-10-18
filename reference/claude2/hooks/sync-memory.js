#!/usr/bin/env node
// Stop hook: mirror the PM agent's memory into .claude/pm-agent-memory/ after every turn.
//   node .claude/hooks/sync-memory.js            memory -> .claude/pm-agent-memory   (default, runs at Stop)
//   node .claude/hooks/sync-memory.js --restore  .claude/pm-agent-memory -> memory   (new profile or machine)
// The memory lives at ~/.claude/projects/<project-dir-slug>/memory/. Only *.md files are mirrored.
// The mirror's own README.md is never copied, overwritten or deleted. Safety: the source must hold
// MEMORY.md, otherwise nothing is copied or deleted. Never fails the hook: errors go to stderr, exit 0.
// Adapted from the image_matching project's sync-memory hook.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const KEEP = 'readme.md';

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
}

function memoryDir(root) {
  if (process.env.CLAUDE_MEMORY_DIR) return process.env.CLAUDE_MEMORY_DIR;
  const projects = path.join(os.homedir(), '.claude', 'projects');
  const wanted = path.resolve(root).replace(/[^A-Za-z0-9]/g, '-').toLowerCase();
  let names = [];
  try { names = fs.readdirSync(projects); } catch (_) { return null; }
  const hit = names.find((n) => n.toLowerCase() === wanted);
  return hit ? path.join(projects, hit, 'memory') : null;
}

function listMd(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.md') &&
      f.toLowerCase() !== KEEP && fs.statSync(path.join(dir, f)).isFile());
  } catch (_) { return []; }
}

function mirror(src, dst) {
  const files = listMd(src);
  if (!files.includes('MEMORY.md')) {
    process.stderr.write('[sync-memory] source has no MEMORY.md, nothing done: ' + src + '\n');
    return { copied: 0, removed: 0 };
  }
  fs.mkdirSync(dst, { recursive: true });
  let copied = 0;
  let removed = 0;
  for (const f of files) {
    const a = path.join(src, f);
    const b = path.join(dst, f);
    const data = fs.readFileSync(a);
    if (!fs.existsSync(b) || !fs.readFileSync(b).equals(data)) { fs.writeFileSync(b, data); copied++; }
  }
  for (const f of listMd(dst)) {
    if (!files.includes(f)) { fs.unlinkSync(path.join(dst, f)); removed++; }
  }
  return { copied, removed };
}

function main() {
  // The hook JSON on stdin is not needed and is deliberately left unread, so an open stdin can
  // never keep the process alive.
  const restore = process.argv.includes('--restore');
  const root = projectRoot();
  const backup = path.join(root, '.claude', 'pm-agent-memory');
  const memory = memoryDir(root);
  if (!memory) {
    process.stderr.write('[sync-memory] memory folder not found for ' + root + '\n');
    return;
  }
  const [src, dst] = restore ? [backup, memory] : [memory, backup];
  const r = mirror(src, dst);
  if (restore || r.copied || r.removed) {
    process.stderr.write('[sync-memory] ' + (restore ? 'restored' : 'mirrored') + ' ' + src + ' -> ' + dst +
      ' (copied ' + r.copied + ', removed ' + r.removed + ')\n');
  }
}

try { main(); } catch (err) {
  process.stderr.write('[sync-memory] error: ' + (err && err.message ? err.message : err) + '\n');
}
process.exitCode = 0;
