// TEMPLATE: detect and auto-fill common application-form fields from your
// profile (name, email, portfolio, LinkedIn). It fills, but only SUBMITS when
// config.autoSend === true. Everything comes from config/config.json — no
// hardcoded personal data.
//
// It maps a form field to a profile value by matching the field's label,
// name, id, placeholder, or aria-label against a set of patterns.
//
// Usage:
//   node engine/forms.js <formUrl>
//   DRY=1 or config.autoSend=false => fills but never submits.

const { loadConfig, sleep, isAutoSend, connectBrowser } = require('./_common');

const CDP_URL = process.env.FORMS_CDP_URL || 'http://127.0.0.1:9222';

// pattern -> config key. Extend for the fields you meet in the wild.
const FIELD_MAP = [
  { re: /full ?name|your name|имя|фио/i, key: 'fullName' },
  { re: /e-?mail|почта/i, key: 'contactEmail' },
  { re: /portfolio|website|сайт|портфолио/i, key: 'portfolioUrl' },
  { re: /linkedin/i, key: 'linkedinUrl' }
];

(async () => {
  const [formUrl] = process.argv.slice(2);
  if (!formUrl) { console.error('usage: node engine/forms.js <formUrl>'); process.exit(1); }
  const cfg = loadConfig();
  const auto = isAutoSend(cfg);

  const browser = await connectBrowser(CDP_URL);
  const page = browser.contexts()[0].pages()[0] || await browser.contexts()[0].newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));

  await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 40000 }).catch(() => {});
  await sleep(1500);

  const plan = await page.evaluate((map) => {
    const out = [];
    const fields = [...document.querySelectorAll('input[type="text"], input[type="email"], input[type="url"], input:not([type]), textarea')];
    for (const el of fields) {
      const label = el.closest('label')?.innerText ||
        (el.id && document.querySelector(`label[for="${el.id}"]`)?.innerText) || '';
      const hay = [label, el.name, el.id, el.placeholder, el.getAttribute('aria-label')].filter(Boolean).join(' ');
      for (const m of map) {
        if (new RegExp(m.re, 'i').test(hay)) { out.push({ key: m.key, selector: el.id ? '#' + el.id : (el.name ? `[name="${el.name}"]` : null), hay: hay.slice(0, 60) }); break; }
      }
    }
    return out;
  }, FIELD_MAP.map(f => ({ re: f.re.source, key: f.key })));

  let filled = 0;
  for (const f of plan) {
    const val = cfg[f.key];
    if (!val || !f.selector) continue;
    await page.fill(f.selector, String(val)).catch(() => {});
    filled++;
    console.log(`filled ${f.key} -> "${f.hay}"`);
  }
  console.log(`Filled ${filled} field(s).`);

  if (!auto) {
    console.log('[DRY RUN] Not submitting. Review the form, then set autoSend=true (or submit manually).');
    await browser.close();
    process.exit(0);
  }

  const submit = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Отправить")');
  if (submit) { await submit.click().catch(() => {}); console.log('Submitted.'); }
  else console.log('No submit control found — submit manually.');

  await browser.close();
  process.exit(0);
})();
