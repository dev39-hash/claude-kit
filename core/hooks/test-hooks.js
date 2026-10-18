#!/usr/bin/env node
// Table-driven tests for the kit hooks: node .claude/hooks/test-hooks.js [filter]
// Builds a throwaway project under the OS temp dir with a kit.config.json that exercises every
// config knob, runs each hook as a child process with CLAUDE_PROJECT_DIR pointing there, and
// compares the decision (allow / ask / deny) with the expectation. Add a case for every rule you
// add or change. Exit 1 when any case fails.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOKS = __dirname;
const filter = process.argv[2] || '';
const U = (cp) => String.fromCodePoint(cp);

// ---- throwaway project -------------------------------------------------------------------
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-hooks-'));
const P = path.join(T, 'proj');
const PS = P.replace(/\\/g, '/');
for (const d of ['.claude/hooks', '.claude/memory', '.claude/core', '.claude/docs', 'src', 'docs', 'tests', 'build',
  'reference_source/x', '3rdparty/lib', 'components/vendor', '.wt/slot1', 'product_release', 'app/translations', 'build-wt/slot1']) {
  fs.mkdirSync(path.join(P, d), { recursive: true });
}
fs.mkdirSync(path.join(P, '.git'), { recursive: true });
fs.writeFileSync(path.join(P, '.claude', 'memory', 'MEMORY.md'), '- index\n');
fs.writeFileSync(path.join(P, 'src', 'a.cpp'), 'int a;\n');
fs.writeFileSync(path.join(P, 'README.md'), '# x\n');
const msgDir = path.join(T, 'msgs');
fs.mkdirSync(msgDir);
fs.writeFileSync(path.join(msgDir, 'bad_msg.txt'), 'fix: thing\n\nCo-Authored-By: Claude <x>\n');
fs.writeFileSync(path.join(msgDir, 'good_msg.txt'), 'fix: thing\n\nplain body\n');
const MSG = msgDir.replace(/\\/g, '/');
const OUTSIDE = path.join(T, 'other').replace(/\\/g, '/');
fs.mkdirSync(OUTSIDE);

const scratch = path.join(T, 'scratchpad');
fs.mkdirSync(scratch);

const CONFIG = {
  project: { name: 'hooktest' },
  models: { worker: 'sonnet', reviewer: 'opus' },
  git: {
    identity: { name: 'dev28', email: 'devgbit@gmail.com' },
    deniedEmails: ['ncrn39@gmail.com'],
    forbiddenPhrases: ['WP-'],
  },
  paths: {
    readOnly: ['reference_source/'],
    askBeforeEdit: ['3rdparty/'],
    localOnly: ['.wt/', 'product_release/', '.claude/'],
  },
  processes: { neverKill: ['machine_ui', 'machine_runtime'], neverLaunch: ['machine_ui', 'machine_runtime'] },
  encoding: { codePage: 'cp932', asciiExempt: ['*.ts', '3rdparty/', 'components/'] },
};
fs.writeFileSync(path.join(P, '.claude', 'kit.config.json'), JSON.stringify(CONFIG, null, 2));
// what install.js would have written: the activated copies are kit-managed, project files are not
fs.writeFileSync(path.join(P, '.claude', 'kit.manifest.json'), JSON.stringify({ files: [
  '.claude/core/rules/00-roles-and-models.md', '.claude/rules/00-roles-and-models.md', '.claude/rules/cpp-qmake-qt/qt-testing.md',
  '.claude/agents/reviewer.md', '.claude/skills/tdd-workflow/SKILL.md', '.claude/commands/plan.md', '.claude/hooks/guard-shell.js',
  '.claude/tools/cpp-cmake-gtest/build.js', '.claude/references/definition-of-done.md'] }, null, 2));

