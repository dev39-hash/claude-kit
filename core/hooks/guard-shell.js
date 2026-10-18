#!/usr/bin/env node
// PreToolUse hook, matcher: Bash|PowerShell.
// One guard for everything a shell command can break, driven by .claude/kit.config.json:
//
//   deny  - deletes of protected locations (.git/, .claude/ and its kit files, the memory mirror,
//           paths.readOnly, the project root), `git clean -x`;
//           writes, moves or copies into paths.readOnly or the kit files (mv, cp, robocopy,
//           sed -i, tee, Set-Content, Out-File, redirections);
//           an AI attribution line or a forbidden phrase in a commit message or PR body;
//           a denied e-mail or an identity override (--author, -c user.*, GIT_*_NAME/EMAIL,
//           --no-verify) on a commit; a repo-local identity that is not git.identity;
//           global or system git config writes; force push without --force-with-lease,
//           +refspec, any push or remote change when git.push is "deny";
//           git add -A / . / -u / *, git commit -a;
//           killing or launching a process named in processes.neverKill / neverLaunch;
//           on a code-page machine (encoding.codePage set) a PowerShell write into an ASCII
//           source file (Set-Content / Out-File / >), which mangles UTF-8.
//   ask   - every other push; destructive git (reset --hard, clean, checkout --, restore,
//           branch -D, rebase, amend, stash drop, tag -d, ...); kill by name; deletes outside
//           the project (Claude's temp and scratchpad excepted), of paths.localOnly, or of a
//           target that cannot be resolved statically; edits of paths.askBeforeEdit.
//   allow - everything else; no output is written (the normal permission flow continues).
//
// Commands are tokenised like a shell (quotes, ; && || |, redirections, heredocs, here-strings)
// and nested shells (bash -c, cmd /c, powershell -Command/-EncodedCommand, Invoke-Expression,
// node/python -e) are followed; cd/pushd/popd are tracked so relative targets resolve.
// Output: PreToolUse JSON with permissionDecision deny|ask and every reason. Exit code 0.
// Any internal error allows the command and says so on stderr (hooks.failMode "open").
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { run } = require('./lib/io');
const config = require('./lib/config');
const P = require('./lib/paths');
const S = require('./lib/shell');

// ---- command knowledge ---------------------------------------------------------------------
const RM_VERBS = new Set(['rm', 'rmdir', 'rd', 'del', 'erase', 'unlink', 'shred', 'truncate', 'remove-item', 'ri']);
const CMDEXE_VERBS = new Set(['del', 'erase', 'rd', 'rmdir']);
const MOVE_VERBS = new Set(['mv', 'move', 'move-item', 'mi', 'rename-item', 'ren', 'rni']);
const COPY_VERBS = new Set(['cp', 'copy', 'copy-item', 'cpi']);
const TREE_COPY_VERBS = new Set(['xcopy', 'robocopy']);
const PS_WRITE_VERBS = new Set(['set-content', 'sc', 'add-content', 'ac', 'out-file', 'new-item', 'ni',
  'clear-content', 'clc', 'tee-object']);
const KILL_VERBS = new Set(['taskkill', 'tskill', 'stop-process', 'spps', 'pkill', 'killall', 'kill']);
const LAUNCH_VERBS = new Set(['start', 'start-process', 'saps', 'invoke-item', 'ii']);
const PS_VALUE_PARAMS = new Set(['erroraction', 'ea', 'warningaction', 'wa', 'informationaction', 'ia',
  'errorvariable', 'ev', 'warningvariable', 'wv', 'outvariable', 'ov', 'outbuffer', 'ob',
  'pipelinevariable', 'pv', 'include', 'exclude', 'filter', 'credential', 'stream', 'depth', 'encoding',
  'destination', 'd', 'value', 'v', 'name', 'n', 'itemtype', 'type']);
