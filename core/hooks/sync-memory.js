#!/usr/bin/env node
// Stop hook: mirror Claude's global memory dir for this project into paths.memoryMirror.
//   node .claude/hooks/sync-memory.js              global -> mirror  (default, runs at Stop)
//   node .claude/hooks/sync-memory.js --restore    mirror -> global  (fresh machine; never deletes)
//   node .claude/hooks/sync-memory.js --dry-run    report what would change, write nothing
//   node .claude/hooks/sync-memory.js --status     print both paths and the file lists
// The mirror is kept identical to the source (files absent in the source are removed from the
// mirror); a restore only copies, so an older mirror can never delete newer global memory.
// Safety: the source must contain MEMORY.md, otherwise nothing is copied or deleted.
// Never fails the hook: errors go to stderr, exit code 0. Does not read stdin.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('./lib/config');

// Claude names the per-project dir after the project path with every non-alphanumeric
// character replaced by '-' (C:\Work\x -> C--Work-x); the match is case-insensitive.
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
    return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.md') && fs.statSync(path.join(dir, f)).isFile());
  } catch (_) { return []; }
}

function mirror(src, dst, opts) {
  const o = opts || {};
  const files = listMd(src);
  const r = { copied: [], removed: [], skipped: false };
  if (!files.includes('MEMORY.md')) { r.skipped = true; return r; }
  if (!o.dry) fs.mkdirSync(dst, { recursive: true });
  for (const f of files) {
    const a = path.join(src, f), b = path.join(dst, f);
    const data = fs.readFileSync(a);
    let same = false;
    try { same = fs.readFileSync(b).equals(data); } catch (_) { same = false; }
    if (!same) { if (!o.dry) fs.writeFileSync(b, data); r.copied.push(f); }
  }
  if (!o.restore) {
    for (const f of listMd(dst)) {
      if (f.toLowerCase() === 'readme.md') continue; // a mirror may carry its own README
      if (!files.includes(f)) { if (!o.dry) fs.unlinkSync(path.join(dst, f)); r.removed.push(f); }
    }
  }
  return r;
}

function main(argv) {
  const restore = argv.includes('--restore');
  const dry = argv.includes('--dry-run');
  const status = argv.includes('--status');
  const { cfg, root } = config.load(null);
  const backup = path.resolve(root, cfg.paths.memoryMirror || '.claude/memory');
  const global = globalMemoryDir(root, restore);
  const log = (m) => process.stderr.write('[sync-memory] ' + m + '\n');
  if (!global) { log('global memory dir not found for ' + root + ' (set CLAUDE_MEMORY_DIR to override)'); return 0; }
  if (status) {
    log('global: ' + global + ' [' + listMd(global).join(', ') + ']');
    log('mirror: ' + backup + ' [' + listMd(backup).join(', ') + ']');
    return 0;
  }
  const [src, dst] = restore ? [backup, global] : [global, backup];
  const r = mirror(src, dst, { dry, restore });
  if (r.skipped) { log('source has no MEMORY.md, nothing done: ' + src); return 0; }
  if (restore || dry || r.copied.length || r.removed.length) {
    log((dry ? 'would ' : '') + (restore ? 'restore' : 'mirror') + ' ' + src + ' -> ' + dst +
      ' (copy ' + r.copied.length + (r.copied.length ? ': ' + r.copied.join(', ') : '') +
      '; remove ' + r.removed.length + (r.removed.length ? ': ' + r.removed.join(', ') : '') + ')');
  }
  return 0;
}

module.exports = { mirror, globalMemoryDir };

if (require.main === module) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (err) {
    process.stderr.write('[sync-memory] error: ' + (err && err.message ? err.message : err) + '\n');
    process.exitCode = 0;
  }
}
