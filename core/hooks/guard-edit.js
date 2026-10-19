#!/usr/bin/env node
// PreToolUse hook, matcher: Edit|Write|MultiEdit|NotebookEdit.
// Driven by .claude/kit.config.json:
//   deny - edits under paths.readOnly;
//          edits of kit-managed files: .claude/core/, .claude/packs/, .claude/hooks/ always, plus
//          every path .claude/kit.manifest.json lists (the activated copies under .claude/rules/,
//          agents/, skills/, commands/, tools/, references/); improvements go to the kit and are
//          re-installed; project-written files in those folders stay editable; the memory mirror
//          is written by the Stop hook only;
//          a file named in paths.forbiddenTreeFiles (CLAUDE.md, AGENTS.md, AGENT.md) anywhere in
//          the project outside .claude/;
//          a non-ASCII character written into a file the ASCII rule covers (encoding.*).
//   ask  - edits under paths.askBeforeEdit; edits of .claude/settings.json and kit.config.json.
// Files outside the project are not this hook's business. Any internal error allows the edit.
'use strict';

const fs = require('fs');
const path = require('path');
const { run } = require('./lib/io');
const config = require('./lib/config');
const P = require('./lib/paths');

// Paths install.js wrote (kit.manifest.json "files"), lower-cased with forward slashes.
function managedPaths(rootFs) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(rootFs, '.claude', 'kit.manifest.json'), 'utf8'));
    return new Set((m.files || []).map((f) => String(f).replace(/\\/g, '/').toLowerCase()));
  } catch (_) { return new Set(); }
}

function main(input, d) {
  const ti = input.tool_input || {};
  const target = String(ti.file_path || ti.notebook_path || ti.path || '');
  if (!target) return;
  const { cfg, root: rootFs } = config.load(input);
  const root = P.norm(rootFs);
  const cwd = P.norm(input.cwd || rootFs);
  const abs = P.isAbsolute(target) ? P.norm(target) : P.norm(cwd + '/' + target);
  if (!P.under(abs, root)) return;
  const rel = P.rel(abs, root);
  const inClaude = rel.startsWith('.claude/');

  const ro = P.matchAny(abs, root, cfg.paths.readOnly);
  if (ro) {
    d.deny(target + ' is under the read-only path "' + ro + '" (paths.readOnly): never edited, only read. ' +
      'Port or copy from it into the project sources instead.');
  }
  const mirror = String(cfg.paths.memoryMirror || '.claude/memory').replace(/\/+$/, '').toLowerCase();
  if (P.under(rel, mirror) && rel !== mirror) {
    d.deny(target + ' is the read-only memory mirror. Edit the real memory under ~/.claude/projects/<project>/memory/; ' +
      'the sync-memory Stop hook copies it here.');
  }
  let kitManaged = null;
  for (const k of ['.claude/core', '.claude/packs', '.claude/hooks']) if (P.under(rel, k)) kitManaged = k + '/';
  if (!kitManaged && inClaude && managedPaths(rootFs).has(rel)) kitManaged = 'activated copy, listed in .claude/kit.manifest.json';
  if (kitManaged) {
    d.deny(target + ' is kit-managed (' + kitManaged + '): never edited inside a project; the next install.js --update ' +
      'would overwrite it. Change the kit and re-run install.js --update; project-specific rules go to .claude/project/rules.md.');
  }
  if (rel === '.claude/settings.json' || rel === '.claude/kit.config.json') {
    d.ask(target + ' configures the hooks and the kit; confirm the change with the human first.', 'kitConfig');
  }
  const forbidden = (cfg.paths.forbiddenTreeFiles || []).map((n) => String(n).toLowerCase());
  if (!inClaude && forbidden.includes(P.basename(abs).toLowerCase())) {
    d.deny(target + ': ' + (cfg.paths.forbiddenTreeFiles || []).join(', ') + ' must not exist in the repo tree ' +
      '(it holds user documentation only). Instructions live in .claude/CLAUDE.md and .claude/rules/; module docs are README.md.');
  }
  const ab = P.matchAny(abs, root, cfg.paths.askBeforeEdit);
  if (ab) d.ask(target + ' is under "' + ab + '" (paths.askBeforeEdit); edit it only when the task says so.', 'askBeforeEdit');

  if (P.asciiCovered(abs, root, cfg)) {
    const texts = [];
    if (typeof ti.new_string === 'string') texts.push(ti.new_string);
    if (typeof ti.content === 'string') texts.push(ti.content);
    if (typeof ti.new_source === 'string') texts.push(ti.new_source);
    if (Array.isArray(ti.edits)) for (const e of ti.edits) if (e && typeof e.new_string === 'string') texts.push(e.new_string);
    for (const s of texts) {
      const m = s.match(/[^\x00-\x7F]/);
      if (!m) continue;
      const line = s.split('\n').find((l) => l.includes(m[0])) || '';
      const why = /\.(md|markdown)$/i.test(abs) ? 'encoding.asciiRepoMarkdown: tracked Markdown is ASCII' : 'encoding.asciiExtensions; MSVC C4819 / code-page machines';
      d.deny(target + ': this file is ASCII only (' + why + '). Found U+' +
        m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + ' in: ' + line.trim().slice(0, 120) +
        '. Write -- for a dash, -> for an arrow, x, deg, +/-, ...; a character the program shows goes in as an escape.');
      break;
    }
  }
  d.escalate(input, cfg);
}

module.exports = { main };

if (require.main === module) run('guard-edit', main, { failMode: 'open' });
