#!/usr/bin/env node
// PreToolUse hook (Edit|Write|MultiEdit|NotebookEdit) for ncr_picking. Blocks file edits the project
// rules forbid (.claude/CLAUDE.md, "Hard rules"):
//   deny - anything under reference_source/ (the deploy record, its recovery copy and read-only
//          reference drops); anything under components/RobotKinematics/ (a hand-provisioned drop,
//          never edited in place); an AGENT.md / AGENTS.md / CLAUDE.md outside a .claude/ folder
//          (docs/rules/design_rules.md §11.5); the memory mirror .claude/pm-agent-memory/ (the
//          sync-memory Stop hook writes it; edit the real memory instead).
//          A non-ASCII character in text written to a code file (design_rules.md 16.2).
//   ask  - the vendored 3rdparty/ tree.
// The decision goes to stdout as PreToolUse JSON. Any internal error allows the edit.
'use strict';

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: '[guard-edit] ' + reason,
    },
  }));
  process.exit(0);
}

function main(raw) {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch (_) { return; }
  const ti = input.tool_input || {};
  const target = String(ti.file_path || ti.notebook_path || ti.path || '').replace(/\\/g, '/');
  if (!target) return;
  const lower = target.toLowerCase();

  if (/(^|\/)reference_source\//.test(lower)) {
    decide('deny', target + ' is under reference_source/: read-only reference drops and the deploy-side record. ' +
      'A deploy-side update goes through git (fetch/merge of a bundle) when the owner asks, never through an edit.');
  }
  if (/(^|\/)components\/robotkinematics\//.test(lower)) {
    decide('deny', target + ' is inside the hand-provisioned RobotKinematics drop. It is replaced as a whole from a ' +
      'release, never edited in place (README.md, "Provision RobotKinematics").');
  }
  if (/(^|\/)(agents?|claude)\.md$/.test(lower) && !/(^|\/)\.claude\//.test(lower)) {
    decide('deny', target + ': agent instruction files are never part of the repository (docs/rules/design_rules.md ' +
      '§11.5). Module docs are README.md; local agent instructions live in .claude/CLAUDE.md.');
  }
  if (/(^|\/)\.claude\/pm-agent-memory\//.test(lower) && !/\/readme\.md$/.test(lower)) {
    decide('deny', target + ' is the read-only memory mirror. Edit the memory under ~/.claude/projects/.../memory/; ' +
      'the sync-memory Stop hook copies it here.');
  }
  if (/(^|\/)3rdparty\//.test(lower)) {
    decide('ask', target + ' is vendored third-party code; edit it only when a work package says so.');
  }

  // Code files are ASCII only (docs/rules/design_rules.md 16.2). Checks only the text this call
  // writes: new_string, each MultiEdit edit's new_string, or a Write's whole content.
  if (CODE_EXT.test(lower) && !/(^|\/)components\/(qpb|robotkinematics)\//.test(lower)) {
    const texts = [];
    if (typeof ti.new_string === 'string') texts.push(ti.new_string);
    if (typeof ti.content === 'string') texts.push(ti.content);
    if (Array.isArray(ti.edits)) for (const e of ti.edits) if (e && typeof e.new_string === 'string') texts.push(e.new_string);
    for (const s of texts) {
      const m = s.match(/[^\x00-\x7F]/);
      if (m) {
        const line = s.split('\n').find((l) => l.includes(m[0])) || '';
        decide('deny', target + ': code files are ASCII only (docs/rules/design_rules.md 16.2). Found U+' +
          m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + ' in: ' + line.trim().slice(0, 120) +
          '. Write -- for a dash, -> for an arrow, x, deg, +/-; a character the program shows goes in as an escape.');
      }
    }
  }
}

const CODE_EXT = /\.(cpp|h|hpp|ui|qrc|pro|pri|prf|bat|cmd|ps1|py)$/;

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try { main(raw); } catch (err) {
    process.stderr.write('[guard-edit] internal error, edit allowed: ' + (err && err.message) + '\n');
  }
  process.exit(0);
});
