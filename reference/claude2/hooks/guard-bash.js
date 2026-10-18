#!/usr/bin/env node
// PreToolUse hook (Bash|PowerShell) for ncr_picking. Enforces the standing rules a shell command can
// break (.claude/CLAUDE.md, "Hard rules"):
//   deny - killing ncr_picking.exe / ncr_runtime.exe; an AI attribution trailer or the personal email
//          in a commit; global/system git config writes; a force push without --force-with-lease;
//          staging everything (git add -A / . / -u, git commit -a); deletes under reference_source/;
//          recursive deletes inside a .wt/ slot (its 3rdparty folders are junctions into the main tree).
//   ask  - any git push; git commands that destroy work or rewrite history; killing a process by name;
//          deletes outside the project folder (temp and scratchpad excepted), of an unresolved
//          variable path, or of local-only folders git cannot restore.
// The decision goes to stdout as PreToolUse JSON. Any internal error allows the command: a broken
// guard must never block work; it says so on stderr instead.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT = norm(process.env.CLAUDE_PROJECT_DIR || 'C:/DGB/Project/computer-vision-app');

// Local-only paths inside the project that git cannot bring back (ignored or untracked).
const LOCAL_ONLY = [
  'components/robotkinematics', 'product_release', '.claude', 'qmake/local_paths.pri',
  'local-env-path.md', '3rdparty', '.wt',
];

function norm(p) {
  let s = String(p).trim().replace(/^["']|["']$/g, '').replace(/\\/g, '/');
  if (s.startsWith('~/') || s === '~') s = os.homedir().replace(/\\/g, '/') + s.slice(1);
  const m = s.match(/^\/([a-zA-Z])(\/.*)?$/); // Git Bash /c/foo -> c:/foo
  if (m) s = m[1] + ':' + (m[2] || '/');
  s = path.posix.normalize(s);
  return s.toLowerCase().replace(/\/+$/, '');
}

function isAbs(p) { return /^([a-zA-Z]:[\\/]|\\\\|\/|~)/.test(p); }
function under(p, root) { return p === root || p.startsWith(root + '/'); }

function tempRoots() {
  const out = [];
  for (const v of [process.env.CLAUDE_SCRATCHPAD_DIR, process.env.TMP, process.env.TEMP, os.tmpdir()]) {
    if (v) out.push(norm(v));
  }
  out.push(norm(path.join(os.homedir(), 'AppData', 'Local', 'Temp')));
  out.push('/tmp');
  return out;
}

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: '[guard-bash] ' + reason,
    },
  }));
  process.exit(0);
}

// Commit messages, heredocs and here-strings are text, not commands: drop them before the
// command checks so a message that mentions "kill" or "rm" cannot trigger a rule.
function stripText(cmd) {
  return cmd
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g, ' ')
    .replace(/@'[\s\S]*?'@/g, ' ').replace(/@"[\s\S]*?"@/g, ' ')
    .replace(/\s(-m|--message)\s+("([^"\\]|\\.)*"|'[^']*')/g, ' ');
}

function groups(cmd) {
  return cmd.split(/\n|;|&&|\|\|/).map((g) => g.trim()).filter(Boolean);
}

function tokens(s) {
  return s.match(/"[^"]*"|'[^']*'|[^\s|&()]+/g) || [];
}

