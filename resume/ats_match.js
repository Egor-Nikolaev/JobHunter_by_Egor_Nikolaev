#!/usr/bin/env node
// ATS matcher: read a job description, return the skills that are BOTH in your
// skills-bank AND present in the JD. No secrets, no personal data.
//
// Usage:
//   node resume/ats_match.js <jd.txt|-> [--json]
//   cat jd.txt | node resume/ats_match.js -
//
// Reads config/skills-bank.json, falling back to config/skills-bank.example.json
// so it runs out of the box before you have created your own bank.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const bankPath = ['config/skills-bank.json', 'config/skills-bank.example.json']
  .map(p => path.join(ROOT, p))
  .find(p => fs.existsSync(p));
if (!bankPath) { console.error('No skills bank found in config/.'); process.exit(1); }
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8')).categories;

const arg = process.argv[2];
if (!arg) { console.error('usage: node resume/ats_match.js <jd.txt|-> [--json]'); process.exit(1); }
const jdRaw = arg === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(arg, 'utf8');
const jd = jdRaw.toLowerCase();

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function hit(syn) {
  for (const s of syn) {
    // word-boundary-ish match; allow a trailing letter run so stems match inflections
    const p = '(?<![\\p{L}\\p{N}])' + esc(s) + (/[a-zа-яё]$/i.test(s) ? '\\p{L}*' : '');
    if (new RegExp(p, 'iu').test(jd)) return s;
  }
  return null;
}

const matched = {};
let total = 0, hitCount = 0;
for (const [cat, items] of Object.entries(bank)) {
  const m = [];
  for (const it of items) { total++; const h = hit(it.syn); if (h) { hitCount++; m.push({ kw: it.kw, via: h }); } }
  if (m.length) matched[cat] = m;
}

// Categories that appear on the one-line Skills row of the resume (edit to taste).
const ORDER = ['Product', 'Project / Delivery', 'AI / Automation', 'Tools', 'Compliance / Certs', 'Domains'];
const label = c => c.replace(' / Delivery', '').replace('AI / Automation', 'AI').replace(' / Certs', '');
const skillsLine = ORDER.filter(c => matched[c]).map(c =>
  `\\textbf{${label(c)}:} ` + matched[c].map(x => x.kw).join(' \\textperiodcentered ')
).join(' \\textbf{|} ');

const coverage = total ? Math.round(100 * hitCount / total) : 0;

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ coverage, hitCount, total, matched, skillsLine }, null, 1));
} else {
  console.log('=== ATS MATCH ===');
  console.log(`Bank coverage: ${hitCount}/${total} skills present in JD (${coverage}%)`);
  for (const [cat, m] of Object.entries(matched)) {
    console.log('\n[' + cat + '] ' + m.map(x => `${x.kw} (JD:"${x.via}")`).join(', '));
  }
  console.log('\n=== READY SKILLS LINE (for cv.tex) ===');
  console.log(skillsLine);
}