// ---- runner --------------------------------------------------------------------------------
function runHook(hook, toolInput, cwd, toolName) {
  const input = { tool_name: toolName || (hook === 'guard-shell' ? 'Bash' : hook === 'guard-edit' ? 'Write' : 'Agent'),
    tool_input: toolInput, cwd: cwd || P };
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook + '.js')], {
    input: JSON.stringify(input), encoding: 'utf8', timeout: 20000,
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: P, CLAUDE_SCRATCHPAD_DIR: scratch, CLAUDE_KIT_CONFIG: '' }),
  });
  let decision = 'allow';
  let reason = '';
  if (r.stdout && r.stdout.trim()) {
    try {
      const j = JSON.parse(r.stdout);
      decision = j.hookSpecificOutput.permissionDecision;
      reason = j.hookSpecificOutput.permissionDecisionReason;
    } catch (_) { decision = 'bad-output: ' + r.stdout.slice(0, 80); }
  }
  if (r.status !== 0) decision = 'exit' + r.status;
  return { decision, reason, stderr: (r.stderr || '').trim() };
}

function bash(cmd, expect, cwd) { return ['guard-shell', cmd, expect, cwd, 'Bash']; }
function pwsh(cmd, expect, cwd) { return ['guard-shell', cmd, expect, cwd, 'PowerShell']; }
function edit(file, text, expect) { return ['guard-edit', { file_path: file, new_string: text === undefined ? 'x' : text }, expect]; }
function write(file, content, expect) { return ['guard-edit', { file_path: file, content }, expect, undefined, 'Write']; }
function agent(ti, expect) { return ['subagent-model-guard', ti, expect]; }

const HEREDOC_BAD = 'git commit -m "$(cat <<\'MSG\'\ndocs: x\n\nCo-Authored-By: Claude Opus <noreply@anthropic.com>\nMSG\n)"';
const HEREDOC_OK = 'git commit -F - <<\'MSG\'\nfeat(core): add thing\n\nbody text\nMSG';
const B64 = Buffer.from('Remove-Item -Recurse -Force ' + PS + '/reference_source/x', 'utf16le').toString('base64');

