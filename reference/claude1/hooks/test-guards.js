// Test cases for guard-bash.js and guard-edit.js: node .claude/hooks/test-guards.js
// Each case is [hook, command or tool_input, cwd, expected decision]. Run every case after changing a guard.
'use strict';
const fs = require('fs');
const os = require('os');
const pathMod = require('path');
const S = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'guard-test-'));
fs.mkdirSync(pathMod.join(S, 'hooktest'));
fs.writeFileSync(pathMod.join(S, 'hooktest', 'bad_msg.txt'), 'fix: thing\n\nCo-Authored-By: Claude <x>\n');
fs.writeFileSync(pathMod.join(S, 'hooktest', 'good_msg.txt'), 'fix: thing\n\nplain body\n');
const { spawnSync } = require('child_process');
const H = __dirname.split(pathMod.sep).join('/') + '/';
const P = 'C:\\DGB\\Project\\computer-vision-app';
const HEREDOC_BAD = 'git commit -m "$(cat <<\'MSG\'\ndocs: x\n\nCo-Authored-By: Claude Opus <noreply@anthropic.com>\nMSG\n)"';
const cases = [
  ['guard-bash', 'git status', P, 'allow'],
  ['guard-bash', 'git log --oneline -5 && git diff --stat', P, 'allow'],
  ['guard-bash', 'git add docs/README.md src/core/README.md', P, 'allow'],
  ['guard-bash', 'git add -A', P, 'deny'],
  ['guard-bash', 'git add .', P, 'deny'],
  ['guard-bash', 'git add -u', P, 'deny'],
  ['guard-bash', 'git commit -am "x"', P, 'deny'],
  ['guard-bash', 'git commit -a -m "x"', P, 'deny'],
  ['guard-bash', 'git commit --amend --no-edit', P, 'ask'],
  ['guard-bash', 'git commit -m "docs: plain"', P, 'allow'],
  ['guard-bash', HEREDOC_BAD, P, 'deny'],
  ['guard-bash', 'git commit -F "' + S + '/hooktest/bad_msg.txt"', P, 'deny'],
  ['guard-bash', 'git commit -F "' + S + '/hooktest/good_msg.txt"', P, 'allow'],
  ['guard-bash', 'git commit -m "never kill ncr_runtime.exe; rm -rf nothing"', P, 'allow'],
  ['guard-bash', 'git -c user.email=ncrn39@gmail.com commit -m x', P, 'deny'],
  ['guard-bash', 'git log --author=dev28', P, 'allow'],
  ['guard-bash', 'git config --global user.name foo', P, 'deny'],
  ['guard-bash', 'git config --global --list', P, 'allow'],
  ['guard-bash', 'git config user.name', P, 'allow'],
  ['guard-bash', 'git push origin main', P, 'ask'],
  ['guard-bash', 'git push --force origin main', P, 'deny'],
  ['guard-bash', 'git push -f origin main', P, 'deny'],
  ['guard-bash', 'git push --force-with-lease origin main', P, 'ask'],
  ['guard-bash', 'git push origin +main', P, 'deny'],
  ['guard-bash', 'git reset --hard HEAD~1', P, 'ask'],
  ['guard-bash', 'git reset HEAD docs/x.md', P, 'allow'],
  ['guard-bash', 'git clean -fd', P, 'ask'],
  ['guard-bash', 'git checkout -- src/a.cpp', P, 'ask'],
  ['guard-bash', 'git checkout main', P, 'allow'],
  ['guard-bash', 'git switch -c feature/x', P, 'allow'],
  ['guard-bash', 'git restore --staged x.md', P, 'allow'],
  ['guard-bash', 'git restore x.md', P, 'ask'],
  ['guard-bash', 'git branch -d wp/done', P, 'allow'],
  ['guard-bash', 'git branch -D wp/x', P, 'ask'],
  ['guard-bash', 'git stash drop', P, 'ask'],
  ['guard-bash', 'git rebase main', P, 'ask'],
  ['guard-bash', 'git tag -d sync/dev-2026-10-05', P, 'ask'],
  ['guard-bash', 'git merge --no-ff wp/x -m "Merge WP-1"', P, 'allow'],
  ['guard-bash', 'git rm --cached AGENT.md', P, 'allow'],
  ['guard-bash', 'git rm src/old.cpp', P, 'allow'],
  ['guard-bash', 'git worktree remove --force .wt/slot1', P, 'ask'],
  ['guard-bash', 'taskkill /IM ncr_runtime.exe /F', P, 'deny'],
  ['guard-bash', 'Get-Process ncr_picking | Stop-Process', P, 'deny'],
  ['guard-bash', 'Get-Process ncr_runtime,ncr_picking -ErrorAction SilentlyContinue', P, 'allow'],
  ['guard-bash', 'tasklist | grep -i ncr_', P, 'allow'],
  ['guard-bash', 'taskkill /IM mc_workbench_tests.exe /F', P, 'ask'],
  ['guard-bash', 'Stop-Process -Name findstr', P, 'ask'],
  ['guard-bash', 'taskkill /PID 1234 /F', P, 'allow'],
  ['guard-bash', 'Stop-Process -Id 1234', P, 'allow'],
  ['guard-bash', 'kill 4321', P, 'allow'],
  ['guard-bash', 'rm -rf build/all/pm-old', P, 'allow'],
  ['guard-bash', 'rm -f tests/architecture_contract_test/build/x.txt', P, 'allow'],
  ['guard-bash', 'rm -rf reference_source/deploy-repo', P, 'deny'],
  ['guard-bash', 'cd reference_source && rm -rf deploy-repo-backup', P, 'deny'],
  ['guard-bash', 'Remove-Item -Recurse -Force "C:\\DGB\\Project\\computer-vision-app\\reference_source\\x"', P, 'deny'],
  ['guard-bash', 'rm -rf .wt/slot1', P, 'deny'],
  ['guard-bash', 'cmd /c rmdir .wt\\slot1\\3rdparty\\eigen', P, 'ask'],
  ['guard-bash', 'rm -rf components/RobotKinematics', P, 'ask'],
  ['guard-bash', 'rm product_release/bundle-to-deploy/x.bundle', P, 'ask'],
  ['guard-bash', 'rm -rf C:/build_packages/old', P, 'ask'],
  ['guard-bash', 'rm -rf /c/build_packages/old', P, 'ask'],
  ['guard-bash', 'rm -f "' + S.split(pathMod.sep).join('/') + '/hooktest/x.txt"', P, 'allow'],
  ['guard-bash', 'rm -f "$S/x.txt"', P, 'ask'],
  ['guard-bash', 'rm -f /tmp/runtime.pri.bak', P, 'allow'],
  ['guard-bash', 'cd C:/build_packages && rm -rf old', P, 'ask'],
  ['guard-bash', 'find build -name "*.obj" -delete', P, 'allow'],
  ['guard-bash', 'find /c/build_packages -name "*.obj" -delete', P, 'ask'],
  ['guard-bash', 'grep -rn "rm -rf" docs', P, 'allow'],
  ['guard-bash', 'echo "taskkill /IM ncr_runtime.exe" > notes.txt', P, 'allow'],
  ['guard-edit', { file_path: P + '\\src\\core\\a.cpp' }, P, 'allow'],
  ['guard-edit', { file_path: P + '\\reference_source\\deploy-repo\\x.md' }, P, 'deny'],
  ['guard-edit', { file_path: P + '\\components\\RobotKinematics\\include\\x.h' }, P, 'deny'],
  ['guard-edit', { file_path: P + '\\src\\ui\\AGENTS.md' }, P, 'deny'],
  ['guard-edit', { file_path: P + '\\CLAUDE.md' }, P, 'deny'],
  ['guard-edit', { file_path: P + '\\.claude\\CLAUDE.md' }, P, 'allow'],
  ['guard-edit', { file_path: P + '\\.claude\\pm-agent-memory\\MEMORY.md' }, P, 'deny'],
  ['guard-edit', { file_path: 'C:\\Users\\dgb07\\.claude\\projects\\c--DGB-Project-computer-vision-app\\memory\\MEMORY.md' }, P, 'allow'],
  ['guard-edit', { file_path: P + '\\3rdparty\\qtpropertybrowser\\src\\x.cpp' }, P, 'ask'],
  ['guard-edit', { file_path: P + '\\src\\core\\a.cpp', old_string: 'x', new_string: '// a ' + String.fromCharCode(0x2014) + ' b' }, P, 'deny'],
  ['guard-edit', { file_path: P + '\\src\\core\\a.h', content: 'int x; // 90' + String.fromCharCode(0xB0) }, P, 'deny'],
  ['guard-edit', { file_path: P + '\\src\\core\\core.pri', edits: [{ old_string: 'a', new_string: 'ok' }, { old_string: 'b', new_string: String.fromCharCode(0x2192) }] }, P, 'deny'],
  ['guard-edit', { file_path: P + '\\scripts\\x.ps1', new_string: 'Write-Output "' + String.fromCharCode(0x2026) + '"' }, P, 'deny'],
  ['guard-edit', { file_path: P + '\\src\\core\\a.cpp', old_string: '// a ' + String.fromCharCode(0x2014) + ' b', new_string: '// a -- b' }, P, 'allow'],
  ['guard-edit', { file_path: P + '\\docs\\x.md', new_string: 'a ' + String.fromCharCode(0x2014) + ' b' }, P, 'allow'],
  ['guard-edit', { file_path: P + '\\resrc\\styles\\x.qss', new_string: '/* ' + String.fromCharCode(0x2014) + ' */' }, P, 'allow'],
  ['guard-edit', { file_path: P + '\\components\\app\\translations\\ncr_picking_ja_JP.ts', new_string: String.fromCharCode(0x30C6) }, P, 'allow'],
  ['guard-edit', { file_path: P + '\\components\\qpb\\src\\x.cpp', new_string: String.fromCharCode(0x2014) }, P, 'allow'],
];
let fail = 0;
for (const [hook, ti, cwd, want] of cases) {
  const tool_input = typeof ti === 'string' ? { command: ti } : ti;
  const r = spawnSync('node', [H + hook + '.js'], {
    input: JSON.stringify({ tool_input, cwd }), encoding: 'utf8',
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: P }),
  });
  let got = 'allow';
  let reason = '';
  if (r.stdout.trim()) {
    const o = JSON.parse(r.stdout);
    got = o.hookSpecificOutput.permissionDecision;
    reason = o.hookSpecificOutput.permissionDecisionReason;
  }
  const ok = got === want;
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + hook + ' | ' + JSON.stringify(tool_input).slice(0, 90) + ' -> ' + got +
    (ok ? '' : ' (want ' + want + ') ' + reason.slice(0, 140)) + (r.stderr ? ' STDERR ' + r.stderr.trim() : ''));
}
fs.rmSync(S, { recursive: true, force: true });
console.log('failures: ' + fail + ' / ' + cases.length);
process.exitCode = fail ? 1 : 0;
