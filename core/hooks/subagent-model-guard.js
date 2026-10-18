#!/usr/bin/env node
// PreToolUse hook, matcher: Agent.
// Every sub agent runs on the model kit.config.json names for its role:
//   models.worker   - implementer, tester, build-resolver, explorer, Explore, Plan,
//                     general-purpose and any other type
//   models.reviewer - reviewer (and any type whose name contains "review")
//   models.forceAll - when true, every type must use models.worker
// The call must pass `model` explicitly (rule 00-roles-and-models: never rely on inheritance).
// `subagent_type: "fork"` is denied unless models.allowFork is true (a fork carries the leader's
// context and model).
// Fails CLOSED: unreadable input denies the call. Output: PreToolUse JSON deny with the reason.
'use strict';

const { run } = require('./lib/io');
const config = require('./lib/config');

function family(model) {
  const m = String(model || '').toLowerCase();
  const hit = m.match(/sonnet|opus|haiku|fable|mythos/);
  return hit ? hit[0] : m;
}

function main(input, d) {
  const ti = input.tool_input;
  if (!ti || typeof ti !== 'object') { d.deny('the hook input has no tool_input.'); return; }
  const { cfg } = config.load(input);
  const models = cfg.models || {};
  const type = String(ti.subagent_type || '').toLowerCase();
  const model = ti.model;

  if (type === 'fork' && !models.allowFork) {
    d.deny('subagent_type "fork" inherits the leader\'s context and model; use a named agent type and pass model explicitly (models.allowFork is false).');
    return;
  }
  const isReviewer = !models.forceAll && /review/.test(type);
  const want = isReviewer ? models.reviewer : models.worker;
  if (model === undefined || model === null || String(model).trim() === '') {
    d.deny('pass "model" explicitly on every Agent call (rule 00-roles-and-models): ' +
      (isReviewer ? 'reviewers' : 'workers') + ' run on "' + want + '".');
    return;
  }
  if (family(model) !== family(want)) {
    d.deny('model "' + model + '" was requested for "' + (type || 'unnamed') + '"; this role runs on "' + want + '" ' +
      '(kit.config.json models.' + (isReviewer ? 'reviewer' : 'worker') + ').');
  }
}

module.exports = { main };

if (require.main === module) run('subagent-model-guard', main, { failMode: 'closed' });