const cases = [
  // --- guard-shell: plain and read-only commands
  bash('git status', 'allow'),
  bash('git log --oneline -5 && git diff --stat', 'allow'),
  bash('ls -la && cat README.md', 'allow'),
  bash('grep -rn "rm -rf" docs/', 'allow'),
  bash('echo "never kill machine_runtime.exe; rm -rf nothing"', 'allow'),
  // --- staging and committing
  bash('git add docs/README.md src/a.cpp', 'allow'),
  bash('git add -A', 'deny'),
  bash('git add .', 'deny'),
  bash('git add -u', 'deny'),
  bash('git add -- .', 'deny'),
  bash('git commit -am "x"', 'deny'),
  bash('git commit -a -m "x"', 'deny'),
  bash('git commit --amend --no-edit', 'ask'),
  bash('git commit -m "docs: plain"', 'allow'),
  bash('git commit -m "docs: plain" --no-verify', 'deny'),
  bash('git commit -n -m "docs: plain"', 'deny'),
  bash('git commit --author="x <y@z>" -m "docs: plain"', 'deny'),
  bash(HEREDOC_BAD, 'deny'),
  bash(HEREDOC_OK, 'allow'),
  bash('git commit -F "' + MSG + '/bad_msg.txt"', 'deny'),
  bash('git commit -F "' + MSG + '/good_msg.txt"', 'allow'),
  bash('git commit -m "feat: add thing\n\nGenerated with Claude Code"', 'deny'),
  bash('git commit -m "fix: thing" --trailer "Co-Authored-By: Claude <noreply@anthropic.com>"', 'deny'),
  bash('git commit -m "docs: close WP-07 report"', 'deny'),
  bash('git tag -a v1.0 -m "release 1.0 - Generated with tool"', 'deny'),
  bash('git merge --no-ff task/x -m "Merge task x"', 'allow'),
  bash('gh pr create --title "x" --body "Generated with Claude Code"', 'deny'),
  bash('gh pr create --title "x" --body "plain body"', 'allow'),
  bash('git -c user.email=ncrn39@gmail.com commit -m x', 'deny'),
  bash('GIT_AUTHOR_EMAIL=ncrn39@gmail.com git commit -m x', 'deny'),
  bash('git log --author=dev28', 'allow'),
  bash('git log --grep=ncrn39@gmail.com', 'allow'),
  bash('git config --global user.name foo', 'deny'),
  bash('git config --system core.autocrlf false', 'deny'),
  bash('git config --global --list', 'allow'),
  bash('git config user.name', 'allow'),
  bash('git config user.name dev28', 'allow'),
  bash('git config user.name someoneelse', 'deny'),
  bash('git config user.email devgbit@gmail.com', 'allow'),
  // --- push and remotes
  bash('git push origin main', 'ask'),
  bash('git push', 'ask'),
  bash('git push --force origin main', 'deny'),
  bash('git push -f origin main', 'deny'),
  bash('git push --force-with-lease origin main', 'ask'),
  bash('git push origin +main', 'deny'),
  bash('git remote -v', 'allow'),
  bash('git remote add origin https://example/x.git', 'ask'),
  bash('git fetch origin', 'allow'),
  // --- destructive git
  bash('git reset --hard HEAD~1', 'ask'),
  bash('git reset HEAD docs/x.md', 'allow'),
  bash('git clean -fd', 'ask'),
  bash('git clean -n', 'allow'),
  bash('git clean -fdx', 'deny'),
  bash('git checkout -- src/a.cpp', 'ask'),
  bash('git checkout main', 'allow'),
  bash('git switch -c feature/x', 'allow'),
  bash('git restore --staged x.md', 'allow'),
  bash('git restore x.md', 'ask'),
  bash('git branch -d task/done', 'allow'),
  bash('git branch -D task/x', 'ask'),
  bash('git stash drop', 'ask'),
  bash('git stash list', 'allow'),
  bash('git rebase main', 'ask'),
  bash('git tag -d sync/x', 'ask'),
  bash('git rm --cached AGENT.md', 'allow'),
  bash('git rm src/old.cpp', 'allow'),
  bash('git rm -r reference_source/x', 'deny'),
  bash('git worktree remove --force .wt/slot1', 'ask'),
  bash('git worktree list', 'allow'),
  bash('git reflog expire --expire=now --all', 'ask'),
  bash('git gc --prune=now', 'ask'),
  bash('bash -c "git push origin main"', 'ask'),
  // --- processes
  bash('taskkill /IM machine_runtime.exe /F', 'deny'),
  pwsh('Get-Process machine_ui | Stop-Process', 'deny'),
  pwsh('Get-Process machine_runtime,machine_ui -ErrorAction SilentlyContinue', 'allow'),
  bash('tasklist | grep -i machine_', 'allow'),
  bash('taskkill /IM other_tests.exe /F', 'ask'),
  pwsh('Stop-Process -Name findstr', 'ask'),
  bash('taskkill /PID 1234 /F', 'allow'),
  pwsh('Stop-Process -Id 1234', 'allow'),
  bash('kill 4321', 'allow'),
  bash('kill -9 4321', 'allow'),
  bash('pkill node', 'ask'),
  pwsh('Get-Process -Id 42 | Stop-Process', 'allow'),
  pwsh('Start-Process machine_ui.exe', 'deny'),
  bash('./build/bin/machine_runtime.exe --help', 'deny'),
  bash('start build/bin/machine_ui.exe', 'deny'),
  bash('./build/bin/other_tool.exe --help', 'allow'),
  // --- deletes inside and outside
  bash('rm -rf build/old', 'allow'),
  bash('rm -f tests/build/x.txt', 'allow'),
  bash('rm -rf build-wt/slot1', 'allow'),
  bash('rm -rf reference_source/x', 'deny'),
  bash('cd reference_source && rm -rf x', 'deny'),
  pwsh('Remove-Item -Recurse -Force "' + PS + '\\reference_source\\x"', 'deny'),
  pwsh('powershell -EncodedCommand ' + B64, 'deny'),
  bash('rm -rf .wt/slot1', 'ask'),
  bash('rm product_release/x.bundle', 'ask'),
  bash('rm -rf "' + OUTSIDE + '/old"', 'ask'),
  bash('rm -rf /c/build_packages/old', 'ask'),
  bash('rm -f "' + scratch.replace(/\\/g, '/') + '/x.txt"', 'allow'),
  bash('rm -f "$CLAUDE_SCRATCHPAD_DIR/x.txt"', 'allow'),
  bash('rm -f "$S/x.txt"', 'ask'),
  bash('rm -rf ~/old', 'ask'),
  bash('cd "' + OUTSIDE + '" && rm -rf old', 'ask'),
  bash('rm -rf .git', 'deny'),
  bash('rm -rf .claude', 'deny'),
  bash('rm -rf .claude/memory', 'deny'),
  bash('rm .claude/hooks/guard-shell.js', 'deny'),
  bash('rm .claude/settings.json', 'deny'),
  bash('rm -rf .claude/docs/notes/old.md', 'ask'),
  bash('rm -rf .', 'deny'),
  bash('rm -rf ' + PS, 'deny'),
  bash('rm -rf ./*', 'deny'),
  bash('rm -rf src/*', 'allow'),
  bash('cd src && rm -rf ../.git', 'deny'),
  bash('find build -name "*.obj" -size 0 -delete', 'allow'),
  bash('find reference_source -name "*.tmp" -delete', 'deny'),
  bash('find . -name "*.log" -exec rm {} \\;', 'ask'),
  bash('find src -name "*.log" -exec rm {} \\;', 'allow'),
  bash('find src -name "*.log" -delete', 'allow'),
  bash('cmake -E remove_directory build/x', 'allow'),
  bash('cmake -E remove_directory reference_source/x', 'deny'),
  bash('node -e "require(\'fs\').rmSync(\'build/x\', {recursive:true})"', 'allow'),
  bash('node -e "require(\'fs\').rmSync(\'reference_source/x\', {recursive:true})"', 'deny'),
  bash('python -c "import shutil; shutil.rmtree(\'reference_source/x\')"', 'deny'),
  bash('node -e "require(\'fs\').rmSync(process.env.X)"', 'ask'),
  bash('cat x | xargs rm', 'ask'),
  bash('bash -c "rm -rf reference_source/x"', 'deny'),
  bash('cmd /c "rd /s /q reference_source\\x"', 'deny'),
  bash('cmd /c "rd /s /q build\\x"', 'allow'),
  pwsh('[IO.File]::Delete("' + PS + '/reference_source/x/a.txt")', 'deny'),
  pwsh('[IO.File]::Delete("' + PS + '/build/a.txt")', 'allow'),
  bash('git -C "' + OUTSIDE + '" rm old.txt', 'ask'),
  // --- writes into protected places
  bash('mv src/a.cpp reference_source/y.cpp', 'deny'),
  bash('cp src/a.cpp reference_source/y.cpp', 'deny'),
  bash('cp src/a.cpp src/b.cpp', 'allow'),
  bash('mv src/a.cpp src/b.cpp', 'allow'),
  bash('mv reference_source/x src/x', 'deny'),
  bash('echo x > reference_source/x/a.txt', 'deny'),
  bash('echo x >> src/notes.txt', 'allow'),
  bash('echo x > .claude/hooks/guard-shell.js', 'deny'),
  bash('echo x > .claude/kit.config.json', 'deny'),
  bash('cat src/a.cpp 2>/dev/null', 'allow'),
  bash('sed -i "s/a/b/" reference_source/x/a.cpp', 'deny'),
  bash('sed -i "s/a/b/" src/a.cpp', 'allow'),
  bash('sed -n "1,5p" reference_source/x/a.cpp', 'allow'),
  bash('tee reference_source/x/a.txt < src/a.cpp', 'deny'),
  bash('robocopy src reference_source\\x /MIR', 'deny'),
  bash('robocopy src build\\copy /E', 'allow'),
  bash('cp src/a.cpp 3rdparty/lib/a.cpp', 'ask'),
  pwsh('Set-Content -Path reference_source/x/a.txt -Value x', 'deny'),
  pwsh('Copy-Item src/a.cpp -Destination reference_source/x/', 'deny'),
  pwsh('Move-Item -Path src/a.cpp -Destination src/b.cpp', 'allow'),
  // --- PowerShell source writes on a code-page machine
  pwsh('Set-Content -Path src/a.cpp -Value "int a;"', 'deny'),
  pwsh('Get-Content src/a.cpp | Set-Content src/b.cpp', 'deny'),
  pwsh('"int a;" | Out-File src/a.cpp', 'deny'),
  pwsh('"x" > src/a.cpp', 'deny'),
  pwsh('"x" > build/log.txt', 'allow'),
  pwsh('Set-Content -Path docs/notes.md -Value x', 'allow'),
  pwsh('Set-Content -Path app/translations/x_ja.ts -Value x', 'allow'),
  pwsh('Get-Content src/a.cpp', 'allow'),
  bash('echo x > src/a.cpp', 'allow'),
  // --- guard-edit
  edit(PS + '/src/a.cpp', 'int a; // plain', 'allow'),
  edit(PS + '/reference_source/x/a.cpp', 'x', 'deny'),
  edit(PS + '/3rdparty/lib/a.cpp', 'x', 'ask'),
  edit(PS + '/AGENTS.md', 'x', 'deny'),
  edit(PS + '/src/CLAUDE.md', 'x', 'deny'),
  edit(PS + '/.claude/CLAUDE.md', 'x', 'allow'),
  edit(PS + '/.claude/memory/MEMORY.md', 'x', 'deny'),
  edit(PS + '/.claude/core/rules/00-roles-and-models.md', 'x', 'deny'),
  edit(PS + '/.claude/hooks/guard-shell.js', 'x', 'deny'),
  edit(PS + '/.claude/rules/00-roles-and-models.md', 'x', 'deny'),
  edit(PS + '/.claude/rules/cpp-qmake-qt/qt-testing.md', 'x', 'deny'),
  edit(PS + '/.claude/agents/reviewer.md', 'x', 'deny'),
  edit(PS + '/.claude/skills/tdd-workflow/SKILL.md', 'x', 'deny'),
  edit(PS + '/.claude/commands/plan.md', 'x', 'deny'),
  edit(PS + '/.claude/tools/cpp-cmake-gtest/build.js', 'x', 'deny'),
  edit(PS + '/.claude/references/definition-of-done.md', 'x', 'deny'),
  edit(PS + '/.claude/rules/legacy-style.md', 'x', 'allow'),
  edit(PS + '/.claude/agents/my-own-agent.md', 'x', 'allow'),
  edit(PS + '/.claude/skills/project-skill/SKILL.md', 'x', 'allow'),
  edit('.claude/rules/00-roles-and-models.md', 'x', 'deny'),
  edit(PS + '/.claude/settings.json', 'x', 'ask'),
  edit(PS + '/.claude/kit.config.json', 'x', 'ask'),
  edit(PS + '/.claude/docs/plan/x.md', 'x', 'allow'),
  edit(PS + '/.claude/project/rules.md', 'x', 'allow'),
  edit('src/a.cpp', 'int a; // 5 deg', 'allow'),
  edit('src/a.cpp', ('int a; // 5' + U(0xB0)), 'deny'),
  edit('src/a.h', ('// arrow ' + U(0x2192)), 'deny'),
  edit('CMakeLists.txt', ('# ' + U(0x2014) + ' dash'), 'deny'),
  edit('qmake/app.pri', ('# ' + U(0x2014)), 'deny'),
  edit('scripts/run.ps1', ('# ' + U(0x2014)), 'deny'),
  edit('docs/guide.md', ('caf' + U(0xE9)), 'deny'),
  edit('README.md', ('caf' + U(0xE9)), 'deny'),
  edit('.claude/docs/notes/x.md', ('ti' + U(0x1EBF) + 'ng Vi' + U(0x1EC7) + 't'), 'allow'),
  edit('app/translations/x_ja.ts', (U(0x65E5) + U(0x672C)), 'allow'),
  edit('3rdparty/lib/x.h', (U(0xE9)), 'ask'),
  edit('components/vendor/x.cpp', (U(0xE9)), 'allow'),
  write('src/new.cpp', ('int b; // ' + U(0xB1) + ' 1'), 'deny'),
  write('src/new.cpp', 'int b; // +/- 1', 'allow'),
  ['guard-edit', { file_path: 'src/a.cpp', edits: [{ new_string: 'ok' }, { new_string: ('bad ' + U(0x2026)) }] }, 'deny', undefined, 'MultiEdit'],
  ['guard-edit', { notebook_path: 'nb/x.ipynb', new_source: 'print(1)' }, 'allow', undefined, 'NotebookEdit'],
  edit(OUTSIDE + '/CLAUDE.md', 'x', 'allow'),
  // --- subagent-model-guard
  agent({ subagent_type: 'implementer', model: 'sonnet', prompt: 'x' }, 'allow'),
  agent({ subagent_type: 'implementer', model: 'claude-sonnet-5-5', prompt: 'x' }, 'allow'),
  agent({ subagent_type: 'implementer', model: 'opus', prompt: 'x' }, 'deny'),
  agent({ subagent_type: 'reviewer', model: 'opus', prompt: 'x' }, 'allow'),
  agent({ subagent_type: 'reviewer', model: 'sonnet', prompt: 'x' }, 'deny'),
  agent({ subagent_type: 'cpp-reviewer', model: 'opus', prompt: 'x' }, 'allow'),
  agent({ subagent_type: 'Explore', model: 'sonnet', prompt: 'x' }, 'allow'),
  agent({ subagent_type: 'general-purpose', model: 'haiku', prompt: 'x' }, 'deny'),
  agent({ subagent_type: 'implementer', prompt: 'x' }, 'deny'),
  agent({ subagent_type: 'fork', model: 'sonnet', prompt: 'x' }, 'deny'),
  ['subagent-model-guard', null, 'deny'],
];

