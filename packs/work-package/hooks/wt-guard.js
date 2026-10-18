#!/usr/bin/env node
// PreToolUse hook, matcher: Bash|PowerShell (pack work-package).
// Worktree slots share vendored package trees with the main tree through directory junctions.
// A recursive delete inside a slot therefore empties the MAIN tree's packages through the links.
//   deny  - rm -r / rm -rf, Remove-Item -Recurse, rd /s, rmdir /s, robocopy /MIR|/PURGE, git clean
//           with a target under build.worktrees.dir
//   ask   - git worktree remove --force; cmd /c rmdir <junction> (allowed only through the
//           worktree-slots procedure, so the leader confirms)
// Uses the kit's shell walker; fails open on its own errors (stderr note).
'use strict';

const fs = require('fs');
const path = require('path');

function lib(name) {
  const candidates = [path.join(__dirname, '..', 'lib', name), path.join(__dirname, '..', '..', '..', 'core', 'hooks', 'lib', name)];
  for (const c of candidates) if (fs.existsSync(c + '.js')) return require(c);
  throw new Error('kit hook lib not found: ' + name);
}
const { run } = lib('io');
const config = lib('config');
const P = lib('paths');
const S = lib('shell');

const RM_VERBS = new Set(['rm', 'rmdir', 'rd', 'del', 'erase', 'remove-item', 'ri']);
const RECURSIVE = /^(-[a-z]*r[a-z]*|-R|--recursive|-recurse|-rec|-recu|-recur|-recurs|\/s)$/i;

function main(input, d) {
  const cmd = String((input.tool_input && input.tool_input.command) || '');
  if (!cmd) return;
  const { cfg, root: rootFs } = config.load(input);
  const wt = (cfg.build && cfg.build.worktrees) || {};
  const dir = String(wt.dir || '.wt').replace(/\/+$/, '');
  const root = P.norm(rootFs);
  const wtAbs = P.isAbsolute(dir) ? P.norm(dir) : P.norm(root + '/' + dir);
  const ps = String(input.tool_name || '') === 'PowerShell';
  const cwd = P.norm(input.cwd || rootFs);
  const underWt = (t, cur) => { const r = P.resolveTarget(t, cur); return !r.err && P.under(r.abs, wtAbs) && r.abs !== wtAbs ? r.abs : null; };
  const touchesWt = (t, cur) => { const r = P.resolveTarget(t, cur); return !r.err && (P.under(r.abs, wtAbs) || P.under(wtAbs, r.abs)); };

  S.walk(cmd, {
    ps, cwd,
    visitor: {
      command(c) {
        const { name, args } = c;
        const positionals = args.filter((a) => !/^-/.test(a) && !/^\/[a-z]$/i.test(a));
        if (RM_VERBS.has(name)) {
          const recursive = args.some((a) => RECURSIVE.test(a)) || (name === 'rmdir' && !ps && false);
          const hits = positionals.map((t) => underWt(t, c.cur)).filter(Boolean);
          if (hits.length && recursive) {
            d.deny('recursive delete inside the worktree slots dir (' + dir + '): slots hold junctions into the main tree, so this empties the main tree\'s packages. ' +
              'Remove each junction with `cmd /c rmdir <junction>` (no /s), then `git worktree remove <slot>` (worktree-slots skill).');
          } else if (hits.length && (name === 'rmdir' || name === 'rd')) {
            d.ask('removing a directory entry under ' + dir + ' (a junction?): confirm it is the worktree-slots procedure (rmdir without /s on each junction, then git worktree remove).');
          } else if (positionals.some((t) => touchesWt(t, c.cur)) && recursive) {
            d.deny('recursive delete that covers the worktree slots dir (' + dir + '); slots hold junctions into the main tree.');
          }
          return null;
        }
        if (name === 'robocopy' && /\/(mir|purge)\b/i.test(args.join(' '))) {
          const pos = args.filter((a) => !/^\//.test(a));
          if (pos[1] && touchesWt(pos[1], c.cur)) d.deny('robocopy /MIR|/PURGE into the worktree slots dir deletes through junctions.');
          return null;
        }
        if (name === 'git') {
          const sub = args.find((a) => !/^-/.test(a));
          if (sub === 'clean' && !args.includes('-n') && !args.includes('--dry-run')) {
            const targets = args.slice(args.indexOf(sub) + 1).filter((a) => !/^-/.test(a));
            if (targets.some((t) => touchesWt(t, c.cur)) || (targets.length === 0 && P.under(c.cur || '', wtAbs))) {
              d.deny('git clean inside a worktree slot deletes through junctions; remove junctions first (worktree-slots skill).');
            }
          }
          if (sub === 'worktree' && args.includes('remove') && args.some((a) => /^(--force|-f)$/.test(a))) {
            d.ask('git worktree remove --force discards a slot\'s uncommitted work; confirm with the human.');
          }
        }
        return null;
      },
    },
  });
}

module.exports = { main };

if (require.main === module) run('wt-guard', main, { failMode: 'open' });
