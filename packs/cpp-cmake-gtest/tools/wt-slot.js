#!/usr/bin/env node
// Reusable build-slot allocator for parallel agents (pack cpp-cmake-gtest).
//   node .claude/tools/cpp-cmake-gtest/wt-slot.js acquire <tag>   -> prints the slot dir, locks it
//   node .claude/tools/cpp-cmake-gtest/wt-slot.js release <tag>   -> unlocks the slot held by <tag>
//   node .claude/tools/cpp-cmake-gtest/wt-slot.js touch <tag>     -> refreshes the lock time of a long task
//   node .claude/tools/cpp-cmake-gtest/wt-slot.js status          -> lists slots and holders
//   node .claude/tools/cpp-cmake-gtest/wt-slot.js reclaim         -> removes stale locks
// Also a module: const { acquire, release } = require('./wt-slot.js')  (acquire returns the dir or null).
//
// Slot directory, count and stale age come from kit.config.json `build.slots`
// ({ dir: "build-wt", count: 8, staleHours: 3 }). Slots keep their CMake cache between uses, so
// a reconfigure is fast and disk usage stays bounded. A lock is slotN/.lock holding {tag, time},
// created with an exclusive open ('wx'), so two agents never get the same slot. A lock older
// than staleHours is considered abandoned and is taken over. Long tasks call `touch`.
// Adapted from the controller-kernel wt-slot.js (project-written, 2026).
'use strict';

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./kit-env');

const { cfg, root: PROJECT } = loadConfig();
const SLOTS = (cfg.build.slots && cfg.build.slots.count) || 8;
const STALE_HOURS = (cfg.build.slots && cfg.build.slots.staleHours) || 3;
const FRESH_MS = 5000;
const root = path.resolve(PROJECT, (cfg.build.slots && cfg.build.slots.dir) || 'build-wt');

function slotDir(i) { return path.join(root, 'slot' + i); }
function lockPath(i) { return path.join(slotDir(i), '.lock'); }
function readLock(i) { try { return JSON.parse(fs.readFileSync(lockPath(i), 'utf8')); } catch (_) { return null; } }
function lockAgeMs(i) { try { return Date.now() - fs.statSync(lockPath(i)).mtimeMs; } catch (_) { return Infinity; } }
function isStale(lock, i) {
  if (!lock || !lock.time) return lockAgeMs(i) > FRESH_MS;
  return (Date.now() - new Date(lock.time).getTime()) > STALE_HOURS * 3600 * 1000;
}
function ensure(i) { fs.mkdirSync(slotDir(i), { recursive: true }); }

function tryCreate(i, tag) {
  let fd;
  try { fd = fs.openSync(lockPath(i), 'wx'); } catch (err) { if (err && err.code === 'EEXIST') return false; throw err; }
  try { fs.writeSync(fd, JSON.stringify({ tag, time: new Date().toISOString() })); } finally { fs.closeSync(fd); }
  return true;
}

function takeOver(i, seen) {
  const now = readLock(i);
  if (seen && now && now.time !== seen.time) return false;
  try {
    fs.renameSync(lockPath(i), lockPath(i) + '.stale-' + process.pid);
    fs.unlinkSync(lockPath(i) + '.stale-' + process.pid);
    return true;
  } catch (err) { return !!(err && err.code === 'ENOENT'); }
}

function acquire(tag) {
  if (!tag) throw new Error('usage: acquire <tag>');
  fs.mkdirSync(root, { recursive: true });
  for (let i = 0; i < SLOTS; i++) { const lock = readLock(i); if (lock && lock.tag === tag) return slotDir(i); }
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
  for (let i = 0; i < SLOTS; i++) { const lock = readLock(i); if (lock && lock.tag === tag) { fs.unlinkSync(lockPath(i)); return slotDir(i); } }
  return null;
}

function touch(tag) {
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    if (lock && lock.tag === tag) { fs.writeFileSync(lockPath(i), JSON.stringify({ tag, time: new Date().toISOString() })); return slotDir(i); }
  }
  return null;
}

function status() {
  for (let i = 0; i < SLOTS; i++) {
    const lock = readLock(i);
    const state = !lock ? 'free' : (isStale(lock, i) ? 'STALE ' + lock.tag + ' ' + lock.time : 'busy ' + lock.tag + ' ' + lock.time);
    console.log('slot' + i + ': ' + state + '  (' + path.relative(PROJECT, slotDir(i)).replace(/\\/g, '/') + ')');
  }
}

function reclaim() {
  let n = 0;
  for (let i = 0; i < SLOTS; i++) { const lock = readLock(i); if (lock && isStale(lock, i) && takeOver(i, lock)) n++; }
  console.log('reclaimed ' + n + ' stale lock(s)');
}

module.exports = { acquire, release, touch, status, reclaim, SLOTS };

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
    } else if (cmd === 'touch') {
      const dir = touch(arg);
      console.log(dir ? 'touched ' + dir : '[wt-slot] no slot held by ' + arg);
    } else if (cmd === 'status') status();
    else if (cmd === 'reclaim') reclaim();
    else { console.error('usage: wt-slot.js acquire <tag> | release <tag> | touch <tag> | status | reclaim'); process.exit(2); }
  } catch (err) {
    console.error('[wt-slot] error: ' + (err && err.message ? err.message : err));
    process.exit(1);
  }
}
