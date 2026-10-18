#!/usr/bin/env node
// PreToolUse hook, matcher: Bash|PowerShell.
// Guards file-deleting commands. The command is tokenised like a shell would (quotes, ; && || |,
// redirections, heredocs); a delete is recognised only at a command position, and only the
// words that belong to that command are examined, so quoted messages, printf formats and
// redirections never trigger anything.
//
// Recognised deletes: rm rmdir unlink shred truncate del erase rd ri Remove-Item (-Path,
// -LiteralPath), git rm, git clean, find ... -delete | -exec rm, cmake -E rm|remove|
// remove_directory, [System.IO.File|Directory]::Delete, node/python/perl/ruby one-liners that
// call rmSync/rmdirSync/unlinkSync/rmtree/os.remove/..., also inside bash -c, cmd /c,
// powershell -Command / -EncodedCommand, Invoke-Expression and shell heredocs.
//
// Targets are resolved against the command's working directory (input.cwd, followed through
// `cd` / `pushd` inside the command). Bare names and globs are relative paths. If the working
// directory is outside the project, any relative target (including `*`) is refused.
//
// Allows:
//   - targets inside the project folder (CLAUDE_PROJECT_DIR, else the folder above .claude/)
//   - Claude's own temp/scratchpad: %TEMP%\claude, AppData\Local\Temp\claude, CLAUDE_SCRATCHPAD_DIR
//   - git clean without -x/-X (ignored files, such as the globally ignored .claude/, stay)
// Blocks:
//   - any target outside the project (and outside the temp locations above)
//   - targets inside .git/ or .claude/memory/, and .claude itself (so `rm -rf .claude`,
//     `rm -rf .git`, `rm -rf .` at the project root are refused; a glob that would match them is too)
//   - git clean with -x or -X (without -n), which would delete the ignored .claude/
//   - targets that cannot be resolved statically ($VAR, $(...), %VAR%, ~, xargs / pipeline input)
//     except $CLAUDE_PROJECT_DIR and $CLAUDE_SCRATCHPAD_DIR which are expanded
// Handles Windows paths (backslashes, drive letters, any case) and Git Bash paths (/c/...).
//
// Exit codes: 0 = allow (also on any internal error), 2 = block (reason on stderr).
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const MAX_DEPTH = 3;

// ---- path helpers --------------------------------------------------------------------------
function norm(p) {
  let s = String(p).replace(/\\/g, '/');
  const m = s.match(/^\/([a-zA-Z])(\/(.*))?$/); // Git Bash: /c/foo -> c:/foo
  if (m) s = m[1] + ':/' + (m[3] || '');
  s = s.toLowerCase();
  const drive = s.match(/^([a-z]:)(.*)$/);
  const rest = path.posix.normalize(drive ? drive[2] || '/' : s);
  return ((drive ? drive[1] : '') + rest).replace(/\/+$/, '');
}

function isAbsolute(t) { return /^([a-zA-Z]:[\\/]|\\\\|\/)/.test(t); }
function under(p, root) { return p === root || p.startsWith(root + '/'); }

