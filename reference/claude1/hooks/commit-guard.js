#!/usr/bin/env node
// PreToolUse hook, matcher: Bash|PowerShell.
// Acts only on commands that run `git commit` (incl. --amend, -m, -F file, heredoc messages,
// PowerShell here-strings) or `git push --force`; every other command passes untouched.
//
// Blocks `git commit` when:
//   - the message (taken from -m / --message / -F file / heredoc / here-string, or from HEAD for an
//     --amend without a new message) contains Co-Authored-By, "Generated with", noreply@anthropic.com,
//     "Anthropic" (case-insensitive) or the capitalised word "Claude" (lower-case technical words pass)
//   - the command passes --no-verify (or the short -n), or --author
//   - the command overrides identity (git -c user.name=..., GIT_AUTHOR_NAME=..., ...) or hooks path
//   - `git config user.name` / `user.email` (read in the project root; failures are ignored,
//     e.g. not a repo) is not exactly the project identity below
// Blocks `gh pr create|edit` when its body (--body / -b text, --body-file / -F file, heredoc,
// here-string) contains Co-Authored-By, "Generated with", noreply@anthropic.com or "Claude Code".
// Blocks `git push` with --force, --force-with-lease, -f or a +refspec, to any branch.
//
// Exit codes: 0 = allow (also on any internal error), 2 = block (reason on stderr).
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WANT_NAME = 'dev28';
const WANT_EMAIL = 'devgbit@gmail.com';

