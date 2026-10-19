'use strict';
// Shared I/O for every hook: stdin with a safety timer, decision output in the PreToolUse JSON
// protocol (allow / ask / deny), PostToolUse context, and the fail-open / fail-closed wrapper.
//
// Decision protocol: a hook collects reasons with `d.deny(...)` / `d.ask(...)`; `d.emit()` prints
// the strongest decision (deny > ask) with every reason, or nothing at all when the call is
// allowed (no output = the normal permission flow continues). Exit code is always 0 for guards;
// the harness reads the JSON. `exit2` exists for hooks that must hard-block (PostToolUse gates).

const fs = require('fs');

function readStdin(cb, ms) {
  let raw = '';
  let done = false;
  const finish = () => { if (!done) { done = true; cb(raw); } };
  const timer = setTimeout(finish, ms || 4000);
  try {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { raw += c; });
    process.stdin.on('end', () => { clearTimeout(timer); finish(); });
    process.stdin.on('error', () => { clearTimeout(timer); finish(); });
  } catch (_) { clearTimeout(timer); finish(); }
}

function say(msg) { try { fs.writeSync(2, msg.endsWith('\n') ? msg : msg + '\n'); } catch (_) { /* ignore */ } }

function parseInput(raw) {
  try { return JSON.parse(raw || '{}') || {}; } catch (_) { return null; }
}

class Decisions {
  constructor(tag, event) {
    this.tag = tag;
    this.event = event || 'PreToolUse';
    this.denies = [];
    this.asks = [];
    this.askCats = [];
    this.unattended = null;
  }
  deny(reason) { if (reason) this.denies.push(reason); return this; }
  // category: what kind of ask this is (push, envWrite, askBeforeEdit, localOnlyDelete,
  // destructiveGit, kitConfig, inPlaceEdit, unresolvedDelete, killByName, remote); see
  // escalate() and hooks.autoMode in kit.config.json.
  ask(reason, category) { if (reason) { this.asks.push(reason); this.askCats.push(category || ''); } return this; }
  // In a permission mode where an ask does not reach the human (auto, bypassPermissions: the
  // command ran without a prompt on 2026-10-18), an ask of a listed category becomes a deny.
  // Call once, after main(), with the hook input and the loaded config.
  escalate(input, cfg) {
    const mode = String((input && input.permission_mode) || '');
    const am = (cfg && cfg.hooks && cfg.hooks.autoMode) || {};
    const modes = am.modes || [];
    const cats = am.askToDeny || [];
    if (!mode || !modes.includes(mode)) return this;
    const keep = [], keepCats = [];
    for (let i = 0; i < this.asks.length; i++) {
      if (cats.includes(this.askCats[i])) {
        this.denies.push(this.asks[i] + ' Permission mode is "' + mode + '": an ask would not reach the human, so it is denied ' +
          '(hooks.autoMode.askToDeny "' + this.askCats[i] + '"). Ask the human in chat; they run the command themselves or ' +
          'approve it outside ' + mode + ' mode. Do not work around this guard.');
      } else { keep.push(this.asks[i]); keepCats.push(this.askCats[i]); }
    }
    this.asks = keep;
    this.askCats = keepCats;
    this.unattended = mode;
    return this;
  }
  get decision() { return this.denies.length ? 'deny' : this.asks.length ? 'ask' : 'allow'; }
  reasonText() {
    const list = this.denies.length ? this.denies : this.asks;
    const uniq = [...new Set(list)];
    return uniq.length === 1 ? uniq[0] : uniq.map((r) => '- ' + r).join('\n');
  }
  emit() {
    const decision = this.decision;
    if (decision === 'allow') return 'allow';
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: this.event,
        permissionDecision: decision,
        permissionDecisionReason: '[' + this.tag + '] ' + this.reasonText(),
      },
    }));
    return decision;
  }
}

// PostToolUse hooks cannot ask; they can only add context or hard-block with exit 2.
function postContext(text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text },
  }));
}

// Run a hook: parse stdin, call main(input, d), emit. failMode 'open' allows on internal error
// (with a stderr note); 'closed' denies.
function run(tag, main, opts) {
  const o = opts || {};
  const failMode = o.failMode || 'open';
  readStdin((raw) => {
    const d = new Decisions(tag, o.event);
    try {
      const input = parseInput(raw);
      if (input === null) {
        if (failMode === 'closed') d.deny('the hook input could not be parsed as JSON');
        else say('[' + tag + '] unreadable hook input, allowing');
      } else {
        main(input, d);
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      if (failMode === 'closed') d.deny('internal error: ' + msg);
      else say('[' + tag + '] internal error, allowing: ' + msg);
    }
    d.emit();
    process.exit(0);
  }, o.stdinTimeout);
}

module.exports = { readStdin, say, parseInput, Decisions, postContext, run };
