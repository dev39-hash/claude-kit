'use strict';
// Shared by the pack tools: find the project root and load kit.config.json through the kit's
// config loader. Works from the installed layout (<root>/.claude/tools/<pack>/) and from the
// kit repository (packs/<pack>/tools/) for tests.
const fs = require('fs');
const path = require('path');

const PACK = 'docs-spec-driven';

function lib(name) {
  const candidates = [
    path.join(__dirname, '..', '..', 'hooks', 'lib', name + '.js'),              // installed
    path.join(__dirname, '..', '..', '..', 'core', 'hooks', 'lib', name + '.js'), // kit repo
  ];
  for (const c of candidates) if (fs.existsSync(c)) return require(c);
  throw new Error('kit hook lib not found: ' + name + ' (looked next to ' + __dirname + ')');
}

function loadConfig() {
  const config = lib('config');
  if (!process.env.CLAUDE_PROJECT_DIR) {
    // <root>/.claude/tools/<pack>/kit-env.js -> <root>
    const guess = path.resolve(__dirname, '..', '..', '..');
    if (fs.existsSync(path.join(guess, '.claude'))) process.env.CLAUDE_PROJECT_DIR = guess;
  }
  return config.load(null);
}

const DEFAULTS = {
  specDir: 'docs/spec',
  plansDir: 'docs/history/plan',
  historyDir: 'docs/history',
  requestsDir: 'docs/_retired',
  adrFile: 'docs/architecture/architecture_decisions.md',
  adrPrefix: 'D',
  backlogFile: 'docs/backlog.md',
  backlogPrefix: 'BL',
  changelog: 'CHANGELOG.md',
  vendorDirs: ['components/', '3rdparty/', 'third_party/', '_deps/', 'node_modules/'],
  exemptPaths: ['LICENSE*', 'NOTICE*', 'COPYING*', '*.license', '*.min.js'],
  urlAllow: ['xmlns', 'DOCTYPE', 'SPDX-License', 'schemas.', 'w3.org'],
  machinePathAllow: [],
  extraPhaseWords: [],
  codeExtensions: ['.c', '.cc', '.cpp', '.cxx', '.h', '.hpp', '.hxx', '.inl', '.py', '.js', '.ts', '.cs', '.java',
    '.go', '.rs', '.cmake', '.pro', '.pri', '.ps1', '.bat', '.sh', '.ui', '.qss', '.qrc'],
  docExtensions: ['.md', '.rst', '.adoc', '.txt'],
};

function packConfig(cfg) {
  const user = (cfg.packConfig && cfg.packConfig[PACK]) || {};
  const out = Object.assign({}, DEFAULTS);
  for (const k of Object.keys(user)) if (user[k] !== undefined && user[k] !== null) out[k] = user[k];
  return out;
}

module.exports = { PACK, DEFAULTS, lib, loadConfig, packConfig };
