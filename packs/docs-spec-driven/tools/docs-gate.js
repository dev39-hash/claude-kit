#!/usr/bin/env node
// docs-gate.js (pack docs-spec-driven): mechanical checks of the spec-driven docs regime over
// the tracked files of a project.
//
//   node docs-gate.js [--all | --changed | --staged | --paths <p>...] [--strict] [--json] [--no-git] [--root <dir>]
//
// Scope: --all (default) = git ls-files (or a tree walk with --no-git / outside a repo);
// --changed = modified + added + untracked per git status; --staged = the index; --paths = the
// named files or directories. Cross-file facts (decision items, spec IDs, backlog rows) are
// always read from the whole project; findings are reported for in-scope files only.
//
// Checks (severity):
//   claude-ref      HIGH    .claude / Claude / CLAUDE.md / AGENTS.md / memory folder in a tracked file
//   request-ref     HIGH    the untracked requests directory named in a tracked file
//   phase           HIGH    numbered plan phase or checkpoint (phase 7, Phase 12B, CP1) outside the history dir
//   adr-missing     HIGH    "ADR Dn" cited but no "### Dn" item in the decision file
//   adr-dup         HIGH    the same Dn heading twice in the decision file
//   spec-dup        HIGH    the same requirement ID defined twice in the spec files
//   backlog-dup     HIGH    the same BL-nnn row twice in the backlog
//   agent-vocab     MEDIUM  agent workspace vocabulary (sub agent, task file, work package, model names, gate 1)
//   url             MEDIUM  external URL in a code file (LOW in a doc)
//   machine-path    MEDIUM  drive-letter or home-directory path
//   spec-unknown    MEDIUM  a requirement ID cited whose prefix exists but whose number is not defined
//   spec-no-accept  MEDIUM  a requirement defined in a spec and never referenced again in it (no acceptance row)
//   backlog-stale   MEDIUM  BL-nnn cited that is neither an open row nor ruled out
//   backlog-second  MEDIUM  a second list (bug_*.md, technical_debt, known_issues, TODO.md) under docs
//   spec-marker     LOW     (new) / (changed) plan markers still present in a spec
//   backlog-lastid  LOW     "Last used ID" lower than the highest row
//   adr-gap         LOW     a gap in the decision numbering (expected after a removal; informational)
//   changelog       LOW     the changelog file is missing
//
// Exit 1 on any HIGH (also on MEDIUM with --strict); 0 otherwise. Never edits anything.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const env = require('./kit-env');

const P = env.lib('paths');

const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.pdf', '.zip', '.7z', '.gz', '.tar',
  '.exe', '.dll', '.lib', '.obj', '.pdb', '.a', '.so', '.dylib', '.bin', '.dat', '.ttf', '.otf', '.woff', '.woff2',
  '.ezd', '.pyc', '.class', '.jar', '.svg']);
const MAX_BYTES = 2 * 1024 * 1024;

function parseArgs(argv) {
  const o = { mode: 'all', paths: [], strict: false, json: false, git: true, root: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all' || a === '--changed' || a === '--staged') o.mode = a.slice(2);
    else if (a === '--paths') { o.mode = 'paths'; while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) o.paths.push(argv[++i]); }
    else if (a === '--strict') o.strict = true;
    else if (a === '--json') o.json = true;
    else if (a === '--no-git') o.git = false;
    else if (a === '--root') o.root = argv[++i];
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else throw new Error('unknown argument: ' + a);
  }
  return o;
}

function usage() {
  const src = fs.readFileSync(__filename, 'utf8').split(/\r?\n/);
  for (const l of src.slice(1)) { if (!l.startsWith('//')) break; console.log(l.replace(/^\/\/ ?/, '')); }
}

function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  return r.stdout;
}

function isRepo(root) { return git(root, ['rev-parse', '--is-inside-work-tree']) !== null; }

function listTracked(root, useGit, cfg) {
  if (useGit && isRepo(root)) {
    const out = git(root, ['ls-files', '-z']);
    if (out !== null) return out.split('\0').filter(Boolean);
  }
  const skip = ['.git/', '.claude/'].concat((cfg.build && cfg.build.buildDirPatterns) || [], (cfg.paths && cfg.paths.localOnly) || []);
  const acc = [];
  const nroot = P.norm(root);
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      const rel = path.relative(root, abs).replace(/\\/g, '/');
      if (P.matchAny(P.norm(abs), nroot, skip)) continue;
      if (e.isDirectory()) walk(abs); else if (e.isFile()) acc.push(rel);
    }
  };
  walk(root);
  return acc;
}

