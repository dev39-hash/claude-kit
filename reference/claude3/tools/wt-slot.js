#!/usr/bin/env node
// Reusable build-slot allocator for parallel agents.
//   node .claude/tools/wt-slot.js acquire <tag>   -> prints the slot directory (build-wt/slotN), locks it
//   node .claude/tools/wt-slot.js release <tag>   -> unlocks the slot held by <tag>
//   node .claude/tools/wt-slot.js status          -> lists slots and holders
//   node .claude/tools/wt-slot.js reclaim         -> removes stale locks (older than STALE_HOURS)
// Slots keep their CMake cache between uses, so a reconfigure is fast and disk usage stays
// bounded (SLOTS build trees instead of one per agent). Locks are files slotN/.lock holding
// {tag, time}. A lock older than STALE_HOURS is considered abandoned and may be reclaimed.
'use strict';

const fs = require('fs');
const path = require('path');

const SLOTS = 8;
const STALE_HOURS = 3;
const root = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), 'build-wt');

function slotDir(i) { return path.join(root, 'slot' + i); }
function lockPath(i) { return path.join(slotDir(i), '.lock'); }

function readLock(i) {
  try { return JSON.parse(fs.readFileSync(lockPath(i), 'utf8')); } catch (_) { return null; }
}

function isStale(lock) {
  if (!lock || !lock.time) return true;
  return (Date.now() - new Date(lock.time).getTime()) > STALE_HOURS * 3600 * 1000;
}

function ensure(i) { fs.mkdirSync(slotDir(i), { recursive: true }); }

function acquire(tag) {
  if (!tag) { console.error('usage: acquire <tag>'); process.exit(2); }
  fs.mkdirSync(root, { recursive: true });
  // already held by this tag -> same slot
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    if (lock && lock.tag === tag) { console.log(slotDir(i)); return; }
  }
  for (let i = 0; i < SLOTS; i++) {
    ensure(i);
    const lock = readLock(i);
    if (!lock || isStale(lock)) {
      fs.writeFileSync(lockPath(i), JSON.stringify({ tag, time: new Date().toISOString() }));
      console.log(slotDir(i));
      return;
    }
  }
  console.error('[wt-slot] no free slot (' + SLOTS + ' in use); wait and retry, or run: status / reclaim');
  process.exit(1);
}

function release(tag) {
  if (!tag) { console.error('usage: release <tag>'); process.exit(2); }
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    if (lock && lock.tag === tag) { fs.unlinkSync(lockPath(i)); console.log('released ' + slotDir(i)); return; }
  }
  console.log('[wt-slot] no slot held by ' + tag);
}

function status() {
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    const state = !lock ? 'free' : (isStale(lock) ? 'STALE ' + lock.tag + ' ' + lock.time : 'busy ' + lock.tag + ' ' + lock.time);
    console.log('slot' + i + ': ' + state);
  }
}

function reclaim() {
  let n = 0;
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    if (lock && isStale(lock)) { fs.unlinkSync(lockPath(i)); n++; }
  }
  console.log('reclaimed ' + n + ' stale lock(s)');
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'acquire') acquire(arg);
else if (cmd === 'release') release(arg);
else if (cmd === 'status') status();
else if (cmd === 'reclaim') reclaim();
else { console.error('usage: wt-slot.js acquire <tag> | release <tag> | status | reclaim'); process.exit(2); }
