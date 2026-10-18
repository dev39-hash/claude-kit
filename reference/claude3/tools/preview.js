#!/usr/bin/env node
// Creates a preview version under build-preview/ (project root, gitignored).
//
//   node .claude/tools/preview.js <label> [--note "what changed"] [--exe <path>] [--filter <gtest filter>] [--clean-export]
//
// --clean-export: the executable was built from a clean export of HEAD (git checkout-index), so
// uncommitted changes in the working tree do not apply and the version is not marked -dirty.
//
// Runs the Release regression executable in preview mode (--preview-dir), which writes one
// annotated PNG per golden case into <version>/<suite>/<case>.png and <version>/summary.tsv,
// then writes <version>/README.md (metadata, how to reproduce, totals, changes since the
// previous version, per-suite tables) and regenerates build-preview/README.md (index of all
// versions). Never deletes anything.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const previewRoot = path.join(root, 'build-preview');
const defaultExe = path.join(root, 'build', 'tests', 'regression', 'Release', 'mtc_regression.exe');

function parseArgs(argv) {
  const out = { label: null, note: '', exe: defaultExe, filter: null, cleanExport: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--note') out.note = argv[++i] || '';
    else if (a === '--exe') out.exe = path.resolve(argv[++i]);
    else if (a === '--filter') out.filter = argv[++i];
    else if (a === '--clean-export') out.cleanExport = true;
    else if (!out.label) out.label = a;
  }
  return out;
}

function git(args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}

function pad(n, w) { return String(n).padStart(w, '0'); }

function stamp(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}-${pad(d.getHours(), 2)}${pad(d.getMinutes(), 2)}`;
}

function listVersions() {
  if (!fs.existsSync(previewRoot)) return [];
  return fs.readdirSync(previewRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{3}_/.test(e.name))
    .map((e) => e.name)
    .sort();
}

function readSummary(dir) {
  const f = path.join(dir, 'summary.tsv');
  if (!fs.existsSync(f)) return null;
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  const header = lines[0].split('\t');
  return lines.slice(1).map((l) => {
    const cols = l.split('\t');
    const row = {};
    header.forEach((h, i) => { row[h] = cols[i] === undefined ? '' : cols[i]; });
    return row;
  });
}

function totals(rows) {
  const t = { pass: 0, fail: 0, skip: 0 };
  for (const r of rows) if (t[r.status] !== undefined) t[r.status]++;
  return t;
}

function num(v) { const x = parseFloat(v); return Number.isFinite(x) ? x : null; }

function diffRows(prev, cur) {
  if (!prev) return ['No previous version with a summary.'];
  const key = (r) => `${r.suite}/${r.case}`;
  const pm = new Map(prev.map((r) => [key(r), r]));
  const cm = new Map(cur.map((r) => [key(r), r]));
  const results = [];
  const timing = [];
  for (const r of cur) {
    const p = pm.get(key(r));
    if (!p) { results.push(`- new case \`${key(r)}\`: ${r.status}, ${r.objects} objects`); continue; }
    const notes = [];
    if (p.status !== r.status) notes.push(`status ${p.status} -> ${r.status}`);
    if (p.objects !== r.objects) notes.push(`objects ${p.objects} -> ${r.objects}`);
    const ds = (num(r.max_score) !== null && num(p.max_score) !== null) ? num(r.max_score) - num(p.max_score) : 0;
    if (Math.abs(ds) > 0.005) notes.push(`best score ${p.max_score} -> ${r.max_score}`);
    const pe = num(p.max_pos_err), ce = num(r.max_pos_err);
    if (pe !== null && ce !== null && Math.abs(ce - pe) > 0.05) notes.push(`max position error ${p.max_pos_err} -> ${r.max_pos_err} px`);
    if (notes.length) results.push(`- \`${key(r)}\`: ${notes.join(', ')}`);
    const pt = num(p.search_ms), ct = num(r.search_ms);
    if (pt !== null && ct !== null && pt > 0 && (ct / pt > 1.5 || ct / pt < 0.67)) timing.push(`- \`${key(r)}\`: ${p.search_ms} -> ${r.search_ms} ms`);
  }
  for (const r of prev) if (!cm.has(key(r))) results.push(`- removed case \`${key(r)}\``);
  const out = ['### Results (status, object count, best score > 0.005, position error > 0.05 px)', ''];
  out.push(...(results.length ? results : ['No result changes.']));
  out.push('', '### Timing only (beyond 1.5x; indicative, the machine may have been busy)', '');
  out.push(...(timing.length ? timing : ['No timing changes beyond 1.5x.']));
  return out;
}

function suiteTables(rows) {
  const suites = [...new Set(rows.map((r) => r.suite))];
  const out = [];
  for (const s of suites) {
    const rs = rows.filter((r) => r.suite === s);
    const t = totals(rs);
    out.push(`### ${s} (${t.pass} pass, ${t.fail} fail, ${t.skip} skip)`, '');
    out.push('| Case | Status | Objects lib / golden | Score min..max | Max err pos / angle / score | States | ms | Image |');
    out.push('|---|---|---|---|---|---|---|---|');
    for (const r of rs) {
      const img = `[png](${s}/${r.case}.png)`;
      out.push(`| ${r.case} | ${r.status} | ${r.objects} / ${r.golden_objects} | ${r.min_score}..${r.max_score} | ${r.max_pos_err} / ${r.max_angle_err} / ${r.max_score_err} | ${r.state_mismatches} | ${r.search_ms} | ${img} |`);
    }
    const notes = rs.filter((r) => r.note && r.note !== '-');
    if (notes.length) {
      out.push('', 'Notes:', '');
      for (const r of notes) out.push(`- ${r.case}: ${r.note}`);
    }
    out.push('');
  }
  return out;
}

