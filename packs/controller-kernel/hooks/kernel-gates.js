#!/usr/bin/env node
// PostToolUse hook, matcher: Edit|Write|MultiEdit (pack controller-kernel).
// Runs the pack's gate engine (tools/controller-kernel/gate-check.js) on the file that was just
// edited: ASCII, L2 purity and includes, L4 timers, L5 call-outs, L10 blocking waits and
// WARN-PRAGMA as errors; L9 literals as warnings.
//   gate error(s)   -> each finding with law and fix hint on stderr, exit 2 (fed back to Claude)
//   warnings only   -> exit 0 with additionalContext for Claude
//   clean / skipped -> exit 0, silent
// Skips files outside the project, under .claude/ and under build.buildDirPatterns. Fails open:
// an internal error exits 0 with a stderr note. The build and the tests stay the source of truth.
'use strict';

const fs = require('fs');
const path = require('path');

function lib(name) {
  const candidates = [path.join(__dirname, '..', 'lib', name), path.join(__dirname, '..', '..', '..', 'core', 'hooks', 'lib', name)];
  for (const c of candidates) if (fs.existsSync(c + '.js')) return require(c);
  throw new Error('kit hook lib not found: ' + name);
}
function gateModule() {
  const candidates = [
    path.join(__dirname, '..', '..', 'tools', 'controller-kernel', 'gate-check.js'), // installed
    path.join(__dirname, '..', 'tools', 'gate-check.js'),                             // kit repo
  ];
  for (const c of candidates) if (fs.existsSync(c)) return require(c);
  throw new Error('gate-check.js not found next to ' + __dirname);
}

const { readStdin, say, parseInput, postContext } = lib('io');
const config = lib('config');
const P = lib('paths');

function main(input) {
  const ti = input.tool_input || {};
  const target = String(ti.file_path || '');
  if (!target) return 0;
  const { cfg, root } = config.load(input);
  const abs = path.resolve(root, target.replace(/\\/g, '/'));
  const nAbs = P.norm(abs);
  const nRoot = P.norm(root);
  const rel = P.rel(nAbs, nRoot);
  if (rel === null || rel === '') return 0;
  if (rel.startsWith('.claude/')) return 0;
  if (P.matchAny(nAbs, nRoot, (cfg.build && cfg.build.buildDirPatterns) || [])) return 0;
  if (!fs.existsSync(abs)) return 0;

  const gate = gateModule();
  const findings = gate.checkFile(abs, { root, cfg });
  if (findings.length === 0) return 0;

  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity !== 'error');
  const lines = findings.map((f) => f.file + ':' + f.line + ':' + f.col + ' [' + f.gate + '] ' +
    (f.severity === 'error' ? '' : 'warning: ') + f.message + '\n    law: ' + f.law + '\n    fix: ' + f.hint);
  const text = '[kernel-gates] ' + errors.length + ' error(s), ' + warnings.length + ' warning(s) in ' + rel + '\n' + lines.join('\n') + '\n';
  if (errors.length > 0) { say(text); return 2; }
  postContext(text);
  return 0;
}

module.exports = { main };

if (require.main === module) {
  readStdin((raw) => {
    let code = 0;
    try {
      const input = parseInput(raw);
      if (input !== null) code = main(input);
    } catch (err) {
      say('[kernel-gates] internal error (ignored): ' + (err && err.message ? err.message : err));
      code = 0;
    }
    process.exit(code);
  });
}
