'use strict';
// Loads <project>/.claude/kit.config.json and fills every missing key from DEFAULTS.
// DEFAULTS must stay identical to the `default` values in kit.config.schema.json; test-hooks.js
// checks that when the schema is reachable.
//
// Project root resolution order: CLAUDE_PROJECT_DIR, then the folder two levels above
// `.claude/hooks/` (this file lives in `.claude/hooks/lib/`), then the hook input's cwd.
// Override the config file for tests with CLAUDE_KIT_CONFIG=<path>.

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  kitVersion: '0.1.0',
  project: {
    name: '', description: '', root: '$CLAUDE_PROJECT_DIR',
    leadTitle: 'Project Leader', replyLanguage: 'vi', artifactLanguage: 'en',
  },
  models: { worker: 'sonnet', reviewer: 'opus', forceAll: false, allowFork: false },
  gates: { plan: 'human', commit: 'human' },
  git: {
    identity: { name: '', email: '' },
    deniedEmails: [],
    aiAttribution: 'deny',
    forbiddenPhrases: [],
    conventionalCommits: true,
    commitCadence: 'task',
    whoCommits: 'leader',
    push: 'ask',
    forcePush: 'ask-with-lease',
    integrationBranch: 'main',
    branchPattern: 'task/{id}-{slug}',
    gitExe: '',
  },
  paths: {
    readOnly: [],
    askBeforeEdit: [],
    localOnly: ['.claude/'],
    protectedDelete: ['.git/', '.claude', '.claude/memory/', '.claude/core/', '.claude/packs/',
      '.claude/hooks/', '.claude/settings.json', '.claude/kit.config.json'],
    forbiddenTreeFiles: ['CLAUDE.md', 'AGENTS.md', 'AGENT.md'],
    memoryMirror: '.claude/memory',
    docs: '.claude/docs',
    tasks: '.claude/tasks',
    scratch: '.claude/scratch',
    tempRoots: [],
    docsGateRoots: ['README.md', 'docs/'],
  },
  processes: {
    neverKill: [], neverLaunch: [],
    busyBeforeTests: ['cl', 'link', 'nmake', 'jom', 'ninja', 'msbuild'],
    testPorts: [],
  },
  environment: {
    persistentWrites: 'ask',
    protectedVars: [],
  },
  encoding: {
    asciiExtensions: ['.cpp', '.cc', '.cxx', '.h', '.hpp', '.hh', '.inl', '.ipp', '.ui', '.qrc', '.qss',
      '.pro', '.pri', '.prf', '.cmake', 'CMakeLists.txt', '.bat', '.cmd', '.ps1', '.py', '.js', '.json'],
    asciiExempt: ['*.ts', '3rdparty/', 'components/', '_deps/', 'third_party/'],
    asciiRepoMarkdown: true,
    codePage: '',
  },
  build: {
    isolation: 'slots',
    slots: { dir: 'build-wt', count: 8, staleHours: 3 },
    worktrees: { dir: '.wt', count: 4, prepareCommand: '' },
    leadBuildDir: 'build',
    buildDirPatterns: ['build/', 'build-*', 'out/', '_deps/', 'third_party/', '.vs/', '.idea/', 'node_modules/'],
    toolchain: {},
    formatOnEdit: 'if-config-present',
    warningsAsErrors: true,
  },
  hooks: {
    runtime: 'node',
    failMode: 'open',
    autoMode: {
      modes: ['auto', 'bypassPermissions'],
      askToDeny: ['push', 'envWrite', 'askBeforeEdit', 'localOnlyDelete', 'destructiveGit'],
    },
    timeoutSeconds: { guard: 10, format: 30, stop: 15 },
  },
  packs: [],
  packConfig: {},
};

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

function merge(base, over) {
  if (!isObj(over)) return base;
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  for (const k of Object.keys(over)) {
    const v = over[k];
    if (isObj(v) && isObj(base[k])) out[k] = merge(base[k], v);
    else if (v !== undefined) out[k] = v;
  }
  return out;
}

function clone(v) { return JSON.parse(JSON.stringify(v)); }

function hookDirRoot() {
  // <root>/.claude/hooks/lib/config.js -> <root>
  const guess = path.resolve(__dirname, '..', '..', '..');
  return fs.existsSync(path.join(guess, '.claude')) ? guess : null;
}

function projectRoot(input) {
  const env = process.env.CLAUDE_PROJECT_DIR;
  if (env) return path.resolve(env);
  const byDir = hookDirRoot();
  if (byDir) return byDir;
  if (input && input.cwd) return path.resolve(String(input.cwd));
  return process.cwd();
}

function configPath(root) {
  return process.env.CLAUDE_KIT_CONFIG || path.join(root, '.claude', 'kit.config.json');
}

// Returns { cfg, root, source }. source is 'file' or 'defaults'.
function load(input) {
  const root = projectRoot(input);
  const file = configPath(root);
  let cfg = clone(DEFAULTS);
  let source = 'defaults';
  try {
    const text = fs.readFileSync(file, 'utf8').replace(new RegExp('^' + String.fromCharCode(0xFEFF)), '');
    cfg = merge(cfg, JSON.parse(text));
    source = 'file';
  } catch (_) { /* no config: defaults apply */ }
  if (!cfg.project.root || cfg.project.root === '$CLAUDE_PROJECT_DIR') cfg.project.root = root;
  return { cfg, root: path.resolve(cfg.project.root), source };
}

module.exports = { DEFAULTS, merge, load, projectRoot, configPath };
