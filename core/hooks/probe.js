#!/usr/bin/env node
// Ask the installed hooks what they would decide, without running anything.
// The guards fail open (hooks.failMode "open"): testing a deny by running the real command
// risks the command itself when the hook breaks. This feeds the real hook scripts with the
// real kit.config.json and prints the decision; the command is never executed.
//
//   node .claude/hooks/probe.js shell "<command>" [--ps] [--mode auto] [--cwd <dir>]
//   node .claude/hooks/probe.js edit <file> [--content "<text>"] [--mode auto]
//   node .claude/hooks/probe.js agent <subagent_type> [<model>]
//   node .claude/hooks/probe.js --batch <file> [--mode auto]
//
// Batch file: one case per line, `<expect> <kind> <argument>`; `#` starts a comment.
//   deny   shell  git push --force origin main
//   ask    ps     setx FOO C:\x                (kind ps = the PowerShell tool)
//   deny   edit   reference_source/a.cpp :: new text      (text after " :: " is the content)
//   allow  agent  reviewer opus
// expect may be "-" to only print. Exit code: 1 when an expectation fails, 2 on usage errors.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOKS = __dirname;
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(HOOKS, '..', '..');

function usage(msg) {
  if (msg) process.stderr.write('probe.js: ' + msg + '\n');
  process.stderr.write('usage: probe.js shell "<cmd>" [--ps] [--mode m] [--cwd d] | edit <file> [--content t] [--mode m] | agent <type> [model] | --batch <file> [--mode m]\n');
  process.exit(2);
}

function hookInput(kind, arg, opt) {
  const cwd = opt.cwd ? path.resolve(ROOT, opt.cwd) : ROOT;
  let hook, input;
  if (kind === 'shell' || kind === 'ps') {
    hook = 'guard-shell';
    input = { tool_name: kind === 'ps' || opt.ps ? 'PowerShell' : 'Bash', tool_input: { command: arg }, cwd };
  } else if (kind === 'edit') {
    hook = 'guard-edit';
    const file = path.isAbsolute(arg) ? arg : path.join(ROOT, arg);
    input = { tool_name: 'Write', tool_input: { file_path: file, content: opt.content === undefined ? 'x' : opt.content }, cwd };
  } else if (kind === 'agent') {
    hook = 'subagent-model-guard';
    const [type, model] = String(arg).split(/\s+/);
    input = { tool_name: 'Agent', tool_input: Object.assign({ subagent_type: type, prompt: 'probe' }, model ? { model } : {}), cwd };
  } else {
    return null;
  }
  if (opt.mode) input.permission_mode = opt.mode;
  return { hook, input };
}

function decide(hook, input) {
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook + '.js')], {
    input: JSON.stringify(input), encoding: 'utf8', timeout: 20000,
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: ROOT }),
  });
  let decision = 'allow';
  let reason = '';
  if (r.stdout && r.stdout.trim()) {
    try {
      const j = JSON.parse(r.stdout);
      decision = j.hookSpecificOutput.permissionDecision;
      reason = j.hookSpecificOutput.permissionDecisionReason || '';
    } catch (_) { decision = 'bad-output'; reason = r.stdout.slice(0, 200); }
  }
  const stderr = (r.stderr || '').trim();
  if (stderr) reason += (reason ? ' ' : '') + '[stderr: ' + stderr.slice(0, 200) + ']';
  if (r.status !== 0) decision = 'exit' + r.status;
  return { decision, reason };
}

function parseOpts(argv) {
  const o = { rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ps') o.ps = true;
    else if (a === '--mode') o.mode = argv[++i];
    else if (a === '--cwd') o.cwd = argv[++i];
    else if (a === '--content') o.content = argv[++i];
    else if (a === '--batch') o.batch = argv[++i];
    else o.rest.push(a);
  }
  return o;
}

function main() {
  const o = parseOpts(process.argv.slice(2));
  if (o.batch) {
    let text;
    try { text = fs.readFileSync(o.batch, 'utf8'); } catch (e) { usage('cannot read ' + o.batch); }
    let bad = 0, n = 0;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/^\s+/, '');
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^(\S+)\s+(\S+)\s+(.*)$/);
      if (!m) { console.log('skip  (unparsed) ' + line); continue; }
      const [, expect, kind, rest] = m;
      const opt = { mode: o.mode };
      let arg = rest;
      if (kind === 'edit' && rest.includes(' :: ')) { arg = rest.slice(0, rest.indexOf(' :: ')); opt.content = rest.slice(rest.indexOf(' :: ') + 4); }
      const hi = hookInput(kind, arg.trim(), opt);
      if (!hi) { console.log('skip  (unknown kind ' + kind + ') ' + line); continue; }
      const r = decide(hi.hook, hi.input);
      n++;
      const ok = expect === '-' || expect === r.decision;
      if (!ok) bad++;
      console.log((ok ? 'ok    ' : 'FAIL  ') + r.decision.padEnd(6) + kind.padEnd(6) + arg.trim().slice(0, 100) +
        (ok ? '' : '   (expected ' + expect + ': ' + r.reason.replace(/\n/g, ' | ').slice(0, 200) + ')'));
    }
    console.log('probe: ' + (n - bad) + ' / ' + n + ' as expected' + (o.mode ? ' (permission_mode ' + o.mode + ')' : ''));
    process.exit(bad ? 1 : 0);
  }
  const [kind, ...args] = o.rest;
  if (!kind) usage();
  const arg = kind === 'agent' ? args.join(' ') : args[0];
  if (!arg) usage('missing argument');
  const hi = hookInput(kind, arg, o);
  if (!hi) usage('unknown kind ' + kind);
  const r = decide(hi.hook, hi.input);
  console.log(r.decision + (r.reason ? '  ' + r.reason : ''));
}

main();
