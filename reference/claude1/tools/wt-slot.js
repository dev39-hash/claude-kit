#!/usr/bin/env node
// Reusable build-slot allocator for parallel agents.
//   node .claude/tools/wt-slot.js acquire <tag>   -> prints the slot directory (build-wt/slotN), locks it
//   node .claude/tools/wt-slot.js release <tag>   -> unlocks the slot held by <tag>
//   node .claude/tools/wt-slot.js status          -> lists slots and holders
//   node .claude/tools/wt-slot.js reclaim         -> removes stale locks (older than STALE_HOURS)
// Also a module: const { acquire, release } = require('./wt-slot.js')  (acquire returns the dir or null).
// Slots keep their CMake cache between uses, so a reconfigure is fast and disk usage stays
// bounded (SLOTS build trees instead of one per agent). A lock is the file slotN/.lock holding
// {tag, time}; it is created with an exclusive open (flag 'wx'), so two agents never get the same
// slot: the loser sees EEXIST and tries the next slot. A lock older than STALE_HOURS is considered
// abandoned and is taken over (renamed away first, then created again exclusively).
'use strict';

const fs = require('fs');
const path = require('path');

const SLOTS = 8;
const STALE_HOURS = 3;
const FRESH_MS = 5000; // a lock file that exists but is still empty/unreadable is being written
const root = path.join(process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..'), 'build-wt');

function slotDir(i) { return path.join(root, 'slot' + i); }
function lockPath(i) { return path.join(slotDir(i), '.lock'); }

function readLock(i) {
  try { return JSON.parse(fs.readFileSync(lockPath(i), 'utf8')); } catch (_) { return null; }
}

function lockAgeMs(i) {
  try { return Date.now() - fs.statSync(lockPath(i)).mtimeMs; } catch (_) { return Infinity; }
}

function isStale(lock, i) {
  if (!lock || !lock.time) return lockAgeMs(i) > FRESH_MS; // unreadable: stale unless just created
  return (Date.now() - new Date(lock.time).getTime()) > STALE_HOURS * 3600 * 1000;
}

function ensure(i) { fs.mkdirSync(slotDir(i), { recursive: true }); }

// create the lock exclusively; true if this call created it
function tryCreate(i, tag) {
  let fd;
  try {
    fd = fs.openSync(lockPath(i), 'wx');
  } catch (err) {
    if (err && err.code === 'EEXIST') return false;
    throw err;
  }
  try { fs.writeSync(fd, JSON.stringify({ tag, time: new Date().toISOString() })); } finally { fs.closeSync(fd); }
  return true;
}

// move a stale lock out of the way; true if it is gone afterwards
function takeOver(i, seen) {
  const now = readLock(i);
  if (seen && now && now.time !== seen.time) return false; // somebody refreshed it meanwhile
  try {
    fs.renameSync(lockPath(i), lockPath(i) + '.stale-' + process.pid);
    fs.unlinkSync(lockPath(i) + '.stale-' + process.pid);
    return true;
  } catch (err) {
    return !!(err && err.code === 'ENOENT'); // another process was faster; try to create anyway
  }
}

function acquire(tag) {
  if (!tag) throw new Error('usage: acquire <tag>');
  fs.mkdirSync(root, { recursive: true });
  // already held by this tag -> same slot
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    if (lock && lock.tag === tag) return slotDir(i);
  }
  for (let i = 0; i < SLOTS; i++) {
    ensure(i);
    if (tryCreate(i, tag)) return slotDir(i);
    const lock = readLock(i);
    if (isStale(lock, i) && takeOver(i, lock) && tryCreate(i, tag)) return slotDir(i);
  }
  return null;
}

function release(tag) {
  if (!tag) throw new Error('usage: release <tag>');
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    if (lock && lock.tag === tag) { fs.unlinkSync(lockPath(i)); return slotDir(i); }
  }
  return null;
}

function status() {
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    const state = !lock ? 'free' : (isStale(lock, i) ? 'STALE ' + lock.tag + ' ' + lock.time : 'busy ' + lock.tag + ' ' + lock.time);
    console.log('slot' + i + ': ' + state);
  }
}

function reclaim() {
  let n = 0;
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    if (lock && isStale(lock, i) && takeOver(i, lock)) n++;
  }
  console.log('reclaimed ' + n + ' stale lock(s)');
}

module.exports = { acquire, release, status, reclaim, SLOTS };

if (require.main === module) {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === 'acquire') {
      if (!arg) { console.error('usage: acquire <tag>'); process.exit(2); }
      const dir = acquire(arg);
      if (!dir) { console.error('[wt-slot] no free slot (' + SLOTS + ' in use); wait and retry, or run: status / reclaim'); process.exit(1); }
      console.log(dir);
    } else if (cmd === 'release') {
      if (!arg) { console.error('usage: release <tag>'); process.exit(2); }
      const dir = release(arg);
      console.log(dir ? 'released ' + dir : '[wt-slot] no slot held by ' + arg);
    } else if (cmd === 'status') status();
    else if (cmd === 'reclaim') reclaim();
    else { console.error('usage: wt-slot.js acquire <tag> | release <tag> | status | reclaim'); process.exit(2); }
  } catch (err) {
    console.error('[wt-slot] error: ' + (err && err.message ? err.message : err));
    process.exit(1);
  }
}
