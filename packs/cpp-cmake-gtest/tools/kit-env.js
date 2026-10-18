'use strict';
// Shared by the pack tools: find the project root and load kit.config.json through the kit's
// config loader. Works from the installed layout (<root>/.claude/tools/<pack>/) and from the
// kit repository (packs/<pack>/tools/) for tests.
const fs = require('fs');
const path = require('path');

function findConfigLib() {
  const candidates = [
    path.join(__dirname, '..', '..', 'hooks', 'lib', 'config.js'),            // installed
    path.join(__dirname, '..', '..', '..', 'core', 'hooks', 'lib', 'config.js'), // kit repo
  ];
  for (const c of candidates) if (fs.existsSync(c)) return require(c);
  throw new Error('kit config loader not found next to ' + __dirname);
}

function loadConfig() {
  const lib = findConfigLib();
  if (!process.env.CLAUDE_PROJECT_DIR) {
    // <root>/.claude/tools/<pack>/kit-env.js -> <root>
    const guess = path.resolve(__dirname, '..', '..', '..');
    if (fs.existsSync(path.join(guess, '.claude'))) process.env.CLAUDE_PROJECT_DIR = guess;
  }
  return lib.load(null);
}

function packConfig(cfg) {
  return (cfg.packConfig && cfg.packConfig['cpp-cmake-gtest']) || {};
}

module.exports = { loadConfig, packConfig };