const GIT_OPTS = '(?:\\s+(?:-[Cc]\\s+\\S+|--[\\w-]+(?:=\\S+)?|-[A-Za-z]))*';
const RE_COMMIT = new RegExp('(?:^|[\\s;&|(])git' + GIT_OPTS + '\\s+commit(?=\\s|$)');
const RE_GH_PR = /(?:^|[\s;&|(])gh(?:\s+(?:-R\s+\S+|--repo(?:\s+|=)\S+))*\s+pr\s+(?:create|edit)(?=\s|$)/;
const RE_PUSH = new RegExp('(?:^|[\\s;&|(])git' + GIT_OPTS + '\\s+push(?=\\s|$)');

const FORBIDDEN = [
  [/co-authored-by/i, 'Co-Authored-By'],
  [/generated with/i, '"Generated with"'],
  [/\bClaude\b/, '"Claude"'],
  [/anthropic/i, '"Anthropic"'],
  [/noreply@anthropic\.com/i, 'noreply@anthropic.com'],
];

const PR_FORBIDDEN = [
  [/co-authored-by/i, 'Co-Authored-By'],
  [/generated with/i, '"Generated with"'],
  [/noreply@anthropic\.com/i, 'noreply@anthropic.com'],
  [/claude code/i, '"Claude Code"'],
];

function projectRoot(input) {
  return process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || process.cwd();
}

function stripNoise(cmd) {
  // remove quoted strings / heredoc bodies / here-strings so flag scanning sees only real flags
  return cmd
    .replace(/<<-?\s*(['"]?)([A-Za-z_][\w]*)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g, ' ')
    .replace(/@(['"])\r?\n[\s\S]*?\r?\n\1@/g, ' ')
    .replace(/"(?:[^"\\]|\\[\s\S])*"/g, ' ')
    .replace(/'[^']*'/g, ' ');
}

function extractMessages(cmd, root, kind) {
  const msgs = [];
  const pr = kind === 'pr';
  let m;
  const heredoc = /<<-?\s*(['"]?)([A-Za-z_][\w]*)\1[^\n]*\n([\s\S]*?)\n\s*\2(?=\s|$)/g;
  while ((m = heredoc.exec(cmd))) msgs.push(m[3]);
  const here = /@(['"])\r?\n([\s\S]*?)\r?\n\1@/g;
  while ((m = here.exec(cmd))) msgs.push(m[2]);
  const flagNames = pr ? '(?:-b|--body)' : '(?:-[A-Za-z]*m|--message)';
  const flag = new RegExp('(?:^|\\s)' + flagNames + '(?:\\s+|=)("(?:[^"\\\\]|\\\\[\\s\\S])*"|\'[^\']*\'|[^\\s"\';&|]+)', 'g');
  while ((m = flag.exec(cmd))) msgs.push(m[1]);
  const fileNames = pr ? '(?:-F|--body-file)' : '(?:-[A-Za-z]*F|--file)';
  const file = new RegExp('(?:^|\\s)' + fileNames + '(?:\\s+|=)("[^"]+"|\'[^\']+\'|[^\\s;&|]+)', 'g');
  while ((m = file.exec(cmd))) {
    const f = m[1].replace(/^["']|["']$/g, '');
    if (f === '-') continue; // stdin: covered by heredoc extraction
    try {
      const g = f.replace(/^[/]([a-zA-Z])[/]/, '$1:/');
      const p = path.isAbsolute(g) ? g : path.join(root, g);
      msgs.push(fs.readFileSync(p, 'utf8'));
    } catch (_) { /* file may be created by the same command */ }
  }
  return msgs;
}

function gitConfig(root, key) {
  try {
    return execFileSync('git', ['config', key], { cwd: root, encoding: 'utf8', timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) { return null; }
}

function headMessage(root) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%B'], { cwd: root, encoding: 'utf8',
      timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (_) { return ''; }
}

function checkCommit(cmd, root) {
  const problems = [];
  const bare = stripNoise(cmd);
  const seg = bare.split(/[;&|\n]/).find((s) => RE_COMMIT.test(s)) || bare;

  if (/(^|\s)--no-verify(\s|=|$)/.test(bare) || /(^|\s)-[A-Za-z]*n[A-Za-z]*(?=\s|$)/.test(seg.replace(/^.*?commit/, ''))) {
    problems.push('--no-verify / -n skips the hooks; never bypass them');
  }
  if (/(^|\s)--author(\s|=|$)/.test(bare)) problems.push('--author overrides the project identity');
  if (/(^|\s)-c\s+(user\.(name|email)|core\.hookspath)\b/i.test(cmd) ||
      /\bGIT_(AUTHOR|COMMITTER)_(NAME|EMAIL)\s*=/.test(cmd)) {
    problems.push('identity / hooks-path override on the command line is not allowed');
  }

  const msgs = extractMessages(cmd, root);
  if (msgs.length === 0 && /(^|\s)--amend(\s|$)/.test(bare)) msgs.push(headMessage(root));
  const text = msgs.join('\n') + '\n' + (/co-authored-by|noreply@anthropic\.com|generated with/i.test(cmd) ? cmd : '');
  for (const [re, label] of FORBIDDEN) {
    if (re.test(text)) problems.push('commit message contains ' + label + ' (no tool attribution or co-author trailers)');
  }

  const name = gitConfig(root, 'user.name');
  const email = gitConfig(root, 'user.email');
  if (name !== null && name !== WANT_NAME) problems.push('git config user.name is "' + name + '", must be exactly "' + WANT_NAME + '"');
  if (email !== null && email !== WANT_EMAIL) problems.push('git config user.email is "' + email + '", must be exactly "' + WANT_EMAIL + '"');
  return problems;
}

function checkPr(cmd, root) {
  const problems = [];
  const text = extractMessages(cmd, root, 'pr').join('\n') + '\n' +
    (/co-authored-by|noreply@anthropic\.com|generated with|claude code/i.test(cmd) ? cmd : '');
  for (const [re, label] of PR_FORBIDDEN) {
    if (re.test(text)) problems.push('PR text contains ' + label + ' (no tool attribution in pull requests)');
  }
  return problems;
}

function checkPush(cmd) {
  const bare = stripNoise(cmd);
  const seg = bare.split(/[;&|\n]/).find((s) => RE_PUSH.test(s)) || '';
  const rest = seg.replace(/^.*?\bpush\b/, '');
  if (/(^|\s)(--force\S*|-[A-Za-z]*f[A-Za-z]*|\+\S+)(?=\s|$)/.test(rest)) {
    return ['force push is not allowed on any branch'];
  }
  return [];
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
  const root = projectRoot(input);
  let problems = [];
  if (RE_COMMIT.test(cmd)) problems = problems.concat(checkCommit(cmd, root));
  if (RE_GH_PR.test(cmd)) problems = problems.concat(checkPr(cmd, root));
  if (RE_PUSH.test(cmd)) problems = problems.concat(checkPush(cmd));
  if (problems.length === 0) return 0;
  say('[commit-guard] Blocked:\n' + problems.map((p) => '  - ' + p).join('\n') +
    '\nFix the command (plain message or PR text, no trailers, default hooks, project identity ' + WANT_NAME + ' / ' + WANT_EMAIL + ') and retry.\n');
  return 2;
}

readStdin((raw) => {
  let code = 0;
  try { code = main(raw); } catch (err) {
    say('[commit-guard] internal error (allowing): ' + (err && err.message ? err.message : err) + '\n');
    code = 0;
  }
  process.exit(code);
});