// ---- run -------------------------------------------------------------------------------------
let failures = 0;
let total = 0;
for (const c of cases) {
  const [hook, ti, expect, cwd, toolName] = c;
  const label = typeof ti === 'string' ? ti : JSON.stringify(ti);
  if (filter && !(hook + ' ' + label).includes(filter)) continue;
  total++;
  const toolInput = typeof ti === 'string' ? { command: ti } : ti;
  const r = runHook(hook, toolInput, cwd, toolName);
  const ok = r.decision === expect;
  if (!ok) failures++;
  const line = (ok ? 'ok   ' : 'FAIL ') + hook.padEnd(21) + expect.padEnd(6) + (ok ? '' : 'got ' + r.decision + '  ') + label.replace(/\n/g, '\\n').slice(0, 110);
  console.log(line);
  if (!ok) {
    if (r.reason) console.log('       reason: ' + r.reason.replace(/\n/g, ' | ').slice(0, 300));
    if (r.stderr) console.log('       stderr: ' + r.stderr.replace(/\n/g, ' | ').slice(0, 300));
  }
}

// ---- unit checks ---------------------------------------------------------------------------
function unit(name, fn) {
  total++;
  try { fn(); console.log('ok    unit                   ' + name); } catch (err) { failures++; console.log('FAIL  unit                   ' + name + ': ' + err.message); }
}
const assert = require('assert');
const cfgLib = require('./lib/config');
const schemaCandidates = [path.join(HOOKS, '..', '..', 'kit.config.schema.json'), path.join(HOOKS, '..', 'kit.config.schema.json'),
  path.join(HOOKS, '..', '..', '..', 'kit.config.schema.json')];
