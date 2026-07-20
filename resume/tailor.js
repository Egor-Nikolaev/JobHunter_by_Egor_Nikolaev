#!/usr/bin/env node
// Tailor a resume to one vacancy: run the ATS match, inject the matched skills
// row + an optional headline into a LaTeX template, compile a PDF with tectonic.
// No secrets, no personal data. All paths are relative to the repo root.
//
// Usage:
//   node resume/tailor.js <slug> <en|ru> <jd.txt> "<optional headline>"
// Example:
//   node resume/tailor.js acme-pm en examples/sample_jd.txt "Product Manager (AI)"
//
// Output: output/<slug>/cv.tex and output/<slug>/cv.pdf (PDF requires tectonic).
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const [slug, lang, jdFile, headline] = process.argv.slice(2);
if (!slug || !lang || !jdFile) {
  console.error('usage: node resume/tailor.js <slug> <en|ru> <jd.txt> "<headline>"');
  process.exit(1);
}
if (!fs.existsSync(jdFile)) { console.error('JD file not found: ' + jdFile); process.exit(1); }

const tpl = lang === 'ru' ? 'cv_ru.tex' : 'cv_en.tex';
const tplPath = path.join(ROOT, 'resume', 'templates', tpl);
if (!fs.existsSync(tplPath)) { console.error('template not found: ' + tplPath); process.exit(1); }

const outDir = path.join(ROOT, 'output', slug);
fs.mkdirSync(outDir, { recursive: true });
const cvPath = path.join(outDir, 'cv.tex');
fs.copyFileSync(tplPath, cvPath);
fs.copyFileSync(jdFile, path.join(outDir, 'jd.txt'));

// Run the matcher and read back its JSON.
const matchJson = execSync(
  `node "${path.join(__dirname, 'ats_match.js')}" "${jdFile}" --json`
).toString();
const m = JSON.parse(matchJson);

// Final Skills row = matched skills by category, plus a small "core" set you
// always want to advertise (edit these to your own always-on skills).
const CORE = {
  'AI / Automation': ['LLM Integration', 'AI Orchestration', 'Python', 'REST API'],
  'Tools': ['Jira', 'Confluence', 'Notion']
};
const ORDER = ['Product', 'Project / Delivery', 'AI / Automation', 'Tools', 'Compliance / Certs', 'Domains'];
const label = c => c.replace(' / Delivery', '').replace('AI / Automation', 'AI').replace(' / Certs', '');

const finalSkills = {};
for (const c of ORDER) {
  const set = new Set((m.matched[c] || []).map(x => x.kw));
  (CORE[c] || []).forEach(k => set.add(k));
  if (set.size) finalSkills[c] = [...set];
}
const skillsLine = ORDER.filter(c => finalSkills[c])
  .map(c => `\\textbf{${label(c)}:} ` + finalSkills[c].join(' \\textperiodcentered '))
  .join(' \\textbf{|} ');

// Inject into the template. Templates carry a marker line the matcher replaces:
//   % ATS-SKILLS-LINE   (its content is swapped for skillsLine)
//   % ATS-HEADLINE      (its content is swapped for the headline, if provided)
const texEscape = s => s.replace(/([&%#_$])/g, '\\$1');
let cv = fs.readFileSync(cvPath, 'utf8');
cv = cv.replace(/%\s*ATS-SKILLS-LINE.*(\n[^\n]*)?/, '% ATS-SKILLS-LINE\n    ' + skillsLine);
if (headline) {
  cv = cv.replace(/%\s*ATS-HEADLINE.*(\n[^\n]*)?/, '% ATS-HEADLINE\n        \\textbf{' + texEscape(headline) + '}');
}
cv = cv.replace(/→/g, '->').replace(/—/g, ', '); // normalise glyphs tectonic may choke on
fs.writeFileSync(cvPath, cv);

console.log('Skills row: ' + skillsLine.replace(/\\textbf|\\textperiodcentered|[{}]/g, ''));
console.log(`ATS coverage: ${m.coverage}% (${m.hitCount}/${m.total} bank skills present in JD)`);

// Compile PDF (optional: only if tectonic is installed).
try {
  execSync(`tectonic -o "${outDir}" "${cvPath}"`, { stdio: 'pipe' });
  console.log('OK -> output/' + slug + '/cv.pdf');
} catch (e) {
  const msg = String(e.stderr || e.message || '');
  if (/not found|ENOENT/i.test(msg)) {
    console.log('cv.tex written to output/' + slug + '/. Install tectonic to auto-compile the PDF.');
  } else {
    console.log('cv.tex written, but tectonic failed to compile:\n' + msg.split('\n').slice(-6).join('\n'));
  }
}
