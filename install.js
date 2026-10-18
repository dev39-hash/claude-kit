#!/usr/bin/env node
// claude-kit installer.
//
//   node install.js --target <project root> [--packs a,b] [--name <project name>]
//                   [--update] [--dry-run] [--force] [--add-exclude] [--test] [--list-packs]
//
// What it does (see core/workflow/PORTING.md):
//   1. copies core/ and the chosen packs/ into <target>/.claude/ (kit-managed, never edited there);
//   2. activates them where Claude Code looks: rules/, agents/, skills/, commands/, hooks/
//      (plus tools/<pack>/ and a pack's references/ next to the skills);
//   3. writes settings.json (hooks via $CLAUDE_PROJECT_DIR, timeouts from the config; with the
//      hooks-powershell pack the Node hook entries are left out and hooks.runtime is set),
//      kit.config.json (defaults + name + packs; kept when present), kit.config.schema.json;
//   4. creates the project layer from the templates (context, rules, task-classification,
//      definition-of-done, build-env), docs/{plan,adr,briefs,notes}, decisions.md, lessons.md,
//      tasks/{active,done}, memory/, scratch/, and CLAUDE.md from the template -
//      all of these only when absent (never overwritten, even with --update);
//   5. records every kit-managed path in .claude/kit.manifest.json so --update can remove
//      activated files the kit no longer ships.
// --update re-copies core/packs and re-activates; --force also rewrites CLAUDE.md and
// settings.json; --dry-run prints the plan; --add-exclude appends ".claude/" to
// .git/info/exclude when the folder is not ignored; --test runs the hook tests afterwards.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const KIT = __dirname;
const DEFAULTS = require(path.join(KIT, 'core', 'hooks', 'lib', 'config.js')).DEFAULTS;
let KIT_VERSION = DEFAULTS.kitVersion;
try { KIT_VERSION = JSON.parse(fs.readFileSync(path.join(KIT, 'package.json'), 'utf8')).version || KIT_VERSION; } catch (_) { /* optional */ }

// ---- args ------------------------------------------------------------------------------------
function parseArgs(argv) {
  const a = { packs: [], update: false, dry: false, force: false, addExclude: false, test: false, list: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    const val = () => argv[++i];
    if (x === '--target') a.target = val();
    else if (x.startsWith('--target=')) a.target = x.slice(9);
    else if (x === '--packs') a.packs = a.packs.concat(String(val() || '').split(',').map((s) => s.trim()).filter(Boolean));
    else if (x.startsWith('--packs=')) a.packs = a.packs.concat(x.slice(8).split(',').map((s) => s.trim()).filter(Boolean));
    else if (x === '--name') a.name = val();
    else if (x.startsWith('--name=')) a.name = x.slice(7);
    else if (x === '--update') a.update = true;
    else if (x === '--dry-run') a.dry = true;
    else if (x === '--force') a.force = true;
    else if (x === '--add-exclude') a.addExclude = true;
    else if (x === '--test') a.test = true;
    else if (x === '--list-packs') a.list = true;
    else if (x === '-h' || x === '--help') a.help = true;
    else { console.error('unknown argument: ' + x); a.help = true; }
  }
  return a;
}

function usage() {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 22).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
}

// ---- helpers ---------------------------------------------------------------------------------
class Installer {
  constructor(opts) {
    this.o = opts;
    this.target = path.resolve(opts.target);
    this.claude = path.join(this.target, '.claude');
    this.written = [];
    this.skipped = [];
    this.managed = new Set();
    this.log = [];
  }

  rel(p) { return path.relative(this.target, p).replace(/\\/g, '/'); }
  note(msg) { this.log.push(msg); }

  exists(p) { return fs.existsSync(p); }