const schemaPath = schemaCandidates.find((p) => fs.existsSync(p));
if (schemaPath) {
  unit('DEFAULTS match kit.config.schema.json defaults', () => {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const fromSchema = (node) => {
      if (node.properties) {
        const o = {};
        for (const k of Object.keys(node.properties)) {
          const v = fromSchema(node.properties[k]);
          if (v !== undefined) o[k] = v;
        }
        return Object.keys(o).length || node.default === undefined ? (Object.keys(o).length ? o : node.default) : node.default;
      }
      return node.default;
    };
    const expected = fromSchema(schema);
    assert.deepStrictEqual(cfgLib.DEFAULTS, expected);
  });
}
const sync = require('./sync-memory');
unit('sync-memory mirrors and removes, restore never removes', () => {
  const g = path.join(T, 'global'); const m = path.join(T, 'mirror');
  fs.mkdirSync(g); fs.mkdirSync(m);
  fs.writeFileSync(path.join(g, 'MEMORY.md'), 'idx'); fs.writeFileSync(path.join(g, 'a.md'), 'a');
  fs.writeFileSync(path.join(m, 'stale.md'), 'old'); fs.writeFileSync(path.join(m, 'README.md'), 'keep');
  let r = sync.mirror(g, m, {});
  assert.deepStrictEqual(r.copied.sort(), ['MEMORY.md', 'a.md']);
  assert.deepStrictEqual(r.removed, ['stale.md']);
  assert.ok(fs.existsSync(path.join(m, 'README.md')));
  fs.writeFileSync(path.join(g, 'newer.md'), 'n');
  r = sync.mirror(m, g, { restore: true });
  assert.deepStrictEqual(r.removed, []);
  assert.ok(fs.existsSync(path.join(g, 'newer.md')));
  r = sync.mirror(g, m, { dry: true });
  assert.deepStrictEqual(r.copied, ['newer.md']);
  assert.ok(!fs.existsSync(path.join(m, 'newer.md')));
});
unit('sync-memory compare reports in sync, stale, differing and mirror-only files', () => {
  const g = path.join(T, 'g3'); const m = path.join(T, 'm3');
  fs.mkdirSync(g); fs.mkdirSync(m);
  fs.writeFileSync(path.join(g, 'MEMORY.md'), 'idx'); fs.writeFileSync(path.join(m, 'MEMORY.md'), 'idx');
  fs.writeFileSync(path.join(m, 'README.md'), 'about the mirror');
  let c = sync.compare(g, m);
  assert.ok(c.inSync); assert.deepStrictEqual(c.mirrorOnly, ['README.md']);
  fs.writeFileSync(path.join(g, 'a.md'), 'a'); fs.writeFileSync(path.join(m, 'stale.md'), 'old'); fs.writeFileSync(path.join(m, 'MEMORY.md'), 'changed');
  c = sync.compare(g, m);
  assert.ok(!c.inSync);
  assert.deepStrictEqual(c.globalOnly, ['a.md']); assert.deepStrictEqual(c.stale, ['stale.md']); assert.deepStrictEqual(c.differ, ['MEMORY.md']);
});
unit('sync-memory refuses a source without MEMORY.md', () => {
  const g = path.join(T, 'g2'); const m = path.join(T, 'm2');
  fs.mkdirSync(g); fs.mkdirSync(m); fs.writeFileSync(path.join(m, 'x.md'), 'x');
  const r = sync.mirror(g, m, {});
  assert.ok(r.skipped); assert.ok(fs.existsSync(path.join(m, 'x.md')));
});
unit('format.js is inert without a formatter config', () => {
  const fmt = require('./format');
  const before = fs.readFileSync(path.join(P, 'src', 'a.cpp'), 'utf8');
  fmt.main({ tool_input: { file_path: path.join(P, 'src', 'a.cpp') }, cwd: P });
  assert.strictEqual(fs.readFileSync(path.join(P, 'src', 'a.cpp'), 'utf8'), before);
});
unit('all hook sources are ASCII', () => {
  const walk = (d) => fs.readdirSync(d).flatMap((f) => { const p = path.join(d, f); return fs.statSync(p).isDirectory() ? walk(p) : [p]; });
  for (const f of walk(HOOKS).filter((f) => f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.md'))) {
    if (path.basename(f) === 'test-hooks.js') continue;
    const m = fs.readFileSync(f, 'utf8').match(/[^\x00-\x7F]/);
    assert.ok(!m, path.basename(f) + ' has non-ASCII U+' + (m ? m[0].codePointAt(0).toString(16) : ''));
  }
});

console.log('\nfailures: ' + failures + ' / ' + total);
try { fs.rmSync(T, { recursive: true, force: true }); } catch (_) { /* temp */ }
process.exit(failures ? 1 : 0);