function writeIndex() {
  const versions = listVersions();
  const lines = ['# Preview versions', '',
    'Annotated matcher output for every golden case, one folder per library change.',
    'Green/red boxes: library objects (Ok/Ng); cyan: golden poses; yellow: clearance zones.',
    'Created by the lead after each change; old versions are kept until you delete them.', '',
    '| Version | Date | Commit | Label | Pass / fail / skip |', '|---|---|---|---|---|'];
  for (const v of versions.slice().reverse()) {
    const dir = path.join(previewRoot, v);
    const meta = fs.existsSync(path.join(dir, 'meta.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')) : {};
    const rows = readSummary(dir);
    const t = rows ? totals(rows) : null;
    lines.push(`| [${v.slice(0, 3)}](${v}/README.md) | ${meta.date || ''} | ${meta.sha || ''} | ${meta.label || ''} | ${t ? `${t.pass} / ${t.fail} / ${t.skip}` : 'no summary'} |`);
  }
  fs.writeFileSync(path.join(previewRoot, 'README.md'), lines.join('\n') + '\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.label) {
    console.error('usage: preview.js <label> [--note "what changed"] [--exe <path>] [--filter <gtest filter>]');
    process.exit(2);
  }
  if (!fs.existsSync(args.exe)) {
    console.error('[preview] regression executable not found: ' + args.exe + ' (build it in Release first)');
    process.exit(1);
  }
  fs.mkdirSync(previewRoot, { recursive: true });
  const versions = listVersions();
  const next = versions.length ? parseInt(versions[versions.length - 1].slice(0, 3), 10) + 1 : 1;
  const now = new Date();
  const sha = git(['rev-parse', '--short', 'HEAD']) || 'nogit';
  const dirty = !args.cleanExport && git(['status', '--porcelain', '--', 'src', 'include', 'tests']) ? '-dirty' : '';
  const label = args.label.replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 40);
  const name = `${pad(next, 3)}_${stamp(now)}_${sha}${dirty}_${label}`;
  const dir = path.join(previewRoot, name);
  fs.mkdirSync(dir, { recursive: true });

  const exeArgs = ['--preview-dir', dir];
  if (args.filter) exeArgs.push('--gtest_filter=' + args.filter);
  const t0 = Date.now();
  const run = spawnSync(args.exe, exeArgs, { cwd: path.dirname(args.exe), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  fs.writeFileSync(path.join(dir, 'run.log'), (run.stdout || '') + (run.stderr || ''));

  const rows = readSummary(dir) || [];
  const t = totals(rows);
  let prevRows = null;
  let prevName = '';
  for (let i = versions.length - 1; i >= 0; i--) {
    const r = readSummary(path.join(previewRoot, versions[i]));
    if (r) { prevRows = r; prevName = versions[i]; break; }
  }
  const subject = git(['log', '-1', '--format=%s']);
  const meta = { version: next, date: `${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)} ${pad(now.getHours(), 2)}:${pad(now.getMinutes(), 2)}`, sha: sha + dirty, subject, label: args.label, note: args.note, exitCode: run.status, seconds };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');

  const relExe = path.relative(root, args.exe).split(path.sep).join('/');
  const lines = [
    `# Preview ${pad(next, 3)}: ${args.label}`, '',
    `- Date: ${meta.date}`,
    `- Commit: \`${sha}${dirty}\` ${subject}${dirty ? ' (plus uncommitted changes in src/, include/ or tests/)' : ''}`,
    `- What changed: ${args.note || args.label}`,
    `- Regression run: exit code ${run.status}, ${seconds} s, ${rows.length} cases (${t.pass} pass, ${t.fail} fail, ${t.skip} skip)`,
    `- Previous version: ${prevName || 'none'}`, '',
    'Legend: green box = library object with verdict Ok, red = Ng, red dot = anchor, number = score;',
    'cyan polygon and cross = golden pose; yellow = clearance zones; header band = case summary.',
    'Times (ms) come from this preview run and are indicative only: the machine may be busy with builds.', '',
    '## Reproduce', '',
    '```', `${relExe} --preview-dir <folder>${args.filter ? ' --gtest_filter=' + args.filter : ''}`, '```', '',
    '## Changes since the previous version', '',
    ...diffRows(prevRows, rows), '',
    '## Cases', '',
    ...suiteTables(rows),
    'Full test output: [run.log](run.log). Raw table: [summary.tsv](summary.tsv).', '',
  ];
  fs.writeFileSync(path.join(dir, 'README.md'), lines.join('\n'));
  writeIndex();
  console.log(`[preview] ${path.relative(root, dir)}: ${t.pass} pass, ${t.fail} fail, ${t.skip} skip (exit ${run.status})`);
}

main();