  writeFile(p, content, opts) {
    const o = opts || {};
    const relp = this.rel(p);
    if (o.managed) this.managed.add(relp);
    if (this.exists(p) && !o.overwrite) { this.skipped.push(relp); return false; }
    if (!this.o.dry) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); }
    this.written.push(relp);
    return true;
  }

  copyFile(src, dst, opts) {
    return this.writeFile(dst, fs.readFileSync(src), Object.assign({ overwrite: true, managed: true }, opts || {}));
  }

  copyTree(src, dst, filter) {
    if (!this.exists(src)) return;
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, e.name), d = path.join(dst, e.name);
      if (e.isDirectory()) this.copyTree(s, d, filter);
      else if (!filter || filter(s)) this.copyFile(s, d);
    }
  }

  mkdir(p) {
    const relp = this.rel(p);
    if (this.exists(p)) return;
    if (!this.o.dry) fs.mkdirSync(p, { recursive: true });
    this.written.push(relp + '/');
  }

  listPacks() {
    const dir = path.join(KIT, 'packs');
    if (!this.exists(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  }

  packDir(name) { return path.join(KIT, 'packs', name); }

  // ---- steps --------------------------------------------------------------------------------
  loadOrCreateConfig() {
    const file = path.join(this.claude, 'kit.config.json');
    let cfg = null;
    if (this.exists(file)) {
      // keep the project's file as written (it may be a hand-written subset); work on the merged view
      let raw;
      try { raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(new RegExp('^' + String.fromCharCode(0xFEFF)), '')); } catch (e) { throw new Error('kit.config.json is not valid JSON: ' + e.message); }
      if (!raw || typeof raw !== 'object') throw new Error('kit.config.json must hold a JSON object');
      raw.packs = [...new Set((raw.packs || []).concat(this.o.packs))];
      raw.project = raw.project || {};
      if (this.o.name && !raw.project.name) raw.project.name = this.o.name;
      raw.kitVersion = KIT_VERSION;
      if (raw.packs.includes('hooks-powershell')) raw.hooks = Object.assign({}, raw.hooks || {}, { runtime: 'powershell' });
      this.writeFile(file, JSON.stringify(raw, null, 2) + '\n', { overwrite: true });
      cfg = require(path.join(KIT, 'core', 'hooks', 'lib', 'config.js')).merge(JSON.parse(JSON.stringify(DEFAULTS)), raw);
    } else {
      cfg = JSON.parse(JSON.stringify(DEFAULTS));
      cfg.kitVersion = KIT_VERSION;
      cfg.project.name = this.o.name || path.basename(this.target);
      cfg.packs = [...new Set(this.o.packs)];
      if (cfg.packs.includes('hooks-powershell')) cfg.hooks.runtime = 'powershell';
      this.writeFile(file, JSON.stringify(cfg, null, 2) + '\n');
    }
    this.cfg = cfg;
    return cfg;
  }

  installCore() {
    this.copyTree(path.join(KIT, 'core'), path.join(this.claude, 'core'));
    this.copyFile(path.join(KIT, 'kit.config.schema.json'), path.join(this.claude, 'kit.config.schema.json'));
  }

  installPacks() {
    const available = this.listPacks();
    for (const p of this.cfg.packs) {
      if (!available.includes(p)) { this.note('WARNING: pack "' + p + '" not found under packs/ (available: ' + (available.join(', ') || 'none') + '); skipped'); continue; }
      this.copyTree(this.packDir(p), path.join(this.claude, 'packs', p));
    }
  }

  activate() {
    const layers = [{ name: 'core', dir: path.join(KIT, 'core') }]
      .concat(this.cfg.packs.filter((p) => this.exists(this.packDir(p))).map((p) => ({ name: p, dir: this.packDir(p) })));
    for (const L of layers) {
      const isPack = L.name !== 'core';
      // rules: core flat, packs under rules/<pack>/
      this.copyTree(path.join(L.dir, 'rules'), isPack ? path.join(this.claude, 'rules', L.name) : path.join(this.claude, 'rules'));
      // agents, commands: flat; a pack file with the same name overrides core (noted)
      for (const kind of ['agents', 'commands']) {
        const src = path.join(L.dir, kind);
        if (!this.exists(src)) continue;
        for (const f of fs.readdirSync(src)) {
          const dst = path.join(this.claude, kind, f);
          if (isPack && this.managed.has(this.rel(dst))) this.note('pack "' + L.name + '" overrides ' + kind + '/' + f);
          this.copyFile(path.join(src, f), dst);
        }
      }
      // skills: one folder per skill
      const sk = path.join(L.dir, 'skills');
      if (this.exists(sk)) {
        for (const e of fs.readdirSync(sk, { withFileTypes: true })) {
          if (!e.isDirectory()) continue;
          const dst = path.join(this.claude, 'skills', e.name);
          if (isPack && this.exists(dst) && this.managed.has(this.rel(path.join(dst, 'SKILL.md')))) this.note('pack "' + L.name + '" overrides skill ' + e.name);
          this.copyTree(path.join(sk, e.name), dst);
        }
      }
      // hooks: core flat (lib/, scripts, tests), packs under hooks/<pack>/
      const hk = path.join(L.dir, 'hooks');
      if (this.exists(hk)) {
        this.copyTree(hk, isPack ? path.join(this.claude, 'hooks', L.name) : path.join(this.claude, 'hooks'),
          (f) => !/settings\.(template|fragment)\.json$/.test(f));
      }
      // tools: packs under tools/<pack>/ (a pack may also put a top-level alias in its README)
      const tl = path.join(L.dir, 'tools');
      if (this.exists(tl)) this.copyTree(tl, isPack ? path.join(this.claude, 'tools', L.name) : path.join(this.claude, 'tools'));
      // references: flat, so a skill's ../../references/<file>.md link resolves from .claude/skills/<skill>/
      const rf = path.join(L.dir, 'references');
      if (this.exists(rf)) this.copyTree(rf, path.join(this.claude, 'references'));
    }
  }

  // The hooks-powershell pack replaces the core Node hooks on machines without Node.
  get psRuntime() {
    return (this.cfg.hooks && this.cfg.hooks.runtime === 'powershell') || this.cfg.packs.includes('hooks-powershell');
  }

  writeSettings() {
    const file = path.join(this.claude, 'settings.json');
    const tpl = JSON.parse(fs.readFileSync(path.join(KIT, 'core', 'hooks', 'settings.template.json'), 'utf8'));
    delete tpl._comment;
    const t = (this.cfg.hooks && this.cfg.hooks.timeoutSeconds) || {};
    const timeoutFor = (cmd) => /format\.js/.test(cmd) ? (t.format || 30) : /sync-memory\.js/.test(cmd) ? (t.stop || 15) : (t.guard || 10);
    for (const ev of Object.keys(tpl.hooks)) for (const entry of tpl.hooks[ev]) for (const h of entry.hooks) h.timeout = timeoutFor(h.command);
    if (this.psRuntime) {
      // no Node on this machine: drop the core Node hook entries; the pack fragment wires the .ps1 twins
      for (const ev of Object.keys(tpl.hooks)) {
        tpl.hooks[ev] = tpl.hooks[ev].map((entry) => Object.assign({}, entry, { hooks: entry.hooks.filter((h) => !/^node\s/.test(String(h.command))) })).filter((entry) => entry.hooks.length);
        if (!tpl.hooks[ev].length) delete tpl.hooks[ev];
      }
      tpl.permissions.allow = tpl.permissions.allow.filter((p) => !/^Bash\(node /.test(p));
    }
    // pack fragments: packs/<p>/hooks/settings.fragment.json {"hooks": {...}, "permissions": {"allow": [...]}}
    for (const p of this.cfg.packs) {
      const frag = path.join(this.packDir(p), 'hooks', 'settings.fragment.json');
      if (!this.exists(frag)) continue;
      const f = JSON.parse(fs.readFileSync(frag, 'utf8'));
      const psExe = p === 'hooks-powershell' && this.cfg.packConfig && this.cfg.packConfig[p] && this.cfg.packConfig[p].exe;
      for (const ev of Object.keys(f.hooks || {})) {
        tpl.hooks[ev] = (tpl.hooks[ev] || []).concat(f.hooks[ev].map((entry) => {
          const out = { hooks: entry.hooks.map((h) => {
            let command = h.command.replace('{{pack}}', '$CLAUDE_PROJECT_DIR/.claude/hooks/' + p);
            if (psExe) command = command.replace(/^powershell\s/, psExe + ' ');
            return Object.assign({}, h, { command, timeout: h.timeout || t.guard || 10 });
          }) };
          if (entry.matcher) out.matcher = entry.matcher;
          return out;
        }));
      }
      if (f.permissions && f.permissions.allow) tpl.permissions.allow = tpl.permissions.allow.concat(f.permissions.allow);
    }
    tpl.permissions.allow = [...new Set(tpl.permissions.allow)];
    let out = tpl;
    if (this.exists(file) && !this.o.force) {
      // keep the user's own permissions and any hook entry that is not kit-managed
      let existing = {};
      try { existing = JSON.parse(fs.readFileSync(file, 'utf8').replace(new RegExp('^' + String.fromCharCode(0xFEFF)), '')); } catch (_) { existing = {}; }
      out = Object.assign({}, existing, tpl);
      const allow = new Set([].concat((existing.permissions && existing.permissions.allow) || [], tpl.permissions.allow));
      out.permissions = Object.assign({}, existing.permissions || {}, tpl.permissions, { allow: [...allow] });
      out.hooks = Object.assign({}, existing.hooks || {}, tpl.hooks);
      for (const ev of Object.keys(existing.hooks || {})) {
        const custom = existing.hooks[ev].filter((entry) => !(entry.hooks || []).some((h) => /\.claude\/hooks\//.test(String(h.command))));
        out.hooks[ev] = (tpl.hooks[ev] || []).concat(custom);
      }
    }
    this.writeFile(file, JSON.stringify(out, null, 2) + '\n', { overwrite: true });
  }

  createProjectLayer() {
    const T = path.join(KIT, 'core', 'templates');
    const name = this.cfg.project.name || '<project name>';
    const fill = (f) => fs.readFileSync(path.join(T, f), 'utf8').replace(/<project name>/g, name);
    const map = [
      ['project-context.md', 'project/context.md'],
      ['project-rules.md', 'project/rules.md'],
      ['task-classification.md', 'project/task-classification.md'],
      ['definition-of-done.md', 'project/definition-of-done.md'],
      ['build-env.md', 'project/build-env.md'],
      ['decisions.md', 'docs/decisions.md'],
      ['lessons.md', 'docs/lessons.md'],
      ['adr.md', 'docs/adr/template.md'],
    ];
    for (const [src, dst] of map) this.writeFile(path.join(this.claude, dst), fill(src));
    this.writeFile(path.join(this.claude, 'docs', 'adr', 'README.md'),
      '# Architecture decision records\n\nNot tracked in git. Format and workflow: the `architecture-decision-records` skill.\n' +
      'Copy `template.md` to `NNNN-short-title.md`, then add a row here.\n\n| ADR | Title | Status | Date |\n|---|---|---|---|\n');
    for (const d of ['docs/plan', 'docs/briefs', 'docs/notes', 'tasks/active', 'tasks/done', 'scratch']) this.mkdir(path.join(this.claude, d));
    // the memory mirror lives where paths.memoryMirror says (default .claude/memory)
    const mirror = String((this.cfg.paths && this.cfg.paths.memoryMirror) || '.claude/memory').replace(/\\/g, '/').replace(/\/+$/, '');
    this.mkdir(path.resolve(this.target, mirror));
  }

  writeClaudeMd() {
    const file = path.join(this.claude, 'CLAUDE.md');
    const cfg = this.cfg;
    const packs = cfg.packs.filter((p) => this.exists(this.packDir(p)));
    const packSkills = [], packCommands = [], packHooks = [];
    for (const p of packs) {
      const sk = path.join(this.packDir(p), 'skills');
      if (this.exists(sk)) for (const e of fs.readdirSync(sk, { withFileTypes: true })) if (e.isDirectory()) packSkills.push('`' + e.name + '`');
      const cm = path.join(this.packDir(p), 'commands');
      if (this.exists(cm)) for (const f of fs.readdirSync(cm)) packCommands.push('`/' + f.replace(/\.md$/, '') + '`');
      const hk = path.join(this.packDir(p), 'hooks');
      if (this.exists(hk)) for (const f of fs.readdirSync(hk)) if (/\.(js|ps1)$/.test(f) && !/^(test|lib)/.test(f)) packHooks.push('`' + p + '/' + f.replace(/\.(js|ps1)$/, '') + '`');
    }
    let text = fs.readFileSync(path.join(KIT, 'core', 'CLAUDE.template.md'), 'utf8')
      .replace(/\{\{project\.name\}\}/g, cfg.project.name || path.basename(this.target))
      .replace(/\{\{project\.description\}\}/g, cfg.project.description || '<one paragraph: what this project is; keep the detail in .claude/project/context.md>')
      .replace(/\{\{models\.worker\}\}/g, cfg.models.worker)
      .replace(/\{\{models\.reviewer\}\}/g, cfg.models.reviewer)
      .replace(/\{\{packSkills\}\}/g, packSkills.length ? ', ' + packSkills.join(', ') : '')
      .replace(/\{\{packCommands\}\}/g, packCommands.length ? ', ' + packCommands.join(', ') : '')
      .replace(/\{\{hooksBlock\}\}/g, this.psRuntime
        ? 'PowerShell hooks (no Node on this machine): `hooks-powershell/guard-shell` (push policy, destructive git,\n' +
          'identity, attribution, kills, protected deletes, PowerShell writes into sources), `hooks-powershell/subagent-model-guard`\n' +
          '(models, no fork), Stop: `hooks-powershell/sync-memory`' +
          (packHooks.filter((h) => !/hooks-powershell/.test(h)).length ? '. Not wired (Node): ' + packHooks.filter((h) => !/hooks-powershell/.test(h)).join(', ') : '') + '.'
        : 'Pre: `guard-shell` (deletes, destructive git, identity, attribution, kills), `guard-edit`\n' +
          '(read-only paths, forbidden tree files, ASCII, kit files), `subagent-model-guard` (models,\n' +
          'no fork). Post: `format` (only with a formatter config)' + (packHooks.length ? ', ' + packHooks.join(', ') : '') + '. Stop: `sync-memory`.')
      .replace(/\{\{hooksTest\}\}/g, this.psRuntime
        ? 'powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/hooks-powershell/test-hooks.ps1'
        : 'node .claude/hooks/test-hooks.js')
      .replace(/\{\{packs\}\}/g, packs.length ? packs.map((p) => '`' + p + '`').join(', ') : 'none')
      .replace(/\{\{buildBlock\}\}/g, 'Exact commands: `.claude/project/build-env.md` (copy from a run that worked). Summary:\n\n```bash\n<configure>\n<build>\n<test>\n```')
      .replace(/\{\{projectNotes\}\}/g, '<10-20 lines: read-first list for this repo, module map, what is in flight. No status paragraphs with hashes or dates; those live in project/context.md and the task files.>');
    this.writeFile(file, text, { overwrite: this.o.force });
  }

  cleanStale() {
    const file = path.join(this.claude, 'kit.manifest.json');
    let old = [];
    if (this.exists(file)) { try { old = JSON.parse(fs.readFileSync(file, 'utf8')).files || []; } catch (_) { old = []; } }
    const stale = old.filter((p) => !this.managed.has(p) && /^\.claude\/(core|packs|rules|agents|skills|commands|hooks|tools|references)\//.test(p));
    for (const p of stale) {
      const abs = path.join(this.target, p);
      if (!this.exists(abs)) continue;
      if (!this.o.dry) fs.unlinkSync(abs);
      this.note('removed stale kit file ' + p);
    }
    this.writeFile(file, JSON.stringify({ kitVersion: KIT_VERSION, installed: new Date().toISOString(), files: [...this.managed].sort() }, null, 2) + '\n', { overwrite: true });
  }

  checkGitIgnore() {
    const gitDir = path.join(this.target, '.git');
    if (!this.exists(gitDir)) { this.note('not a git repository yet: after git init, make sure .claude/ is ignored (global gitignore or .git/info/exclude)'); return; }
    const git = (this.cfg.git && this.cfg.git.gitExe) || 'git';
    let ignored = false;
    try {
      execFileSync(git, ['check-ignore', '-q', '.claude'], { cwd: this.target, stdio: 'ignore' });
      ignored = true;
    } catch (_) { ignored = false; }
    if (ignored) {
      this.note('.claude/ is ignored by git');
      // rule 02: the repo carries no trace of the agent workspace; the ignore belongs in the global gitignore
      const gi = path.join(this.target, '.gitignore');
      try {
        if (this.exists(gi) && fs.readFileSync(gi, 'utf8').split(/\r?\n/).some((l) => /^\s*\/?\.claude\/?\s*(#.*)?$/.test(l))) {
          this.note('WARNING: the tracked .gitignore lists .claude/; rule 02-repo-hygiene keeps the agent workspace out of tracked text. Prefer the global gitignore (or .git/info/exclude) and drop that line in a docs-class task.');
        }
      } catch (_) { /* unreadable .gitignore: nothing to say */ }
      return;
    }
    if (this.o.addExclude) {
      const ex = path.join(gitDir, 'info', 'exclude');
      if (!this.o.dry) { fs.mkdirSync(path.dirname(ex), { recursive: true }); fs.appendFileSync(ex, (this.exists(ex) && !fs.readFileSync(ex, 'utf8').endsWith('\n') ? '\n' : '') + '.claude/\n'); }
      this.note('appended ".claude/" to .git/info/exclude');
    } else {
      this.note('WARNING: .claude/ is NOT ignored by git. Add ".claude/" to your global gitignore or re-run with --add-exclude (writes .git/info/exclude; never the repo .gitignore).');
    }
  }

  run() {
    if (!this.o.update && this.exists(path.join(this.claude, 'kit.manifest.json'))) {
      throw new Error('the kit is already installed in ' + this.claude + '; use --update to refresh core/packs (project files are kept)');
    }
    this.loadOrCreateConfig();
    this.installCore();
    this.installPacks();
    this.activate();
    this.writeSettings();
    this.createProjectLayer();
    this.writeClaudeMd();
    this.cleanStale();
    this.checkGitIgnore();
  }

  report() {
    const w = this.written.filter((p) => !/^\.claude\/(core|packs)\//.test(p));
    const coreCount = this.written.length - w.length;
    console.log((this.o.dry ? '[dry-run] ' : '') + 'claude-kit ' + KIT_VERSION + ' -> ' + this.claude);
    console.log('  kit-managed copies (core/, packs/): ' + coreCount + ' files');
    console.log('  activated / generated: ' + w.length + ' files');
    for (const p of w) console.log('    + ' + p);
    if (this.skipped.length) { console.log('  kept (already present, not overwritten): ' + this.skipped.length); for (const p of this.skipped) console.log('    = ' + p); }
    for (const n of this.log) console.log('  ' + n);
    console.log('\nNext (core/workflow/PORTING.md):');
    console.log('  1. fill .claude/kit.config.json (identity, denied emails, read-only paths, processes, ASCII lists, models, packs)');
    console.log('  2. fill .claude/project/{context,rules,task-classification,definition-of-done,build-env}.md');
    console.log('  3. edit .claude/CLAUDE.md project lines; make sure .claude/ is ignored');
    if (this.psRuntime) {
      const exe = (this.cfg.packConfig && this.cfg.packConfig['hooks-powershell'] && this.cfg.packConfig['hooks-powershell'].exe) || 'powershell';
      console.log('  4. ' + exe + ' -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/hooks-powershell/test-hooks.ps1   (must be 0 failures; hooks.runtime = powershell, no Node hooks wired)');
    }
    else console.log('  4. node .claude/hooks/test-hooks.js   (must be 0 failures)');
    console.log('  5. dry-run one small task through both gates');
  }
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) { usage(); return 0; }
  if (o.list) {
    const i = new Installer({ target: process.cwd(), packs: [] });
    const packs = i.listPacks();
    console.log(packs.length ? packs.join('\n') : '(no packs yet)');
    return 0;
  }
  if (!o.target) { usage(); console.error('\n--target is required'); return 2; }
  if (!fs.existsSync(o.target)) { console.error('target does not exist: ' + o.target); return 2; }
  const inst = new Installer(o);
  inst.run();
  inst.report();
  if (o.test && !o.dry) {
    const env = Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: inst.target });
    if (inst.psRuntime) {
      const exe = (inst.cfg.packConfig && inst.cfg.packConfig['hooks-powershell'] && inst.cfg.packConfig['hooks-powershell'].exe) || 'powershell';
      const script = path.join(inst.claude, 'hooks', 'hooks-powershell', 'test-hooks.ps1');
      console.log('\nRunning PowerShell hook tests (' + exe + ')...');
      const r = spawnSync(exe, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], { stdio: 'inherit', env });
      if (r.error) { console.log('  ' + exe + ' not found here; run on the target machine: ' + exe + ' -NoProfile -ExecutionPolicy Bypass -File ' + script); return 0; }
      return r.status || 0;
    }
    console.log('\nRunning hook tests...');
    const r = spawnSync(process.execPath, [path.join(inst.claude, 'hooks', 'test-hooks.js')], { stdio: 'inherit', env });
    return r.status || 0;
  }
  return 0;
}

try { process.exitCode = main(); } catch (err) {
  console.error('install.js: ' + (err && err.message ? err.message : err));
  process.exitCode = 1;
}
