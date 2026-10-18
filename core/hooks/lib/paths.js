'use strict';
// Path helpers shared by the guards: normalisation (Windows, Git Bash, case), containment,
// glob matching, config pattern matching, temp roots and static target resolution.
//
// Config patterns (paths.readOnly, askBeforeEdit, localOnly, protectedDelete, asciiExempt,
// buildDirPatterns) are relative to the project root unless absolute:
//   "dir/"        the directory and everything below it
//   "a/b.txt"     exactly that path (a file, or a directory without its children)
//   "*.ts"        glob; a pattern without "/" matches the basename or the first path segment
//   "docs/*.md"   glob with "/" matches the whole relative path

const os = require('os');
const path = require('path');

function norm(p) {
  let s = String(p).trim().replace(/^["']|["']$/g, '').replace(/\\/g, '/');
  const m = s.match(/^\/([a-zA-Z])(\/(.*))?$/); // Git Bash: /c/foo -> c:/foo
  if (m) s = m[1] + ':/' + (m[3] || '');
  s = s.toLowerCase();
  const drive = s.match(/^([a-z]:)(.*)$/);
  const rest = path.posix.normalize(drive ? drive[2] || '/' : s || '/');
  return ((drive ? drive[1] : '') + rest).replace(/\/+$/, '') || (drive ? drive[1] : '/');
}

function isAbsolute(t) { return /^([a-zA-Z]:[\\/]|\\\\|\/)/.test(String(t)); }
function under(p, root) { return p === root || p.startsWith(root + '/'); }
function rel(abs, root) { return abs === root ? '' : under(abs, root) ? abs.slice(root.length + 1) : null; }
function basename(p) { return String(p).replace(/\\/g, '/').split('/').pop(); }

function globToRe(pattern, opts) {
  const o = opts || {};
  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    const segStart = i === 0 || pattern[i - 1] === '/';
    const noDot = segStart && o.hideDot ? '(?!\\.)' : '';
    if (c === '*') {
      if (pattern[i + 1] === '*') { re += '.*'; i++; } else re += noDot + '[^/]*';
    } else if (c === '?') {
      re += noDot + '[^/]';
    } else if (c === '[') {
      const j = pattern.indexOf(']', i + 2);
      if (j < 0) re += '\\[';
      else { re += pattern.slice(i, j + 1); i = j; }
    } else {
      re += c.replace(/[.+^${}()|\\\]]/g, '\\$&');
    }
  }
  try { return new RegExp(re + '$', 'i'); } catch (_) { return /^$/; }
}

// Does the absolute (normalised) path match one config pattern? Returns the pattern or null.
function matchPattern(abs, root, pattern) {
  let pat = String(pattern).trim().replace(/\\/g, '/');
  if (!pat) return null;
  const dirOnly = pat.endsWith('/');
  pat = pat.replace(/\/+$/, '');
  const hasGlob = /[*?[]/.test(pat);
  if (isAbsolute(pat)) {
    const a = norm(pat);
    if (hasGlob) return globToRe(a).test(abs) ? pattern : null;
    return under(abs, a) ? pattern : null;
  }
  const r = rel(abs, root);
  if (r === null) return null;
  const patLower = pat.toLowerCase();
  if (hasGlob) {
    if (!pat.includes('/')) {
      const re = globToRe(patLower);
      if (re.test(basename(r))) return pattern;
      if (re.test(r.split('/')[0] || '')) return pattern; // first segment, e.g. build-*
      return null;
    }
    return globToRe(patLower).test(r) ? pattern : null;
  }
  if (r === '') return null;
  if (dirOnly) return under(r, patLower) ? pattern : null;
  return r === patLower ? pattern : null;
}

function matchAny(abs, root, patterns) {
  for (const p of patterns || []) {
    const hit = matchPattern(abs, root, p);
    if (hit) return hit;
  }
  return null;
}

// Claude's own temp locations where deleting is always fine.
function tempRoots(cfg) {
  const roots = [];
  const push = (p) => { if (p) roots.push(norm(p)); };
  push(process.env.CLAUDE_SCRATCHPAD_DIR);
  for (const v of [process.env.TMP, process.env.TEMP, process.env.TMPDIR, os.tmpdir()]) {
    if (v) push(path.join(v, 'claude'));
  }
  push(path.join(os.homedir(), 'AppData', 'Local', 'Temp', 'claude'));
  for (const t of (cfg && cfg.paths && cfg.paths.tempRoots) || []) push(t);
  return roots;
}

function inTemp(abs, temps) { return temps.some((r) => under(abs, r)); }

function expandVars(t) {
  return String(t).replace(
    /\$\{?(CLAUDE_SCRATCHPAD_DIR|CLAUDE_PROJECT_DIR)\}?|\$env:(CLAUDE_SCRATCHPAD_DIR|CLAUDE_PROJECT_DIR)|%(CLAUDE_SCRATCHPAD_DIR|CLAUDE_PROJECT_DIR)%/gi,
    (all, a, b, c) => process.env[(a || b || c).toUpperCase()] || all);
}

// Resolve one command-line target -> { abs, glob, relative } or { err }.
function resolveTarget(t0, cur) {
  const t = expandVars(t0);
  if (!t) return { err: 'has an empty target' };
  if (/^~/.test(t) || /[$`]/.test(t) || /%[A-Za-z_][\w()]*%/.test(t)) {
    return { err: 'targets a path that cannot be resolved statically: ' + t0 };
  }
  if (/^[A-Za-z]:(?![\\/])/.test(t)) return { err: 'uses a drive-relative path: ' + t0 };
  const glob = /[*?[]/.test(t);
  if (isAbsolute(t)) return { abs: norm(t), glob, relative: false };
  if (cur === null || cur === undefined) {
    return { err: 'has a relative target (' + t0 + ') but the working directory is not known' };
  }
  return { abs: norm(cur + '/' + t), glob, relative: true };
}

function extOf(p) {
  const b = basename(p).toLowerCase();
  const i = b.lastIndexOf('.');
  return i < 0 ? '' : b.slice(i);
}

// Is the file one the ASCII rule covers? asciiExtensions holds extensions (".cpp") and bare
// file names ("CMakeLists.txt"); asciiExempt holds path patterns. opts.markdown (default true)
// also covers tracked README.md / docs markdown when encoding.asciiRepoMarkdown is set.
function asciiCovered(abs, root, cfg, opts) {
  const enc = cfg.encoding || {};
  const withMd = !opts || opts.markdown !== false;
  const b = basename(abs).toLowerCase();
  const e = extOf(abs);
  const list = enc.asciiExtensions || [];
  let covered = list.some((x) => {
    const y = String(x).toLowerCase();
    return y.startsWith('.') ? y === e : y === b;
  });
  const r = rel(abs, root);
  if (!covered && withMd && enc.asciiRepoMarkdown && r !== null && e === '.md' && !r.startsWith('.claude/')) {
    const roots = (cfg.paths && cfg.paths.docsGateRoots) || [];
    covered = roots.some((g) => matchPattern(abs, root, g)) || b === 'readme.md';
  }
  if (!covered) return false;
  if (r !== null && r.startsWith('.claude/') && e === '.md') return false;
  if (matchAny(abs, root, enc.asciiExempt)) return false;
  return true;
}

module.exports = {
  norm, isAbsolute, under, rel, basename, globToRe, matchPattern, matchAny, tempRoots, inTemp,
  expandVars, resolveTarget, extOf, asciiCovered,
};