function projectRoot() {
  return norm(process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..'));
}

function tempRoots() {
  const roots = [];
  const push = (p) => { if (p) roots.push(norm(p)); };
  push(process.env.CLAUDE_SCRATCHPAD_DIR);
  for (const v of [process.env.TMP, process.env.TEMP, process.env.TMPDIR, os.tmpdir()]) {
    if (v) push(path.join(v, 'claude'));
  }
  push(path.join(os.homedir(), 'AppData', 'Local', 'Temp', 'claude'));
  return roots;
}

function expandVars(t) {
  return t.replace(
    /\$\{?(CLAUDE_SCRATCHPAD_DIR|CLAUDE_PROJECT_DIR)\}?|\$env:(CLAUDE_SCRATCHPAD_DIR|CLAUDE_PROJECT_DIR)|%(CLAUDE_SCRATCHPAD_DIR|CLAUDE_PROJECT_DIR)%/gi,
    (all, a, b, c) => process.env[(a || b || c).toUpperCase()] || all);
}

function globToRe(pattern, psMode) {
  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    const segStart = i === 0 || pattern[i - 1] === '/';
    const noDot = segStart && !psMode ? '(?!\\.)' : '';
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
  try { return new RegExp(re + '$'); } catch (_) { return /^$/; }
}

// resolve one target word -> { abs, glob } or { err }
function resolveTarget(t0, cur) {
  const t = expandVars(String(t0));
  if (!t) return { err: 'has an empty target' };
  if (/^~/.test(t) || /[$`]/.test(t) || /%[A-Za-z_][\w()]*%/.test(t)) {
    return { err: 'targets a path that cannot be resolved statically: ' + t0 };
  }
  if (/^[A-Za-z]:(?![\\/])/.test(t)) return { err: 'uses a drive-relative path: ' + t0 };
  const glob = /[*?[]/.test(t);
  if (isAbsolute(t)) return { abs: norm(t), glob, relative: false };
  if (cur === null) return { err: 'has a relative target (' + t0 + ') but the working directory is not known' };
  return { abs: norm(cur + '/' + t), glob, relative: true };
}

// ---- tokeniser -----------------------------------------------------------------------------
// Returns segments [{ words: [{t, q}], sep }]; sep is the separator that preceded the segment.
function tokenize(src, ps) {
  const segs = [];
  let words = [];
  let sep = '';
  let cur = '';
  let has = false;
  let quoted = false;
  let unq = '';
  let unqOpen = true;
  let pendingRedirect = false;
  const n = src.length;

  const reset = () => { cur = ''; has = false; quoted = false; unq = ''; unqOpen = true; };
  const endWord = () => {
    if (!has) return;
    if (pendingRedirect) { pendingRedirect = false; reset(); return; }
    const m = unq.match(/^(?:\d*|&|\*)>>?|^\d*<(?!<)/);
    if (m) {
      if (cur.length === m[0].length) pendingRedirect = true; // "2>" "/dev/null": next word is the target
    } else {
      words.push({ t: cur, q: quoted });
    }
    reset();
  };
  const endSeg = (next) => {
    endWord();
    pendingRedirect = false;
    if (words.length) segs.push({ words, sep });
    words = [];
    sep = next;
  };
  const add = (c) => { cur += c; has = true; if (unqOpen) unq += c; };

  for (let i = 0; i < n; i++) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r') { endWord(); continue; }
    if (c === '\n') { endSeg('\n'); continue; }
    if (c === '#' && !has) { while (i < n && src[i] !== '\n') i++; i--; continue; }
    if (c === ';') { endSeg(';'); continue; }
    if (c === '&') {
      if (src[i + 1] === '&') { endSeg('&&'); i++; continue; }
      if (src[i - 1] === '>' || src[i - 1] === '<' || src[i + 1] === '>') { add(c); continue; }
      endSeg('&');
      continue;
    }
    if (c === '|') {
      if (src[i - 1] === '>') { add(c); continue; }
      if (src[i + 1] === '|') { endSeg('||'); i++; continue; }
      endSeg('|');
      if (src[i + 1] === '&') i++;
      continue;
    }
    if (c === '\\' && !ps && src[i + 1] === ';') { add(';'); i++; continue; } // find -exec ... \;
    if (c === "'") {
      has = quoted = true; unqOpen = false;
      const j = src.indexOf("'", i + 1);
      const end = j < 0 ? n : j;
      cur += src.slice(i + 1, end);
      i = end;
      continue;
    }
    if (c === '"') {
      has = quoted = true; unqOpen = false;
      let j = i + 1;
      while (j < n && src[j] !== '"') {
        if (ps ? src[j] === '`' : src[j] === '\\') {
          const nx = src[j + 1];
          if (nx !== undefined && (ps || /["\\$`\n]/.test(nx))) { cur += nx; j += 2; continue; }
        }
        cur += src[j];
        j++;
      }
      i = j;
      continue;
    }
    add(c);
  }
  endSeg('');
  return segs;
}

function extractHeredocs(cmd) {
  const bodies = [];
  const re = /<<-?\s*(['"]?)([A-Za-z_]\w*)\1([^\n]*)\n([\s\S]*?)\n\s*\2(?=\s|$)/g;
  let text = cmd.replace(re, (all, q, tag, rest, body, off) => {
    const lineStart = cmd.lastIndexOf('\n', off) + 1;
    bodies.push({ head: cmd.slice(lineStart, off), body });
    return ' ' + rest;
  });
  text = text.replace(/@(['"])\r?\n[\s\S]*?\r?\n\1@/g, ' ');
  return { text, bodies };
}

// ---- command knowledge ---------------------------------------------------------------------
const RM_VERBS = new Set(['rm', 'rmdir', 'rd', 'del', 'erase', 'unlink', 'shred', 'truncate', 'remove-item', 'ri']);
const CMDEXE_VERBS = new Set(['del', 'erase', 'rd', 'rmdir']);
const CD_VERBS = new Set(['cd', 'chdir', 'pushd', 'set-location', 'sl']);
const UNIX_SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);
const PS_SHELLS = new Set(['powershell', 'pwsh']);
const CODE_RUNNERS = new Set(['node', 'nodejs', 'python', 'python3', 'py', 'perl', 'ruby']);
const PREFIX = new Set(['sudo', 'time', 'command', 'builtin', 'exec', 'nohup', 'env', 'nice', 'xargs',
  'then', 'do', 'else', 'elif', 'if', 'while', 'until', '!', '&']);
const PREFIX_VALUE_FLAGS = new Set(['-u', '-g', '-n', '-C', '-h', '-p', '-U']);
const XARGS_VALUE_FLAGS = new Set(['-n', '-I', '-P', '-L', '-s', '-d', '-E', '-a']);
const AFTER_CMD = new Set(['then', 'do', 'else', 'elif', '!', '&&', '||', '-and', '-or', '|', '{', '(', ';']);
const PS_VALUE_PARAMS = new Set(['erroraction', 'ea', 'warningaction', 'wa', 'informationaction', 'ia',
  'errorvariable', 'ev', 'warningvariable', 'wv', 'outvariable', 'ov', 'outbuffer', 'ob',
  'pipelinevariable', 'pv', 'include', 'exclude', 'filter', 'credential', 'stream', 'depth']);
const PS_PATH_PARAM = /^-(?:pa|pat|path|li|lit|lite|liter|litera|literal|literalp|literalpa|literalpat|literalpath|lp|psp|pspath)(?::(.*))?$/i;
const FIND_FILTER = /^-(?:i?name|i?path|i?wholename|i?regex|type|newer\w*|[mac]time|[mac]min|size|empty|user|group|perm|links|i?lname|samefile|used)$/;
const CODE_DELETE = /rmSync|rmdirSync|unlinkSync|\.(?:rm|rmdir|unlink)\s*\(|\brmtree\b|\bos\s*\.\s*(?:remove|removedirs|rmdir|unlink)\b|\bFileUtils\b|\brm_rf?\b|\bunlink\b|\bremove_tree\b/;
const CODE_DYNAMIC = /homedir|tmpdir|process\s*\.\s*env|os\s*\.\s*environ|getenv|expanduser|__dirname|__file__|\bargv\b|\$\{|\bglob\b/i;
const CODE_NONPATH = new Set(['fs', 'os', 'path', 'child_process', 'shutil', 'utf8', 'utf-8', 'recursive',
  'force', 'node:fs', 'fs/promises', 'node:fs/promises', 'subprocess', 'sys', 'r', 'w', 'rb', 'wb']);

function base(w) {
  return String(w).replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.(exe|cmd|bat|ps1|com)$/, '');
}

class Checker {
  constructor(input) {
    this.root = projectRoot();
    this.temps = tempRoots();
    this.ps = String(input.tool_name || '') === 'PowerShell';
    this.cwd0 = norm(input.cwd || this.root);
  }

  inTemp(p) { return this.temps.some((r) => under(p, r)); }

  // reason string if a resolved target is not allowed, else null
  checkTargets(targets, cur, opt) {
    const G = this.root + '/.git';
    const C = this.root + '/.claude';
    const M = C + '/memory';
    for (const t0 of targets) {
      const r = resolveTarget(t0, cur);
      if (r.err) return r.err;
      const abs = r.abs;
      if (!(under(abs, this.root) || this.inTemp(abs))) {
        return r.relative
          ? 'has a relative target (' + t0 + ') but the working directory is outside the project (' + cur + ')'
          : 'targets a path outside the project folder: ' + t0;
      }
      if (r.glob) {
        const re = globToRe(abs, opt.ps);
        for (const P of [G, C, M]) {
          if (re.test(P)) return 'uses a pattern that matches a protected location (' + P.replace(this.root + '/', '') + '): ' + t0;
        }
      }
      if (under(abs, G) || under(abs, M)) return 'touches a protected location (.git/ or .claude/memory/): ' + t0;
      if (abs === C) return 'targets .claude itself: ' + t0;
      if (!opt.ancestorOk && (under(G, abs) || under(C, abs))) {
        return 'would remove a folder that contains .git/ or .claude/: ' + t0;
      }
    }
    return null;
  }

  resolveDir(t, cur) {
    if (t === undefined) return null;
    const r = resolveTarget(t, cur);
    return r.err ? null : r.abs;
  }

  // parse the arguments of rm-like commands -> target words
  parseDeleteArgs(name, args) {
    const targets = [];
    let afterDD = false;
    const psLike = name === 'remove-item' || name === 'ri' || this.ps;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (afterDD) { targets.push(a); continue; }
      if (a === '--') { afterDD = true; continue; }
      if (CMDEXE_VERBS.has(name) && /^\/[A-Za-z?](:\S*)?$/.test(a)) continue;
      if (name === 'truncate' && /^-[sro]$/.test(a)) { i++; continue; }
      if (/^-/.test(a)) {
        const pm = a.match(PS_PATH_PARAM);
        if (pm) {
          const v = pm[1] !== undefined ? pm[1] : args[++i];
          if (v !== undefined) for (const p of String(v).split(',')) if (p) targets.push(p);
          continue;
        }
        const pn = a.slice(1).split(':')[0].toLowerCase();
        if (PS_VALUE_PARAMS.has(pn) && !a.includes(':')) i++;
        continue;
      }
      if (psLike) for (const p of a.split(',')) { if (p) targets.push(p.replace(/^@\(|\)$/g, '')); }
      else targets.push(a);
    }
    return targets;
  }

  codeCheck(code, cur) {
    if (!CODE_DELETE.test(code)) return null;
    if (CODE_DYNAMIC.test(code)) return 'deletes a path computed at run time (cannot be checked)';
    const stripped = code
      .replace(/require\s*\(\s*(['"`])[^'"`]*\1\s*\)/g, ' ')
      .replace(/\bimport\s+[\w\s,{}*]+\s+from\s+(['"`])[^'"`]*\1/g, ' ');
    const lits = [];
    const re = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
    let m;
    while ((m = re.exec(stripped))) {
      const v = m[2].replace(/\\\\/g, '\\');
      if (v && !CODE_NONPATH.has(v)) lits.push(v);
    }
    if (lits.length === 0) return 'deletes a path that is not a literal in the code (cannot be checked)';
    return this.checkTargets(lits, cur, { ps: false, ancestorOk: false });
  }

  analyze(cmd, ps, cur0, depth) {
    if (depth > MAX_DEPTH) return null;
    const hd = extractHeredocs(cmd);
    const st = { cur: cur0, stack: [] };
    for (const hb of hd.bodies) {
      let r = null;
      const h = hb.head;
      if (/(?:^|[\s;&|/\\])(bash|sh|zsh|dash|ksh|pwsh|powershell)(?:\.exe)?(?=\s|$)/i.test(h)) {
        r = this.analyze(hb.body, /pwsh|powershell/i.test(h), st.cur, depth + 1);
      } else if (/(?:^|[\s;&|/\\])(node|nodejs|python3?|py|perl|ruby)(?:\.exe)?(?=\s|$)/i.test(h)) {
        r = this.codeCheck(hb.body, st.cur);
      }
      if (r) return r;
    }
    for (const seg of tokenize(hd.text, ps)) {
      const r = this.segment(seg, ps, st, depth);
      if (r) return r;
    }
    return null;
  }

  segment(seg, ps, st, depth) {
    // strip subshell / block punctuation around the segment
    let words = seg.words.map((w) => w.t);
    while (words.length && /^[({!]+/.test(words[0])) {
      words[0] = words[0].replace(/^[({!]+/, '');
      if (!words[0]) words.shift();
      else break;
    }
    if (words.length && /\)$/.test(words[words.length - 1]) && !/\(/.test(words[words.length - 1])) {
      words[words.length - 1] = words[words.length - 1].replace(/\)+$/, '');
    }
    if (words.length === 0) return null;

    for (const w of words) {
      const m = w.match(/^\[(?:system\.)?io\.(?:file|directory)\]::delete\((.*)$/i);
      if (m) {
        const first = m[1].replace(/\)\s*$/, '').split(',')[0];
        const r = this.checkTargets([first], st.cur, { ps: true, ancestorOk: false });
        if (r) return r;
      }
    }

    const starts = [];
    const addStart = (i) => {
      let xargs = false;
      while (i < words.length) {
        const w = words[i];
        const lw = w.toLowerCase();
        if (PREFIX.has(lw)) {
          if (lw === 'xargs') xargs = true;
          i++;
          if (['sudo', 'env', 'nice', 'time', 'nohup', 'command', 'exec', 'xargs'].includes(lw)) {
            while (i < words.length && /^-/.test(words[i])) {
              i += (lw === 'xargs' ? XARGS_VALUE_FLAGS : PREFIX_VALUE_FLAGS).has(words[i]) ? 2 : 1;
            }
          }
          continue;
        }
        if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w)) { i++; continue; }
        break;
      }
      if (i < words.length) starts.push({ i, xargs });
    };
    addStart(0);
    for (let j = 1; j < words.length; j++) {
      const p = words[j - 1];
      if (AFTER_CMD.has(p.toLowerCase()) || /[){]$/.test(p)) addStart(j);
    }
    for (const s of starts) {
      const r = this.command(words, s.i, s.xargs, seg.sep === '|', ps, st, depth);
      if (r) return r;
    }
    return null;
  }

  command(words, s, xargs, piped, ps, st, depth) {
    const name = base(words[s]);
    let end = words.indexOf('}', s + 1);
    if (end < 0) end = words.length;
    const args = words.slice(s + 1, end);

    if (CD_VERBS.has(name)) {
      if (name === 'pushd') st.stack.push(st.cur);
      let t;
      for (let i = 0; i < args.length; i++) {
        if (/^\/d$/i.test(args[i]) || /^-/.test(args[i])) continue;
        t = args[i];
        break;
      }
      st.cur = t === undefined ? norm(os.homedir()) : this.resolveDir(t, st.cur);
      return null;
    }
    if (name === 'popd') { st.cur = st.stack.length ? st.stack.pop() : null; return null; }

    if (RM_VERBS.has(name)) {
      const targets = this.parseDeleteArgs(name, args);
      if (xargs) return 'takes its targets from xargs (cannot be checked)';
      if (targets.length === 0) {
        return piped ? 'takes its targets from a pipeline (cannot be checked)' : null;
      }
      return this.checkTargets(targets, st.cur, { ps: ps || name === 'remove-item' || name === 'ri', ancestorOk: false });
    }

    if (name === 'git') return this.git(args, xargs, st);

    if (name === 'find') return this.find(args, st);

    if (name === 'cmake') {
      const k = args.findIndex((a) => a === '-E' || a === '-e');
      if (k < 0) return null;
      const sub = args[k + 1];
      if (!['rm', 'remove', 'remove_directory'].includes(sub)) return null;
      const targets = [];
      let dd = false;
      for (const a of args.slice(k + 2)) {
        if (!dd && a === '--') { dd = true; continue; }
        if (!dd && /^-/.test(a)) continue;
        targets.push(a);
      }
      return this.checkTargets(targets, st.cur, { ps, ancestorOk: false });
    }

    if (CODE_RUNNERS.has(name)) {
      for (let i = 0; i < args.length - 1; i++) {
        if (/^(-e|-p|-pe|-ep|--eval|--print|-c)$/.test(args[i])) {
          const r = this.codeCheck(args[i + 1], st.cur);
          if (r) return r;
        }
      }
      return null;
    }

    if (UNIX_SHELLS.has(name) || PS_SHELLS.has(name) || name === 'cmd' || name === 'wsl') {
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (PS_SHELLS.has(name) && /^-e(c|ncodedcommand)?$/i.test(a) && args[i + 1]) {
          let inner = '';
          try { inner = Buffer.from(args[i + 1], 'base64').toString('utf16le'); } catch (_) { /* ignore */ }
          return this.analyze(inner, true, st.cur, depth + 1);
        }
        const isFlag = UNIX_SHELLS.has(name) ? /^-[a-z]*c$/.test(a)
          : PS_SHELLS.has(name) ? /^-c(ommand)?$/i.test(a)
            : name === 'cmd' ? /^\/[ck]$/i.test(a) : false;
        if (!isFlag) continue;
        const inner = UNIX_SHELLS.has(name) ? args[i + 1] : args.slice(i + 1).join(' ');
        if (inner === undefined) return null;
        return this.analyze(inner, PS_SHELLS.has(name), st.cur, depth + 1);
      }
      return null;
    }

    if (name === 'iex' || name === 'invoke-expression') {
      return this.analyze(args.join(' '), true, st.cur, depth + 1);
    }
    return null;
  }

  git(args, xargs, st) {
    let i = 0;
    let dir = st.cur;
    while (i < args.length) {
      const a = args[i];
      if (a === '-C') { dir = this.resolveDir(args[i + 1], dir); i += 2; continue; }
      if (a === '-c') { i += 2; continue; }
      if (/^-/.test(a)) { i++; continue; }
      break;
    }
    const sub = args[i];
    const rest = args.slice(i + 1);
    if (sub === 'rm') {
      const targets = [];
      let dd = false;
      for (const a of rest) {
        if (!dd && a === '--') { dd = true; continue; }
        if (!dd && /^-/.test(a)) continue;
        targets.push(a);
      }
      if (targets.length === 0) return null;
      if (dir === null) return 'runs git rm from an unknown working directory';
      return this.checkTargets(targets, dir, { ps: false, ancestorOk: true });
    }
    if (sub === 'clean') {
      let dry = false;
      let ign = false;
      const targets = [];
      let dd = false;
      for (let k = 0; k < rest.length; k++) {
        const a = rest[k];
        if (!dd && a === '--') { dd = true; continue; }
        if (!dd && a.startsWith('--')) {
          if (a === '--dry-run') dry = true;
          else if (a === '--exclude') k++;
          continue;
        }
        if (!dd && a.startsWith('-')) {
          for (const ch of a.slice(1)) {
            if (ch === 'n') dry = true;
            else if (ch === 'x' || ch === 'X') ign = true;
            else if (ch === 'e') { k++; break; }
          }
          continue;
        }
        targets.push(a);
      }
      if (dry) return null;
      if (ign) return 'runs `git clean -x/-X`, which deletes ignored files including the globally ignored .claude/ (use -fd, or -n first)';
      if (dir === null) return 'runs git clean from an unknown working directory';
      return this.checkTargets(targets.length ? targets : ['.'], dir, { ps: false, ancestorOk: true });
    }
    return null;
  }

  find(args, st) {
    let i = 0;
    while (i < args.length && /^-[HLP]$|^-[DO]/.test(args[i])) i++;
    const starts = [];
    while (i < args.length && !/^(-|\(|\)|!|,)/.test(args[i])) starts.push(args[i++]);
    const expr = args.slice(i);
    let del = expr.includes('-delete');
    for (let k = 0; k < expr.length - 1; k++) {
      if (/^-(exec|execdir|ok|okdir)$/.test(expr[k]) && RM_VERBS.has(base(expr[k + 1]))) del = true;
    }
    if (!del) return null;
    const filtered = expr.some((a) => FIND_FILTER.test(a));
    return this.checkTargets(starts.length ? starts : ['.'], st.cur, { ps: false, ancestorOk: filtered });
  }
}

function check(input) {
  const cmd = String((input.tool_input && input.tool_input.command) || '');
  const ck = new Checker(input);
  return ck.analyze(cmd, ck.ps, ck.cwd0, 0);
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
  const cmd = String((input.tool_input && input.tool_input.command) || '');
  if (!cmd) return 0;
  const why = check(input);
  if (!why) return 0;
  say('[guard-delete] Blocked: this delete command ' + why + '\n  ' + cmd.split('\n')[0].slice(0, 300) +
    '\nProject rule: deleting is allowed only inside the project folder (never .git/, .claude/memory/ or .claude itself) ' +
    'or for Claude\'s own temp/scratchpad files. Anything else needs the user\'s explicit permission.\n');
  return 2;
}

module.exports = { check };

if (require.main === module) {
  readStdin((raw) => {
    let code = 0;
    try { code = main(raw); } catch (err) {
      say('[guard-delete] internal error (allowing): ' + (err && err.message ? err.message : err) + '\n');
      code = 0;
    }
    process.exit(code);
  });
}