function listChanged(root, staged) {
  if (!isRepo(root)) throw new Error('--changed / --staged need a git repository');
  if (staged) return (git(root, ['diff', '--name-only', '--cached', '-z']) || '').split('\0').filter(Boolean);
  const out = git(root, ['status', '--porcelain', '-z', '--untracked-files=all']) || '';
  const items = out.split('\0').filter(Boolean);
  const acc = [];
  for (let i = 0; i < items.length; i++) {
    const st = items[i].slice(0, 2), p = items[i].slice(3);
    if (st[0] === 'R' || st[0] === 'C') { i++; } // renamed: next item is the old path
    if (st.includes('D')) continue;
    acc.push(p);
  }
  return acc;
}

function expandPaths(root, paths) {
  const acc = [];
  for (const p of paths) {
    const abs = path.resolve(root, p);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) {
      const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const a = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== '.git') walk(a); } else acc.push(path.relative(root, a).replace(/\\/g, '/')); } };
      walk(abs);
    } else acc.push(path.relative(root, abs).replace(/\\/g, '/'));
  }
  return acc;
}

function readText(abs) {
  let st;
  try { st = fs.statSync(abs); } catch (_) { return null; }
  if (!st.isFile() || st.size > MAX_BYTES) return null;
  if (BINARY_EXT.has(path.extname(abs).toLowerCase())) return null;
  const buf = fs.readFileSync(abs);
  const head = buf.subarray(0, Math.min(buf.length, 8000));
  if (head.indexOf(0) !== -1) return null;
  return buf.toString('utf8');
}

function under(rel, dir) {
  const d = String(dir || '').replace(/\\/g, '/').replace(/\/+$/, '');
  return d !== '' && (rel === d || rel.startsWith(d + '/'));
}

