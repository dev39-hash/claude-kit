'use strict';
// Shared by the pack tools and hooks: find the project root and load kit.config.json through
// the kit's config loader; expose the pack's own settings (packConfig["controller-kernel"]).
// Works from the installed layout (<root>/.claude/tools/<pack>/) and from the kit repository
// (packs/<pack>/tools/) for tests.
const fs = require('fs');
const path = require('path');

const PACK = 'controller-kernel';

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

// Defaults for packConfig["controller-kernel"]; documented in the pack README.
const DEFAULTS = {
  kernelInclude: 'ctrl_kernel',
  coreDirs: ['core', '*_core'],
  shellDirs: ['qt', 'shell', '*_shell', 'adapter', 'adapters'],
  policyFiles: ['*policy*'],
  walkDirs: ['include', 'examples', 'qt', 'tests', 'src', 'cmake'],
  literalGate: 'warning',
  extraImpureHeaders: [],
  docsGate: 'error',
  docsExtraPatterns: [],
};

function packConfig(cfg) {
  const user = (cfg.packConfig && cfg.packConfig[PACK]) || {};
  const out = Object.assign({}, DEFAULTS);
  for (const k of Object.keys(user)) if (user[k] !== undefined && user[k] !== null) out[k] = user[k];
  return out;
}

module.exports = { PACK, DEFAULTS, lib, loadConfig, packConfig };
