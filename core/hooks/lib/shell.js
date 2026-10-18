'use strict';
// Shell-command walker shared by guard-shell: a tokeniser that understands quotes, separators,
// redirections, heredocs and PowerShell here-strings; command-position detection with prefixes
// (sudo, env, xargs, then/do ...); cd/pushd/popd tracking; recursion into nested shells
// (bash -c, cmd /c, powershell -Command / -EncodedCommand, Invoke-Expression, heredocs fed to a
// shell) and into code runners (node/python/perl/ruby -e / -c).
//
// Adapted from a project-written guard-delete.js tokeniser (2026).
//
// walk(cmd, { ps, cwd, visitor, maxDepth }) calls:
//   visitor.command({ name, exe, args, words, redirects, cur, xargs, piped, ps, depth, cwdState })
//     -> may return a string (stop walking, the reason) or nothing
//   visitor.code(code, cur, runner) for inline code (node -e, python -c, heredoc bodies)
//   visitor.resolveDir(target, cur) optional, used for cd targets
// The walker stops at the first truthy return value and returns it.

const os = require('os');
const { norm, resolveTarget } = require('./paths');

const CD_VERBS = new Set(['cd', 'chdir', 'pushd', 'set-location', 'sl']);
const UNIX_SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);
const PS_SHELLS = new Set(['powershell', 'pwsh']);
const CODE_RUNNERS = new Set(['node', 'nodejs', 'python', 'python3', 'py', 'perl', 'ruby']);
const PREFIX = new Set(['sudo', 'time', 'command', 'builtin', 'exec', 'nohup', 'env', 'nice', 'xargs',
  'then', 'do', 'else', 'elif', 'if', 'while', 'until', '!', '&']);
const PREFIX_VALUE_FLAGS = new Set(['-u', '-g', '-n', '-C', '-h', '-p', '-U']);
const XARGS_VALUE_FLAGS = new Set(['-n', '-I', '-P', '-L', '-s', '-d', '-E', '-a']);
const AFTER_CMD = new Set(['then', 'do', 'else', 'elif', '!', '&&', '||', '|', '{', '(', ';']);

function base(w) {
  return String(w).replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.(exe|cmd|bat|ps1|com)$/, '');
}

// Returns segments [{ words: [{t, q, r}], sep }]; r marks a redirection target.
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
    if (pendingRedirect) { pendingRedirect = false; words.push({ t: cur, q: quoted, r: true }); reset(); return; }
    const m = unq.match(/^(?:\d*|&|\*)>>?|^\d*<(?!<)/);
    if (m) {
      if (cur.length === m[0].length) pendingRedirect = true; // "2>" "/dev/null": next word is the target
      else if (!cur.slice(m[0].length).startsWith('&') && !/^\d*</.test(m[0])) {
        words.push({ t: cur.slice(m[0].length), q: quoted, r: true }); // ">file"
      }
    } else {
      words.push({ t: cur, q: quoted, r: false });
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

// Pull heredoc bodies (<<TAG ... TAG) and PowerShell here-strings (@' ... '@) out of a command.
function extractHeredocs(cmd) {
  const bodies = [];
  const re = /<<-?\s*(['"]?)([A-Za-z_]\w*)\1([^\n]*)\n([\s\S]*?)\n\s*\2(?=\s|$)/g;
  let text = cmd.replace(re, (all, q, tag, rest, body, off) => {
    const lineStart = cmd.lastIndexOf('\n', off) + 1;
    bodies.push({ head: cmd.slice(lineStart, off), body });
    return ' ' + rest;
  });
  text = text.replace(/@(['"])\r?\n([\s\S]*?)\r?\n\1@/g, (all, q, body) => {
    bodies.push({ head: '', body });
    return ' ';
  });
  return { text, bodies };
}

// Text that is data, not commands: heredoc bodies, here-strings, -m/--message/-b/--body strings.
function stripText(cmd) {
  return extractHeredocs(cmd).text
    .replace(/\s(-m|--message|-b|--body)(\s+|=)("(?:[^"\\]|\\.)*"|'[^']*')/g, ' ');
}

class Walker {
  constructor(opts) {
    this.visitor = opts.visitor;
    this.maxDepth = opts.maxDepth || 3;
  }

  resolveDir(t, cur) {
    if (t === undefined) return null;
    if (this.visitor.resolveDir) return this.visitor.resolveDir(t, cur);
    const r = resolveTarget(t, cur);
    return r.err ? null : r.abs;
  }

  analyze(cmd, ps, cur0, depth) {
    if (depth > this.maxDepth) return null;
    const hd = extractHeredocs(cmd);
    const st = { cur: cur0, stack: [] };
    for (const hb of hd.bodies) {
      let r = null;
      const h = hb.head;
      if (/(?:^|[\s;&|/\\])(bash|sh|zsh|dash|ksh|pwsh|powershell)(?:\.exe)?(?=\s|$)/i.test(h)) {
        r = this.analyze(hb.body, /pwsh|powershell/i.test(h), st.cur, depth + 1);
      } else if (/(?:^|[\s;&|/\\])(node|nodejs|python3?|py|perl|ruby)(?:\.exe)?(?=\s|$)/i.test(h)) {
        r = this.visitor.code ? this.visitor.code(hb.body, st.cur, 'heredoc') : null;
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
    const redirects = seg.words.filter((w) => w.r).map((w) => w.t);
    let words = seg.words.filter((w) => !w.r).map((w) => w.t);
    while (words.length && /^[({!]+/.test(words[0])) {
      words[0] = words[0].replace(/^[({!]+/, '');
      if (!words[0]) words.shift();
      else break;
    }
    if (words.length && /\)$/.test(words[words.length - 1]) && !/\(/.test(words[words.length - 1])) {
      words[words.length - 1] = words[words.length - 1].replace(/\)+$/, '');
    }
    if (words.length === 0 && redirects.length === 0) return null;
    if (words.length === 0) {
      return this.visitor.command({ name: '', exe: '', args: [], words, redirects, cur: st.cur,
        xargs: false, piped: seg.sep === '|', ps, depth, cwdState: st }) || null;
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
      const r = this.command(words, s.i, s.xargs, seg.sep === '|', ps, st, depth, redirects);
      if (r) return r;
    }
    return null;
  }

  command(words, s, xargs, piped, ps, st, depth, redirects) {
    const exe = words[s];
    const name = base(exe);
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
      // a shell invoked with a script file or no flag: fall through to the visitor
    }
    if (name === 'iex' || name === 'invoke-expression') {
      return this.analyze(args.join(' '), true, st.cur, depth + 1);
    }
    if (CODE_RUNNERS.has(name) && this.visitor.code) {
      for (let i = 0; i < args.length - 1; i++) {
        if (/^(-e|-p|-pe|-ep|--eval|--print|-c)$/.test(args[i])) {
          const r = this.visitor.code(args[i + 1], st.cur, name);
          if (r) return r;
        }
      }
    }
    return this.visitor.command({ name, exe, args, words, redirects, cur: st.cur, xargs, piped, ps,
      depth, cwdState: st }) || null;
  }
}

function walk(cmd, opts) {
  const w = new Walker(opts);
  return w.analyze(String(cmd), !!opts.ps, opts.cwd === undefined ? null : opts.cwd, 0);
}

module.exports = { tokenize, extractHeredocs, stripText, walk, base, CD_VERBS, UNIX_SHELLS, PS_SHELLS, CODE_RUNNERS };