function globToRe(g) {
  return new RegExp('^' + String(g).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
}

class Gate {
  constructor(root, cfg, pc) {
    this.root = root; this.cfg = cfg; this.pc = pc;
    this.findings = [];
    this.exemptRes = (pc.exemptPaths || []).map(globToRe);
    this.urlAllow = (pc.urlAllow || []).map((s) => new RegExp(s, 'i'));
    this.pathAllow = (pc.machinePathAllow || []).map((s) => new RegExp(s, 'i'));
    this.phaseRes = [/\b[Pp][Hh][Aa][Ss][Ee][ _-]?\d+[A-Za-z]?\b/, /\bCP\d\b/].concat((pc.extraPhaseWords || []).map((s) => new RegExp(s)));
    this.adrCite = new RegExp('\\bADR\\s+' + pc.adrPrefix + '(\\d+)\\b', 'g');
    this.adrHead = new RegExp('^#{2,4}\\s+' + pc.adrPrefix + '(\\d+)\\b');
    this.specIdRe = /\b([A-Z]{2,5})-(\d{3,4})\b/g;
    this.specDef = /^\s*(?:\|\s*|-\s+\**|#{2,4}\s+)([A-Z]{2,5}-\d{3,4})\b/;
    this.blRe = new RegExp('\\b' + pc.backlogPrefix + '-(\\d{3,4})\\b', 'g');
    this.blRow = new RegExp('^\\s*\\|\\s*' + pc.backlogPrefix + '-(\\d{3,4})\\s*\\|');
  }

  add(sev, file, line, check, msg) { this.findings.push({ severity: sev, file, line, check, message: msg }); }

  isExempt(rel) {
    const base = path.basename(rel);
    if (rel.startsWith('.claude/')) return true;
    for (const d of this.pc.vendorDirs || []) if (under(rel, d)) return true;
    for (const re of this.exemptRes) if (re.test(base) || re.test(rel)) return true;
    return false;
  }
  isCode(rel) { return (this.pc.codeExtensions || []).includes(path.extname(rel).toLowerCase()) && path.extname(rel).toLowerCase() !== '.txt' || /(^|\/)CMakeLists\.txt$/.test(rel); }
  isDoc(rel) { return (this.pc.docExtensions || []).includes(path.extname(rel).toLowerCase()) && !this.isCode(rel); }

  // ---- cross-file facts (whole project) ----
  collectFacts() {
    const pc = this.pc;
    this.adrItems = new Map(); this.adrDups = []; this.adrExists = false;
    const adrAbs = path.join(this.root, pc.adrFile);
    const adrText = readText(adrAbs);
    if (adrText !== null) {
      this.adrExists = true;
      adrText.split(/\r?\n/).forEach((l, i) => {
        const m = this.adrHead.exec(l);
        if (!m) return;
        const n = Number(m[1]);
        if (this.adrItems.has(n)) this.adrDups.push({ n, line: i + 1, first: this.adrItems.get(n) });
        else this.adrItems.set(n, i + 1);
      });
    }
    this.specIds = new Map(); this.specDups = []; this.specPrefixes = new Set(); this.specFiles = [];
    const specAbs = path.join(this.root, pc.specDir);
    if (fs.existsSync(specAbs) && fs.statSync(specAbs).isDirectory()) {
      for (const f of fs.readdirSync(specAbs).sort()) {
        if (!/\.md$/i.test(f)) continue;
        const rel = (pc.specDir.replace(/\/+$/, '') + '/' + f);
        const text = readText(path.join(specAbs, f));
        if (text === null) continue;
        this.specFiles.push({ rel, text });
        // A row defines an ID only under a "Requirements" heading; a file without such a
        // heading defines an ID at its first row and merely references it afterwards.
        const hasReqHeading = /^#+\s.*requirement/im.test(text);
        let inReq = !hasReqHeading;
        const seenHere = new Set();
        text.split(/\r?\n/).forEach((l, i) => {
          if (hasReqHeading && /^#+\s/.test(l)) inReq = /requirement/i.test(l);
          if (!inReq) return;
          const m = this.specDef.exec(l);
          if (!m) return;
          const id = m[1];
          if (!hasReqHeading) { if (seenHere.has(id)) return; seenHere.add(id); }
          this.specPrefixes.add(id.split('-')[0]);
          if (this.specIds.has(id)) this.specDups.push({ id, rel, line: i + 1, first: this.specIds.get(id) });
          else this.specIds.set(id, { rel, line: i + 1 });
        });
      }
    }
    this.blRows = new Map(); this.blDups = []; this.blRuledOut = new Set(); this.blLastUsed = null; this.blExists = false;
    const blText = readText(path.join(this.root, pc.backlogFile));
    if (blText !== null) {
      this.blExists = true;
      let ruled = false;
      blText.split(/\r?\n/).forEach((l, i) => {
        if (/^##\s+ruled out/i.test(l)) ruled = true;
        const lu = /^\s*Last used ID:\s*[A-Z]+-(\d+)/i.exec(l);
        if (lu) this.blLastUsed = Number(lu[1]);
        const m = this.blRow.exec(l);
        if (!m) return;
        const n = Number(m[1]);
        if (ruled) { this.blRuledOut.add(n); return; }
        if (this.blRows.has(n)) this.blDups.push({ n, line: i + 1, first: this.blRows.get(n) });
        else this.blRows.set(n, i + 1);
      });
    }
  }

  // ---- structural findings (reported when the owning file is in scope) ----
  structural(scope) {
    const pc = this.pc, inScope = (rel) => scope === null || scope.has(rel);
    if (inScope(pc.adrFile)) {
      for (const d of this.adrDups) this.add('HIGH', pc.adrFile, d.line, 'adr-dup', pc.adrPrefix + d.n + ' already defined at line ' + d.first);
      const nums = Array.from(this.adrItems.keys()).sort((a, b) => a - b);
      for (let i = 1; i < nums.length; i++) if (nums[i] !== nums[i - 1] + 1) this.add('LOW', pc.adrFile, this.adrItems.get(nums[i]), 'adr-gap', 'numbering jumps from ' + pc.adrPrefix + nums[i - 1] + ' to ' + pc.adrPrefix + nums[i] + ' (fine after a removal; never renumber)');
    }
    for (const d of this.specDups) if (inScope(d.rel)) this.add('HIGH', d.rel, d.line, 'spec-dup', d.id + ' already defined in ' + d.first.rel + ':' + d.first.line);
    for (const sf of this.specFiles) {
      if (!inScope(sf.rel)) continue;
      const hasAccept = /^#+\s.*acceptance/im.test(sf.text);
      const lines = sf.text.split(/\r?\n/);
      lines.forEach((l, i) => { if (/\((new|changed)\)/.test(l) && this.specDef.test(l)) this.add('LOW', sf.rel, i + 1, 'spec-marker', 'plan marker still present; drop it at close-out'); });
      if (hasAccept) {
        for (const [id, def] of this.specIds) {
          if (def.rel !== sf.rel) continue;
          const count = (sf.text.match(new RegExp('\\b' + id + '\\b', 'g')) || []).length;
          if (count < 2) this.add('MEDIUM', sf.rel, def.line, 'spec-no-accept', id + ' is defined but never referenced again in its spec (no acceptance row)');
        }
      }
    }
    if (inScope(pc.backlogFile)) {
      for (const d of this.blDups) this.add('HIGH', pc.backlogFile, d.line, 'backlog-dup', pc.backlogPrefix + '-' + d.n + ' already listed at line ' + d.first);
      const max = Math.max(0, ...this.blRows.keys(), ...this.blRuledOut);
      if (this.blExists && this.blLastUsed !== null && this.blLastUsed < max) this.add('LOW', pc.backlogFile, 1, 'backlog-lastid', 'Last used ID ' + this.blLastUsed + ' is below the highest row ' + max);
    }
    if (scope === null && pc.changelog && !fs.existsSync(path.join(this.root, pc.changelog))) this.add('LOW', pc.changelog, 0, 'changelog', 'changelog file missing');
  }

  // ---- per-file content checks ----
  file(rel) {
    if (this.isExempt(rel)) return;
    const pc = this.pc;
    const base = path.basename(rel).toLowerCase();
    if (under(rel, 'docs') && rel !== pc.backlogFile && /(^|\/)(bug_[^/]*\.md|technical_debt[^/]*\.md|known_issues[^/]*\.md|todo\.md|backlog[^/]*\.md)$/i.test(rel)) {
      this.add('MEDIUM', rel, 0, 'backlog-second', 'looks like a second backlog; the one list is ' + pc.backlogFile);
    }
    const text = readText(path.join(this.root, rel));
    if (text === null) return;
    const code = this.isCode(rel), doc = this.isDoc(rel);
    const inHistory = under(rel, pc.historyDir);
    const isAdr = rel === pc.adrFile, isBacklog = rel === pc.backlogFile, isSpec = under(rel, pc.specDir);
    const reqDir = String(pc.requestsDir || '').replace(/\/+$/, '');
    const lines = text.split(/\r?\n/);
    if (!inHistory) {
      const pm = /(^|\/)phase[_-]?\d+[a-z]?(\b|[_.-])/i.exec(rel);
      if (pm) this.add('HIGH', rel, 0, 'phase', 'file name carries a plan phase; phases live only under ' + pc.historyDir);
    }
    lines.forEach((l, i) => {
      const ln = i + 1;
      if (/\.claude\b|\bCLAUDE\.md\b|\bAGENTS?\.md\b|\bClaude\b/.test(l) || /\bmemory folder|\bauto-?memory\b/i.test(l)) this.add('HIGH', rel, ln, 'claude-ref', 'tracked file references the agent workspace: ' + l.trim().slice(0, 100));
      if (reqDir && l.includes(reqDir)) this.add('HIGH', rel, ln, 'request-ref', 'references the untracked requests directory ' + reqDir);
      if (!inHistory) for (const re of this.phaseRes) { const m = re.exec(l); if (m) { this.add('HIGH', rel, ln, 'phase', 'plan phase "' + m[0] + '" outside ' + pc.historyDir); break; } }
      const av = /\bsub[ -]?agents?\b|\bsubagents?\b|\btask file\b|\bwork package\b|\bWP-\d+\b|\bT-\d{3}\b|\b(sonnet|opus|haiku)\b|\bgate [12]\b|\bhandoff\b/i.exec(l);
      if (av) this.add('MEDIUM', rel, ln, 'agent-vocab', 'agent workspace vocabulary "' + av[0] + '"');
      if (code || doc) {
        const um = /\bhttps?:\/\/[^\s)>"']+/.exec(l);
        if (um && !this.urlAllow.some((re) => re.test(l))) this.add(code ? 'MEDIUM' : 'LOW', rel, ln, 'url', 'external URL ' + um[0] + (code ? ' in a code comment; cite a tracked copy' : ''));
        const mp = /\b[A-Za-z]:[\\/](?:Users|home|DGB|Program Files|Qt|dev|src|work|proj|projects)\b|\/home\/[A-Za-z0-9_]+\/|\/Users\/[A-Za-z0-9_]+\/|%USERPROFILE%|\$env:USERPROFILE/.exec(l);
        if (mp && !this.pathAllow.some((re) => re.test(l))) this.add('MEDIUM', rel, ln, 'machine-path', 'machine-local path "' + mp[0] + '"');
      }
      if (!isAdr) {
        let m; this.adrCite.lastIndex = 0;
        while ((m = this.adrCite.exec(l)) !== null) {
          const n = Number(m[1]);
          if (!this.adrExists) this.add('HIGH', rel, ln, 'adr-missing', 'cites ADR ' + pc.adrPrefix + n + ' but ' + pc.adrFile + ' does not exist');
          else if (!this.adrItems.has(n)) this.add('HIGH', rel, ln, 'adr-missing', 'cites ADR ' + pc.adrPrefix + n + ' which is not in ' + pc.adrFile);
        }
      }
      if (!isSpec && this.specPrefixes.size) {
        let m; this.specIdRe.lastIndex = 0;
        while ((m = this.specIdRe.exec(l)) !== null) {
          if (m[1] === pc.backlogPrefix || !this.specPrefixes.has(m[1])) continue;
          if (!this.specIds.has(m[0])) this.add('MEDIUM', rel, ln, 'spec-unknown', m[0] + ' is not defined in ' + pc.specDir);
        }
      }
      if (!isBacklog && this.blExists) {
        let m; this.blRe.lastIndex = 0;
        while ((m = this.blRe.exec(l)) !== null) {
          const n = Number(m[1]);
          if (!this.blRows.has(n) && !this.blRuledOut.has(n)) this.add('MEDIUM', rel, ln, 'backlog-stale', m[0] + ' is not an open backlog row (closed? delete the reference)');
        }
      }
    });
  }
}

function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.root) process.env.CLAUDE_PROJECT_DIR = path.resolve(opt.root);
  const { cfg, root } = env.loadConfig();
  const pc = env.packConfig(cfg);
  const gate = new Gate(root, cfg, pc);
  gate.collectFacts();
  let files, scope = null;
  if (opt.mode === 'all') files = listTracked(root, opt.git, cfg);
  else if (opt.mode === 'paths') { files = expandPaths(root, opt.paths); scope = new Set(files); }
  else { files = listChanged(root, opt.mode === 'staged'); scope = new Set(files); }
  files = files.filter((f) => !f.startsWith('.claude/'));
  gate.structural(scope);
  for (const f of files) gate.file(f);
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  gate.findings.sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const f of gate.findings) counts[f.severity]++;
  const fail = counts.HIGH > 0 || (opt.strict && counts.MEDIUM > 0);
  if (opt.json) {
    console.log(JSON.stringify({ root, scope: opt.mode, files: files.length, paths: files, counts, result: fail ? 'FAIL' : 'PASS', findings: gate.findings }, null, 2));
  } else {
    for (const f of gate.findings) console.log(f.severity.padEnd(7) + f.file + (f.line ? ':' + f.line : '') + '  [' + f.check + ']  ' + f.message);
    console.log('docs-gate: ' + counts.HIGH + ' HIGH, ' + counts.MEDIUM + ' MEDIUM, ' + counts.LOW + ' LOW in ' + files.length + ' files (' + opt.mode + ') -> ' + (fail ? 'FAIL' : 'PASS'));
  }
  process.exit(fail ? 1 : 0);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error('docs-gate: ' + (e && e.message ? e.message : e)); process.exit(2); }
}

module.exports = { Gate, listTracked, listChanged };