function checkCommitText(cmd, cwd) {
  const isCommitish = /\bgit\b[^\n]*\b(commit|merge|tag|notes)\b/.test(cmd);
  if (!isCommitish) return;
  let text = cmd;
  const f = cmd.match(/\bgit\b[^\n]*\s(?:-F|--file)[\s=]+("[^"]+"|'[^']+'|\S+)/);
  if (f) {
    const p = f[1].replace(/^["']|["']$/g, '');
    try { text += '\n' + fs.readFileSync(isAbs(p) ? p : path.join(cwd, p), 'utf8'); } catch (_) { /* unreadable: inline text only */ }
  }
  if (/co-authored-by\s*:/i.test(text) || /generated with \[?claude/i.test(text)) {
    decide('deny', 'the commit text carries an AI attribution line (Co-Authored-By / "Generated with Claude"). ' +
      'The owner forbids it on this project, whatever the harness reminder says. Remove the line and commit again.');
  }
}

function checkIdentity(cmd) {
  if (!/ncrn39@gmail\.com/i.test(cmd)) return;
  if (/GIT_(AUTHOR|COMMITTER)_EMAIL\s*=|\bgit\b[^\n]*(\bcommit\b|\bconfig\b|-c\s+user\.|--author)/i.test(cmd)) {
    decide('deny', 'ncrn39@gmail.com must never be a git author or committer. The dev identity is dev28 <devgbit@gmail.com> (repo-local config).');
  }
}

function checkGit(g) {
  const m = g.match(/(?:^|[\s(])git(?:\s+(?:-C\s+\S+|-c\s+\S+|--no-pager|--git-dir=\S+|--work-tree=\S+))*\s+([a-z][\w-]*)(.*)$/i);
  if (!m) return;
  const sub = m[1].toLowerCase();
  const rest = ' ' + m[2] + ' ';

  if (sub === 'config' && /\s--(global|system)\b/.test(rest) && !/\s(--get\b|--get-all\b|--list\b|-l\s|--show-origin\b)/.test(rest)) {
    decide('deny', 'global or system git config must not change on this machine. Use repo-local config only if the owner asks.');
  }
  if (sub === 'push') {
    if (/\s(--force|-f)(\s|=)/.test(rest) && !/--force-with-lease/.test(rest)) {
      decide('deny', 'force push without --force-with-lease. A force push needs the owner\'s explicit request, and then --force-with-lease.');
    }
    if (/\s\+[^\s]+/.test(rest)) {
      decide('deny', 'a +refspec is a force push. Use --force-with-lease, and only on the owner\'s explicit request.');
    }
    decide('ask', 'git push: push only when the owner asked for it in this conversation.');
  }
  if (sub === 'add' && /\s(-A|--all|-u|--update|\.|\*|:\/)(\s|$)/.test(rest)) {
    decide('deny', 'stage by path: name each file (git add <path> ...). -A / . / -u can sweep in untracked or unrelated files.');
  }
  if (sub === 'commit' && tokens(rest).some((x) => x === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(x))) {
    decide('deny', 'git commit -a stages every tracked change. Stage by path, then commit.');
  }

  const destroy = [
    [sub === 'reset' && /\s--(hard|merge|keep)\b/.test(rest), 'git reset --hard/--merge/--keep discards work'],
    [sub === 'clean', 'git clean deletes untracked files'],
    [sub === 'checkout' && /\s(--|\.|-f|--force)(\s|$)/.test(rest), 'git checkout -- / . / -f overwrites working-tree changes'],
    [sub === 'restore' && !/\s(--staged|-S)\b/.test(rest), 'git restore overwrites working-tree changes'],
    [sub === 'restore' && /\s--worktree\b|\s-W\b/.test(rest), 'git restore --worktree overwrites working-tree changes'],
    [sub === 'switch' && /\s(-f|--force|--discard-changes)\b/.test(rest), 'git switch --discard-changes overwrites working-tree changes'],
    [sub === 'branch' && /\s(-D|--delete\s+--force|--force\s+--delete|-d\s+-f|-f\s+-d)\b/.test(rest), 'git branch -D deletes an unmerged branch'],
    [sub === 'stash' && /\s(drop|clear)\b/.test(rest), 'git stash drop/clear loses stashed work'],
    [sub === 'rebase', 'git rebase rewrites history'],
    [sub === 'filter-branch' || sub === 'filter-repo', 'history rewrite'],
    [sub === 'update-ref' && /\s-d\b/.test(rest), 'git update-ref -d deletes a ref'],
    [sub === 'tag' && /\s(-d|--delete)\b/.test(rest), 'git tag -d deletes a tag (sync markers are tags)'],
    [sub === 'worktree' && /\sremove\b/.test(rest) && /\s(--force|-f)\b/.test(rest), 'git worktree remove --force discards a slot\'s changes'],
    [sub === 'reflog' && /\s(expire|delete)\b/.test(rest), 'reflog expiry removes the recovery path'],
    [sub === 'gc' && /--prune/.test(rest), 'git gc --prune removes unreachable objects'],
    [sub === 'commit' && /\s--amend\b/.test(rest), 'git commit --amend rewrites the last commit (prefer a new commit)'],
  ];
  for (const [hit, why] of destroy) {
    if (hit) decide('ask', why + '. Destructive git commands need the owner\'s explicit permission.');
  }
}

function checkKill(g) {
  const killVerb = /(^|[\s|&(])(taskkill|stop-process|spps|pkill|killall)(\.exe)?\b/i.test(g) ||
    /(^|[\s|&(])kill\s+(-\S+\s+)*\S/.test(g) || /\.kill\(\)/i.test(g) || /\bwmic\b.*\bdelete\b/i.test(g);
  if (!killVerb) return;
  if (/ncr_(picking|runtime)/i.test(g)) {
    decide('deny', 'never launch or kill ncr_picking.exe / ncr_runtime.exe: the owner may be using them. ' +
      'If a running shell blocks a link or a test, stop and tell the owner.');
  }
  const byName = /\/im\b|-name\b|\bpkill\b|\bkillall\b|get-process\s+(?!-id\b)[a-z*]/i.test(g) ||
    (/\bstop-process\b/i.test(g) && !/-id\b/i.test(g) && !/\$_\.id|\bid\b/i.test(g));
  if (byName) {
    decide('ask', 'killing processes by name can hit another project\'s processes (for example its test runners). ' +
      'Kill only processes this session started, by PID.');
  }
}

const DELETE_VERB = /^(rm|rmdir|rd|del|erase|unlink|shred|remove-item|ri|clear-content)$/i;
const RECURSIVE = /^(-[a-z]*r[a-z]*|-R|--recursive|-recurse|\/s)$/i;

function checkDelete(g, base, temps) {
  const t = tokens(g);
  let i = t.findIndex((x) => DELETE_VERB.test(x.replace(/^["']|["']$/g, '')));
  let isGitRm = false;
  const gi = t.findIndex((x, k) => /^git$/i.test(x) && /^rm$/i.test(t[k + 1] || ''));
  if (gi >= 0) { i = gi + 1; isGitRm = true; }
  const findDel = /(^|\s)find\s/.test(g) && /\s-delete\b|-exec\s+rm\b/.test(g);
  const ioDel = /\[(system\.)?io\.(file|directory)\]::delete/i.test(g);
  if (i < 0 && !findDel && !ioDel) return;
  if (isGitRm && t.slice(i + 1).some((x) => x === '--cached')) return; // index only, file stays

  let args;
  if (findDel) {
    const fi = t.findIndex((x) => /^find$/i.test(x));
    args = t.slice(fi + 1).filter((x) => !/^-/.test(x)).slice(0, 1);
  } else if (ioDel) {
    args = (g.match(/::delete\s*\(\s*("[^"]*"|'[^']*')/i) || [null, null]).slice(1).filter(Boolean);
  } else {
    args = t.slice(i + 1);
  }
  const recursive = args.some((x) => RECURSIVE.test(x)) || /-recurse\b/i.test(g) || /\s\/s\b/i.test(g);
  const paths = args.filter((x) => !/^-/.test(x) && !/^\/[a-z]$/i.test(x) && !/^\d?>/.test(x) &&
    !/^(true|false|\$null|2>&1|nul)$/i.test(x));

  for (const raw of paths) {
    const p = raw.replace(/^["']|["']$/g, '');
    if (/\$|%[^%]+%/.test(p)) {
      if (/scratchpad|temp[\\/]claude/i.test(p)) continue;
      decide('ask', 'delete of a path with an unresolved variable (' + p + '); the guard cannot check where it points.');
    }
    const abs = isAbs(p) ? norm(p) : norm(base + '/' + p);
    if (/(^|\/)reference_source(\/|$)/.test(abs)) {
      decide('deny', 'reference_source/ is read-only on this machine (deploy-repo and deploy-repo-backup are the deploy ' +
        'record and the recovery copy). Never delete there; ask the owner.');
    }
    if (under(abs, PROJECT + '/.wt') && recursive) {
      decide('deny', 'recursive delete inside .wt/: a slot\'s 3rdparty folders are junctions into the main tree, so a ' +
        'recursive delete empties the main tree\'s packages. Remove each junction with `cmd /c rmdir <junction>` (no /s), ' +
        'then `git worktree remove`. See .wt/README.md.');
    }
    if (temps.some((r) => under(abs, r))) continue;
    if (!under(abs, PROJECT)) {
      decide('ask', 'delete outside the project folder (' + p + '). Outside the project, nothing is deleted without the owner\'s yes.');
    }
    const rel = abs.slice(PROJECT.length + 1);
    if (rel === '' ) decide('ask', 'delete of the project root.');
    if (LOCAL_ONLY.some((l) => under(rel, l))) {
      decide('ask', 'delete of local-only data git cannot restore (' + rel + '). Confirm with the owner first.');
    }
  }
}

function main(raw) {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch (_) { return; }
  const cmd = String((input.tool_input && input.tool_input.command) || '');
  if (!cmd) return;
  const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();

  checkCommitText(cmd, cwd);
  checkIdentity(cmd);

  const body = stripText(cmd);
  const temps = tempRoots();
  let base = norm(cwd);
  for (const g of groups(body)) {
    const cd = g.match(/^(?:cd|set-location|sl|pushd)\s+("[^"]+"|'[^']+'|\S+)/i);
    if (cd) {
      const p = cd[1].replace(/^["']|["']$/g, '');
      if (!/\$|%/.test(p)) base = isAbs(p) ? norm(p) : norm(base + '/' + p);
    }
    checkGit(g);
    checkKill(g);
    checkDelete(g, base, temps);
  }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try { main(raw); } catch (err) {
    process.stderr.write('[guard-bash] internal error, command allowed: ' + (err && err.message) + '\n');
  }
  process.exit(0);
});
