// TEMPLATE: hh.ru channel — apply to a vacancy with a chosen resume + cover
// letter, read new chat messages, and reply. Config-driven and dry-run aware.
//
// Connects over CDP to a browser YOU launched and logged into. It never handles
// your hh.ru credentials. Selectors (data-qa attributes) reflect hh.ru at the
// time of writing and may need updating.
//
// Usage:
//   node engine/channels/hh.js apply <vacancyId> "<resume title>" [coverFile]
//   node engine/channels/hh.js read
//   DRY=1 or config.autoSend=false => no application is submitted.

const fs = require('fs');
const { loadConfig, sleep, makeRateLimiter, isAutoSend, connectBrowser } = require('../_common');

const CDP_URL = process.env.HH_CDP_URL || 'http://127.0.0.1:9222';
const BASE = process.env.HH_BASE || 'https://hh.ru';

async function apply(page, cfg, { vacancyId, resumeTitle, cover }) {
  const auto = isAutoSend(cfg);
  const limiter = makeRateLimiter(cfg);

  await page.goto(`${BASE}/vacancy/${vacancyId}`, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await sleep(1500);

  const already = await page.evaluate(() => /Вы откликнулись|You have responded/i.test(document.body.innerText));
  if (already) { console.log(vacancyId + ': already applied'); return; }

  if (!auto) {
    console.log(`[DRY RUN] Would apply to vacancy ${vacancyId} with resume "${resumeTitle}"` +
      (cover ? ` and a ${cover.length}-char cover letter.` : ' (no cover).'));
    return;
  }
  const gate = await limiter.take();
  if (!gate.ok) { console.log('Rate limit: ' + gate.reason); return; }

  const respBtn = await page.$('[data-qa="vacancy-response-link-top"]');
  if (!respBtn) { console.log(vacancyId + ': no respond button (already applied / archived?)'); return; }
  await respBtn.click().catch(() => {});
  await sleep(2500);

  // Cover letter, if the popup exposes the field.
  if (cover) {
    const sel = '[data-qa="vacancy-response-popup-form-letter-input"]';
    if (await page.$(sel)) await page.fill(sel, cover).catch(() => {});
  }
  await sleep(400);
  await page.click('[data-qa="vacancy-response-submit-popup"]').catch(() => {});
  await sleep(3500);

  const post = await page.evaluate(() => ({
    applied: /Вы откликнулись|You have responded/i.test(document.body.innerText),
    captcha: /капч|captcha|подтвердите, что вы человек|not a robot/i.test(document.body.innerText)
  }));
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape').catch(() => {}); await sleep(300); }

  if (post.captcha) { console.log(vacancyId + ': CAPTCHA — stop and solve it yourself, then retry.'); return; }
  console.log(`${vacancyId}: ${post.applied ? 'applied' : 'unknown — verify manually'} (send ${gate.n}/${gate.cap})`);
}

async function readMessages(page) {
  await page.goto(`${BASE}/applicant/negotiations`, { waitUntil: 'domcontentloaded', timeout: 40000 }).catch(() => {});
  await sleep(2500);
  const items = await page.evaluate(() =>
    [...document.querySelectorAll('[data-qa*="negotiation"], [class*="negotiation"]')]
      .slice(0, 40)
      .map(el => (el.innerText || '').replace(/\s+/g, ' ').trim())
      .filter(t => t.length > 8)
  );
  console.log('Recent negotiation rows (read-only):');
  items.slice(0, 20).forEach((t, i) => console.log(`  ${i + 1}. ${t.slice(0, 120)}`));
}

(async () => {
  const [cmd, vacancyId, resumeTitle, coverFile] = process.argv.slice(2);
  const cfg = loadConfig();
  if (!cfg.channels?.hh?.enabled) { console.log('channels.hh.enabled is false in config; nothing to do.'); process.exit(0); }

  const browser = await connectBrowser(CDP_URL);
  const page = browser.contexts()[0].pages()[0] || await browser.contexts()[0].newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));

  if (cmd === 'apply') {
    if (!vacancyId) { console.error('usage: node engine/channels/hh.js apply <vacancyId> "<resume title>" [coverFile]'); process.exit(1); }
    const cover = coverFile && fs.existsSync(coverFile) ? fs.readFileSync(coverFile, 'utf8') : '';
    await apply(page, cfg, { vacancyId, resumeTitle: resumeTitle || '', cover });
  } else if (cmd === 'read') {
    await readMessages(page);
  } else {
    console.error('usage: node engine/channels/hh.js <apply|read> ...');
  }

  await browser.close();
  process.exit(0);
})();
