#!/usr/bin/env node
// PreToolUse hook (Edit|Write|MultiEdit): block any modification under reference_source/.
// reference_source/ is the read-only extract of the original app; port into src/ instead.
// Exit 2 = block the tool call and show stderr to Claude. Exit 0 = allow.
'use strict';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch (_) { /* malformed -> allow */ }
  const ti = input.tool_input || {};
  const target = String(ti.file_path || ti.path || ti.notebook_path || '').replace(/\\/g, '/');
  if (/(^|\/)reference_source\//i.test(target)) {
    process.stderr.write(
      '[protect-reference] ' + target + ' is under reference_source/, which is read-only ' +
      'reference code and fixtures. Port the code into src/ or include/ instead of editing it.\n');
    process.exit(2);
  }
  process.exit(0);
});