const PS_PATH_PARAM = /^-(?:pa|pat|path|li|lit|lite|liter|litera|literal|literalp|literalpa|literalpat|literalpath|lp|psp|pspath|filepath|fp)(?::(.*))?$/i;
const PS_DEST_PARAM = /^-(?:d|de|des|dest|desti|destin|destina|destinat|destinati|destinatio|destination)(?::(.*))?$/i;
const FIND_FILTER = /^-(?:i?name|i?path|i?wholename|i?regex|type|newer\w*|[mac]time|[mac]min|size|empty|user|group|perm|links|i?lname|samefile|used)$/;
const CODE_DELETE = /rmSync|rmdirSync|unlinkSync|\.(?:rm|rmdir|unlink)\s*\(|\brmtree\b|\bos\s*\.\s*(?:remove|removedirs|rmdir|unlink)\b|\bFileUtils\b|\brm_rf?\b|\bunlink\b|\bremove_tree\b/;
const CODE_DYNAMIC = /homedir|tmpdir|process\s*\.\s*env|os\s*\.\s*environ|getenv|expanduser|__dirname|__file__|\bargv\b|\$\{|\bglob\b/i;
const CODE_NONPATH = new Set(['fs', 'os', 'path', 'child_process', 'shutil', 'utf8', 'utf-8', 'recursive',
  'force', 'node:fs', 'fs/promises', 'node:fs/promises', 'subprocess', 'sys', 'r', 'w', 'rb', 'wb']);

const GIT_OPTS = '(?:\\s+(?:-[Cc]\\s+\\S+|--[\\w-]+(?:=\\S+)?|-[A-Za-z]))*';
const RE_GIT_COMMITISH = new RegExp('(?:^|[\\s;&|(])git(?:\\.exe)?' + GIT_OPTS + '\\s+(commit|merge|tag|notes)(?=\\s|$)');
const RE_GIT_COMMIT = new RegExp('(?:^|[\\s;&|(])git(?:\\.exe)?' + GIT_OPTS + '\\s+commit(?=\\s|$)');
const RE_GH_PR = /(?:^|[\s;&|(])gh(?:\s+(?:-R\s+\S+|--repo(?:\s+|=)\S+))*\s+pr\s+(?:create|edit)(?=\s|$)/;

const ATTRIBUTION = [
  [/co-authored-by/i, 'Co-Authored-By'],
  [/generated with/i, '"Generated with"'],
  [/noreply@anthropic\.com/i, 'noreply@anthropic.com'],
  [/anthropic/i, '"Anthropic"'],
  [/\bClaude\b/, '"Claude"'],
];

function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function procRe(names) {
  const list = (names || []).map((n) => esc(String(n).replace(/\.exe$/i, '')));
  return list.length ? new RegExp('(?:^|[^A-Za-z0-9_])(' + list.join('|') + ')(?:\\.exe)?(?![A-Za-z0-9_])', 'i') : null;
}

// ---- text checks (whole command) -----------------------------------------------------------
function stripNoise(cmd) {
  return S.extractHeredocs(cmd).text
    .replace(/"(?:[^"\\]|\\[\s\S])*"/g, ' ')
    .replace(/'[^']*'/g, ' ');
}

function extractMessages(cmd, root, kind) {
  const msgs = [];
  const pr = kind === 'pr';
  const hd = S.extractHeredocs(cmd);
  for (const b of hd.bodies) msgs.push(b.body);
  let m;
  const flagNames = pr ? '(?:-b|--body)' : '(?:-[A-Za-z]*m|--message)';
  const flag = new RegExp('(?:^|\\s)' + flagNames + '(?:\\s+|=)("(?:[^"\\\\]|\\\\[\\s\\S])*"|\'[^\']*\'|[^\\s"\';&|]+)', 'g');
  while ((m = flag.exec(hd.text))) msgs.push(m[1]);
  const fileNames = pr ? '(?:-F|--body-file)' : '(?:-[A-Za-z]*F|--file)';
  const file = new RegExp('(?:^|\\s)' + fileNames + '(?:\\s+|=)("[^"]+"|\'[^\']+\'|[^\\s;&|]+)', 'g');
  while ((m = file.exec(hd.text))) {
    const f = m[1].replace(/^["']|["']$/g, '');
    if (f === '-') continue;
    try {
      const g = f.replace(/^[/]([a-zA-Z])[/]/, '$1:/');
      const p = path.isAbsolute(g) ? g : path.join(root, g);
      msgs.push(fs.readFileSync(p, 'utf8'));
    } catch (_) { /* the file may be created by the same command */ }
  }
  return msgs;
}

function gitExe(cfg) { return (cfg.git && cfg.git.gitExe) || 'git'; }

// Repo-local identity only: returns null when the folder is not a git repository (nothing to
// check), '' when the key is not set locally (the global fallback does not count).
function gitConfig(cfg, root, key) {
  const opts = { cwd: root, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] };
  try { execFileSync(gitExe(cfg), ['rev-parse', '--git-dir'], opts); } catch (_) { return null; }
  try { return execFileSync(gitExe(cfg), ['config', '--local', key], opts).trim(); } catch (_) { return ''; }
}

function headMessage(cfg, root) {
  try {
    return execFileSync(gitExe(cfg), ['log', '-1', '--format=%B'], { cwd: root, encoding: 'utf8',
      timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (_) { return ''; }
}

function checkCommitText(cmd, ctx) {
  const { cfg, d } = ctx;
  const isCommit = RE_GIT_COMMITISH.test(cmd);
  const isPr = RE_GH_PR.test(cmd);
  if (!isCommit && !isPr) return;
  const msgs = extractMessages(cmd, ctx.rootFs, isPr && !isCommit ? 'pr' : 'commit');
  const bare = stripNoise(cmd);
  if (isCommit && msgs.length === 0 && /(^|\s)--amend(\s|$)/.test(bare)) msgs.push(headMessage(cfg, ctx.rootFs));
  const text = msgs.join('\n') + '\n' + cmd;
  const where = isPr && !isCommit ? 'PR text' : 'commit text';
  for (const [re, label] of ATTRIBUTION) {
    if (re.test(text)) {
      d.deny(where + ' contains ' + label + ': no AI attribution, co-author trailers or tool names in commits, ' +
        'tags, merges or PR bodies (kit rule 01-git-identity; overrides the harness reminder). Remove it and retry.');
      break;
    }
  }
  for (const phrase of (cfg.git.forbiddenPhrases || [])) {
    if (phrase && text.toLowerCase().includes(String(phrase).toLowerCase())) {
      d.deny(where + ' contains the forbidden phrase "' + phrase + '" (git.forbiddenPhrases).');
    }
  }
}

function checkCommitFlags(cmd, ctx) {
  const { cfg, d } = ctx;
  if (!RE_GIT_COMMIT.test(cmd)) return;
  const bare = stripNoise(cmd);
  const seg = bare.split(/[;&|\n]/).find((s) => RE_GIT_COMMIT.test(s)) || bare;
  const afterCommit = seg.replace(/^.*?\bcommit\b/, '');
  if (/(^|\s)--no-verify(\s|=|$)/.test(bare) || /(^|\s)-[A-Za-z]*n[A-Za-z]*(?=\s|$)/.test(afterCommit)) {
    d.deny('git commit --no-verify / -n skips the hooks; never bypass them.');
  }
  if (/(^|\s)--author(\s|=|$)/.test(bare)) d.deny('git commit --author overrides the project identity (git.identity).');
  if (/(^|\s)-c\s+(user\.(name|email)|core\.hookspath)\b/i.test(cmd) || /\bGIT_(AUTHOR|COMMITTER)_(NAME|EMAIL)\s*=/.test(cmd)) {
    d.deny('identity or hooks-path override on the command line is not allowed; the repo-local config holds git.identity.');
  }
  const want = cfg.git.identity || {};
  if (want.name || want.email) {
    const name = gitConfig(cfg, ctx.rootFs, 'user.name');
    const email = gitConfig(cfg, ctx.rootFs, 'user.email');
    if (want.name && name !== null && name !== want.name) {
      d.deny('repo-local git config user.name is "' + name + '", must be exactly "' + want.name +
        '" (git config user.name "' + want.name + '" inside the repo; the global config does not count).');
    }
    if (want.email && email !== null && email !== want.email) {
      d.deny('repo-local git config user.email is "' + email + '", must be exactly "' + want.email +
        '" (git config user.email "' + want.email + '" inside the repo).');
    }
  }
}

function checkDeniedEmails(cmd, ctx) {
  const { cfg, d } = ctx;
  for (const e of (cfg.git.deniedEmails || [])) {
    if (!e) continue;
    const re = new RegExp(esc(e), 'i');
    if (!re.test(cmd)) continue;
    if (/GIT_(AUTHOR|COMMITTER)_EMAIL\s*=|\bgit(\.exe)?\b[^\n]*(\bcommit\b|\bconfig\b|-c\s+user\.|--author)/i.test(cmd)) {
      d.deny(e + ' must never be a git author or committer. The project identity is ' +
        (cfg.git.identity.name || '<git.identity.name>') + ' <' + (cfg.git.identity.email || 'git.identity.email') + '> (repo-local config).');
    }
  }
}

// ---- target checks -------------------------------------------------------------------------
class Guard {
  constructor(input, cfg, root) {
    this.cfg = cfg;
    this.rootFs = root;
    this.root = P.norm(root);
    this.temps = P.tempRoots(cfg);
    this.ps = String(input.tool_name || '') === 'PowerShell';
    this.cwd0 = P.norm(input.cwd || root);
    this.d = null;
    this.pendingNeverKill = false;
    this.neverKillRe = procRe(cfg.processes.neverKill);
    this.neverLaunchRe = procRe(cfg.processes.neverLaunch);
    this.protectedAbs = [];
    for (const p of [].concat(cfg.paths.protectedDelete || [], cfg.paths.readOnly || [])) {
      if (/[*?[]/.test(p)) continue;
      const s = String(p).replace(/\/+$/, '');
      this.protectedAbs.push(P.isAbsolute(s) ? P.norm(s) : P.norm(this.root + '/' + s));
    }
    this.memoryAbs = P.norm(this.root + '/' + (cfg.paths.memoryMirror || '.claude/memory'));
    this.kitAbs = ['.claude/core', '.claude/packs', '.claude/hooks', '.claude/settings.json', '.claude/kit.config.json']
      .map((s) => P.norm(this.root + '/' + s)).concat([this.memoryAbs]);
  }

  relOf(abs) { return P.rel(abs, this.root); }

  // reason string if a resolved delete target is not allowed, else null; also records ask
  checkDeleteTargets(targets, cur, opt) {
    const o = opt || {};
    for (const t0 of targets) {
      const r = P.resolveTarget(t0, cur);
      if (r.err) { this.d.ask('delete of a target that ' + r.err + '; the guard cannot check where it points.'); continue; }
      const abs = r.abs;
      if (P.inTemp(abs, this.temps)) continue;
      if (!P.under(abs, this.root)) {
        this.d.ask(r.relative
          ? 'delete with a relative target (' + t0 + ') while the working directory is outside the project (' + cur + ').'
          : 'delete outside the project folder (' + t0 + '). Outside the project nothing is deleted without the human\'s yes.');
        continue;
      }
      if (abs === this.root && !o.ancestorOk) { this.d.deny('delete of the project root itself (' + t0 + ').'); continue; }
      if (r.glob) {
        const re = P.globToRe(abs);
        const hit = this.protectedAbs.find((p) => re.test(p));
        if (hit) { this.d.deny('delete pattern matches a protected location (' + this.relOf(hit) + '): ' + t0); continue; }
      }
      const ro = P.matchAny(abs, this.root, this.cfg.paths.readOnly);
      if (ro) { this.d.deny('delete under the read-only path "' + ro + '" (' + t0 + '). paths.readOnly is never deleted.'); continue; }
      const pd = P.matchAny(abs, this.root, this.cfg.paths.protectedDelete);
      if (pd) { this.d.deny('delete of a protected location "' + pd + '" (' + t0 + '): .git/, the kit files and the memory mirror are never deleted.'); continue; }
      if (!o.ancestorOk && this.protectedAbs.some((p) => P.under(p, abs) && p !== abs)) {
        this.d.deny('delete of a folder that contains a protected location (' + t0 + ').');
        continue;
      }
      const lo = P.matchAny(abs, this.root, this.cfg.paths.localOnly);
      if (lo) this.d.ask('delete of local-only data git cannot restore ("' + lo + '": ' + t0 + '). Confirm with the human first.');
    }
    return null;
  }

  // encodes: the verb rewrites the file's bytes through the shell's code page (Set-Content,
  // Out-File, redirection), as opposed to a byte copy or move.
  checkWriteTarget(t0, cur, verb, encodes) {
    const r = P.resolveTarget(t0, cur);
    if (r.err) return;
    const abs = r.abs;
    if (!P.under(abs, this.root)) return;
    const ro = P.matchAny(abs, this.root, this.cfg.paths.readOnly);
    if (ro) { this.d.deny(verb + ' into the read-only path "' + ro + '" (' + t0 + '). paths.readOnly is never written.'); return; }
    if (this.kitAbs.some((k) => P.under(abs, k))) {
      this.d.deny(verb + ' into a kit-managed location (' + this.relOf(abs) + '): .claude/core, packs, hooks, settings, kit.config and the memory mirror are not edited from a shell.');
      return;
    }
    const ab = P.matchAny(abs, this.root, this.cfg.paths.askBeforeEdit);
    if (ab) this.d.ask(verb + ' into "' + ab + '" (' + t0 + '), which asks before any edit.');
    if (encodes && this.ps && this.cfg.encoding.codePage && P.asciiCovered(abs, this.root, this.cfg, { markdown: false })) {
      this.d.deny(verb + ' of a source file from PowerShell (' + t0 + ') on a ' + this.cfg.encoding.codePage +
        ' machine mangles UTF-8. Use the Edit/Write tools or [IO.File]::WriteAllText(path, text, (New-Object Text.UTF8Encoding $false)).');
    }
  }

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

  // positionals and named path params of a PowerShell/unix write-ish command
  parsePositionals(args, psLike) {
    const out = { positionals: [], path: [], dest: [] };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (/^-/.test(a)) {
        const pm = a.match(PS_PATH_PARAM);
        const dm = a.match(PS_DEST_PARAM);
        if (psLike && pm) { const v = pm[1] !== undefined ? pm[1] : args[++i]; if (v !== undefined) out.path.push(...String(v).split(',')); continue; }
        if (psLike && dm) { const v = dm[1] !== undefined ? dm[1] : args[++i]; if (v !== undefined) out.dest.push(v); continue; }
        const pn = a.slice(1).split(':')[0].toLowerCase();
        if (psLike && PS_VALUE_PARAMS.has(pn) && !a.includes(':')) i++;
        continue;
      }
      if (/^\/[A-Za-z]/.test(a) && !this.ps) continue; // xcopy/robocopy switches
      out.positionals.push(a);
    }
    return out;
  }

  codeCheck(code, cur) {
    if (!CODE_DELETE.test(code)) return;
    if (CODE_DYNAMIC.test(code)) { this.d.ask('inline code deletes a path computed at run time; the guard cannot check it.'); return; }
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
    if (lits.length === 0) { this.d.ask('inline code deletes a path that is not a literal; the guard cannot check it.'); return; }
    this.checkDeleteTargets(lits, cur, { ancestorOk: false });
  }

  git(args, c) {
    let i = 0;
    let dir = c.cur;
    while (i < args.length) {
      const a = args[i];
      if (a === '-C') { dir = this.resolveDirSafe(args[i + 1], dir); i += 2; continue; }
      if (a === '-c') {
        const kv = String(args[i + 1] || '');
        if (/^(user\.(name|email)|core\.hookspath)=/i.test(kv)) this.d.deny('git -c ' + kv.split('=')[0] + ' overrides the project identity or hooks path on the command line.');
        i += 2; continue;
      }
      if (/^-/.test(a)) { i++; continue; }
      break;
    }
    const sub = (args[i] || '').toLowerCase();
    const rest = args.slice(i + 1);
    const restStr = ' ' + rest.join(' ') + ' ';
    const g = this.cfg.git;

    if (sub === 'rm') {
      if (rest.includes('--cached')) return;
      const targets = rest.filter((a) => !/^-/.test(a));
      if (targets.length) this.checkDeleteTargets(targets, dir, { ancestorOk: true });
      return;
    }
    if (sub === 'clean') {
      let dry = false, ign = false;
      const targets = [];
      for (let k = 0; k < rest.length; k++) {
        const a = rest[k];
        if (a === '--dry-run') { dry = true; continue; }
        if (a === '--exclude') { k++; continue; }
        if (a.startsWith('--')) continue;
        if (a.startsWith('-')) {
          for (const ch of a.slice(1)) {
            if (ch === 'n') dry = true;
            else if (ch === 'x' || ch === 'X') ign = true;
            else if (ch === 'e') { k++; break; }
          }
          continue;
        }
        targets.push(a);
      }
      if (dry) return;
      if (ign) { this.d.deny('git clean -x/-X deletes ignored files, including the ignored .claude/ (use -fd, or -n first).'); return; }
      this.d.ask('git clean deletes untracked files; destructive git needs the human\'s explicit permission.');
      this.checkDeleteTargets(targets.length ? targets : ['.'], dir, { ancestorOk: true });
      return;
    }
    if (sub === 'push') {
      const lease = /\s--force-with-lease(=\S*)?\s/.test(restStr);
      const force = /\s(--force|-[a-zA-Z]*f[a-zA-Z]*)\s/.test(restStr) && !lease;
      const plus = /\s\+\S+/.test(restStr);
      if (g.push === 'deny') { this.d.deny('this repository is local-only (git.push = deny): never git push.'); return; }
      if (force || plus) { this.d.deny('force push without --force-with-lease (or a +refspec). A force push needs the human\'s explicit request, and then --force-with-lease.'); return; }
      if (lease) {
        if (g.forcePush === 'deny') this.d.deny('force push is not allowed in this project (git.forcePush = deny).');
        else this.d.ask('git push --force-with-lease: only on the human\'s explicit request in this conversation.');
        return;
      }
      this.d.ask('git push: push only when the human asked for it in this conversation.');
      return;
    }
    if (sub === 'remote' && /\s(add|set-url|remove|rm|rename)\s/.test(restStr)) {
      if (g.push === 'deny') this.d.deny('this repository is local-only (git.push = deny): never add or change a remote.');
      else this.d.ask('changing a git remote; confirm with the human.');
      return;
    }
    if (sub === 'add' && rest.some((a) => /^(-A|--all|-u|--update|\.|\*|:\/)$/.test(a) || /^-[a-zA-Z]*[Au][a-zA-Z]*$/.test(a))) {
      this.d.deny('stage by path: name each file (git add <path> ...). -A / . / -u / * can sweep in untracked or unrelated files.');
      return;
    }
    if (sub === 'commit') {
      if (rest.some((a) => a === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(a))) this.d.deny('git commit -a stages every tracked change. Stage by path, then commit.');
      if (rest.includes('--amend')) this.d.ask('git commit --amend rewrites the last commit; prefer a new commit. Needs the human\'s permission.');
      return;
    }
    if (sub === 'config') {
      const readOnly = /\s(--get\b|--get-all\b|--list\b|-l\s|--show-origin\b|--get-regexp\b)/.test(restStr);
      if (/\s--(global|system)\s/.test(restStr) && !readOnly) { this.d.deny('global or system git config must not change. Use repo-local config only when the human asks.'); return; }
      const m = restStr.match(/\suser\.(name|email)\s+(\S+)/i);
      if (m) {
        const want = m[1].toLowerCase() === 'name' ? g.identity.name : g.identity.email;
        const val = m[2].replace(/^["']|["']$/g, '');
        if (want && val !== want) this.d.deny('git config user.' + m[1] + ' "' + val + '" differs from the project identity (' + want + ').');
      }
      return;
    }
    const destroy = [
      [sub === 'reset' && /\s--(hard|merge|keep)\s/.test(restStr), 'git reset --hard/--merge/--keep discards work'],
      [sub === 'checkout' && rest.some((a) => /^(--|\.|-f|--force)$/.test(a)), 'git checkout -- / . / -f overwrites working-tree changes'],
      [sub === 'restore' && !rest.some((a) => /^(--staged|-S)$/.test(a)), 'git restore overwrites working-tree changes'],
      [sub === 'restore' && rest.some((a) => /^(--worktree|-W)$/.test(a)), 'git restore --worktree overwrites working-tree changes'],
      [sub === 'switch' && rest.some((a) => /^(-f|--force|--discard-changes)$/.test(a)), 'git switch --discard-changes overwrites working-tree changes'],
      [sub === 'branch' && (rest.includes('-D') || (rest.some((a) => /^(-d|--delete)$/.test(a)) && rest.some((a) => /^(-f|--force)$/.test(a)))), 'git branch -D deletes an unmerged branch'],
      [sub === 'stash' && rest.some((a) => /^(drop|clear)$/.test(a)), 'git stash drop/clear loses stashed work'],
      [sub === 'rebase', 'git rebase rewrites history'],
      [sub === 'filter-branch' || sub === 'filter-repo', 'history rewrite'],
      [sub === 'update-ref' && rest.includes('-d'), 'git update-ref -d deletes a ref'],
      [sub === 'tag' && rest.some((a) => /^(-d|--delete)$/.test(a)), 'git tag -d deletes a tag'],
      [sub === 'worktree' && rest[0] === 'remove' && rest.some((a) => /^(--force|-f)$/.test(a)), 'git worktree remove --force discards a worktree\'s changes'],
      [sub === 'reflog' && rest.some((a) => /^(expire|delete)$/.test(a)), 'reflog expiry removes the recovery path'],
      [sub === 'gc' && rest.some((a) => /^--prune/.test(a)), 'git gc --prune removes unreachable objects'],
    ];
    for (const [hit, why] of destroy) {
      if (hit) { this.d.ask(why + '. Destructive git commands need the human\'s explicit permission.'); return; }
    }
  }

  resolveDirSafe(t, cur) {
    if (t === undefined) return null;
    const r = P.resolveTarget(t, cur);
    return r.err ? null : r.abs;
  }

  find(args, c) {
    let i = 0;
    while (i < args.length && /^-[HLP]$|^-[DO]/.test(args[i])) i++;
    const starts = [];
    while (i < args.length && !/^(-|\(|\)|!|,)/.test(args[i])) starts.push(args[i++]);
    const expr = args.slice(i);
    let del = expr.includes('-delete');
    for (let k = 0; k < expr.length - 1; k++) {
      if (/^-(exec|execdir|ok|okdir)$/.test(expr[k]) && RM_VERBS.has(S.base(expr[k + 1]))) del = true;
    }
    if (!del) return;
    const filtered = expr.some((a) => FIND_FILTER.test(a));
    const roots = starts.length ? starts : ['.'];
    this.checkDeleteTargets(roots, c.cur, { ancestorOk: filtered });
    if (filtered) {
      for (const t of roots) {
        const r = P.resolveTarget(t, c.cur);
        if (r.err) continue;
        const covered = this.protectedAbs.find((p) => P.under(p, r.abs) && p !== r.abs);
        if (covered) {
          this.d.ask('find -delete / -exec rm walks a tree that contains a protected location (' + this.relOf(covered) +
            '); narrow the start directory or exclude it with -path ... -prune.');
          break;
        }
      }
    }
  }

  kill(name, args, c) {
    const joined = args.join(' ');
    if (this.neverKillRe && (this.neverKillRe.test(joined) || (this.pendingNeverKill && c.piped))) {
      this.d.deny('never launch or kill ' + (this.cfg.processes.neverKill || []).join(', ') +
        ' (processes.neverKill): the human may be using them. If one blocks a link or a test, stop and tell the human.');
      return;
    }
    const lower = joined.toLowerCase();
    let byName;
    if (name === 'taskkill' || name === 'tskill') byName = /(^|\s)\/im(\s|$)/.test(lower) || (name === 'tskill' && !/^\s*\d+/.test(lower));
    else if (name === 'pkill' || name === 'killall') byName = true;
    else if (name === 'kill') byName = args.filter((a) => !/^-/.test(a)).some((a) => !/^%?\d+$/.test(a));
    else byName = !/(^|\s)-id\b/.test(lower) && !/\$_\.id|\.id\b/.test(lower) && !(c.piped && this.lastGetProcessById);
    if (byName) {
      this.d.ask('killing processes by name can hit another project\'s processes. Kill only processes this session started, by PID.');
    }
  }

  launch(name, args) {
    if (!this.neverLaunchRe) return;
    const hit = this.neverLaunchRe.test(name) || (LAUNCH_VERBS.has(name) && this.neverLaunchRe.test(args.join(' ')));
    if (hit) this.d.deny('never launch ' + (this.cfg.processes.neverLaunch || []).join(', ') + ' (processes.neverLaunch): the human runs them.');
  }

  command(c) {
    const { name, args, redirects } = c;
    for (const w of c.words) {
      const m = w.match(/^\[(?:system\.)?io\.(?:file|directory)\]::delete\((.*)$/i);
      if (m) this.checkDeleteTargets([m[1].replace(/\)\s*$/, '').split(',')[0]], c.cur, { ancestorOk: false });
    }
    for (const r of redirects) this.checkWriteTarget(r, c.cur, 'shell redirection', true);
    if (!name) return null;

    if (name === 'get-process' || name === 'gps' || name === 'ps') {
      this.pendingNeverKill = !!(this.neverKillRe && this.neverKillRe.test(args.join(' ')));
      this.lastGetProcessById = /(^|\s)-id\b/i.test(args.join(' '));
      return null;
    }
    if (KILL_VERBS.has(name)) { this.kill(name, args, c); return null; }
    if (/^wmic$/.test(name) && /\bdelete\b/i.test(args.join(' '))) { this.kill('wmic', args, c); return null; }
    if (!c.piped) { this.pendingNeverKill = false; this.lastGetProcessById = false; }
    this.launch(name, args);

    if (RM_VERBS.has(name)) {
      const targets = this.parseDeleteArgs(name, args);
      if (c.xargs) { this.d.ask('delete takes its targets from xargs; the guard cannot check them.'); return null; }
      if (targets.length === 0) { if (c.piped) this.d.ask('delete takes its targets from a pipeline; the guard cannot check them.'); return null; }
      this.checkDeleteTargets(targets, c.cur, { ancestorOk: false });
      return null;
    }
    if (name === 'git') { this.git(args, c); return null; }
    if (name === 'find') { this.find(args, c); return null; }
    if (name === 'cmake') {
      const k = args.findIndex((a) => a === '-E' || a === '-e');
      if (k >= 0 && ['rm', 'remove', 'remove_directory'].includes(args[k + 1])) {
        this.checkDeleteTargets(args.slice(k + 2).filter((a) => !/^-/.test(a)), c.cur, { ancestorOk: false });
      }
      return null;
    }
    const psLike = this.ps || /-item$|^(mi|cpi|rni|ni|sc|ac|clc)$/.test(name);
    if (MOVE_VERBS.has(name) || COPY_VERBS.has(name)) {
      const p = this.parsePositionals(args, psLike);
      const dest = p.dest.length ? p.dest : p.positionals.length >= 2 ? [p.positionals[p.positionals.length - 1]] : [];
      for (const t of dest) this.checkWriteTarget(t, c.cur, name);
      if (MOVE_VERBS.has(name)) {
        const srcs = p.path.length ? p.path : p.positionals.slice(0, Math.max(0, p.positionals.length - 1));
        this.checkDeleteTargets(srcs, c.cur, { ancestorOk: false });
      }
      return null;
    }
    if (TREE_COPY_VERBS.has(name)) {
      const pos = args.filter((a) => !/^\//.test(a));
      if (pos[1]) {
        this.checkWriteTarget(pos[1], c.cur, name);
        if (/\/(mir|purge)\b/i.test(args.join(' '))) this.checkDeleteTargets([pos[1]], c.cur, { ancestorOk: false });
      }
      return null;
    }
    if (name === 'sed' && args.some((a) => /^-[a-zA-Z]*i/.test(a) || a === '--in-place')) {
      const pos = args.filter((a) => !/^-/.test(a));
      const hasScriptFlag = args.some((a) => /^(-e|-f|--expression|--file)$/.test(a));
      const files = hasScriptFlag ? pos.filter((a) => !args.some((x, k) => /^(-e|-f|--expression|--file)$/.test(x) && args[k + 1] === a)) : pos.slice(1);
      for (const f of files) this.checkWriteTarget(f, c.cur, 'sed -i');
      return null;
    }
    if (name === 'tee' || name === 'tee-object') {
      const p = this.parsePositionals(args.filter((a) => a !== '-a'), psLike);
      for (const t of p.path.concat(p.positionals)) this.checkWriteTarget(t, c.cur, name, true);
      return null;
    }
    if (PS_WRITE_VERBS.has(name)) {
      const p = this.parsePositionals(args, true);
      const targets = p.path.length ? p.path : p.positionals.slice(0, 1);
      for (const t of targets) if (t) this.checkWriteTarget(t, c.cur, name, true);
      return null;
    }
    return null;
  }
}

function main(input, d) {
  const cmd = String((input.tool_input && input.tool_input.command) || '');
  if (!cmd) return;
  const { cfg, root } = config.load(input);
  const g = new Guard(input, cfg, root);
  g.d = d;
  const ctx = { cfg, d, rootFs: root };
  checkCommitText(cmd, ctx);
  checkCommitFlags(cmd, ctx);
  checkDeniedEmails(cmd, ctx);
  S.walk(cmd, {
    ps: g.ps,
    cwd: g.cwd0,
    visitor: {
      command: (c) => g.command(c),
      code: (code, cur) => g.codeCheck(code, cur),
    },
  });
}

module.exports = { main };

if (require.main === module) run('guard-shell', main, { failMode: 'open' });
