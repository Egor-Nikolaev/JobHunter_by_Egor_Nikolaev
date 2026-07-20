// TEMPLATE: follow-up nudges. Send a single polite reminder to chats where you
// applied but got NO reply after N days. Skips anyone who already answered
// (including rejections). Hard-capped and rate-limited. Dry-run by default.
//
// Reads a simple JSON ledger of outreach so it knows who to nudge. Format:
//   [{ "handle": "@someone", "name": "Sam", "appliedAt": "2026-07-01",
//      "channel": "telegram", "replied": false }]
// Point APPLY_LEDGER at your own file (default: output/ledger.json, gitignored).
//
// Usage:
//   node engine/followup.js [days]
//   DRY=1 or config.autoSend=false => it only prints who it WOULD nudge.

const fs = require('fs');
const path = require('path');
const { ROOT, loadConfig, sleep, makeRateLimiter, isAutoSend, connectBrowser } = require('./_common');

const CDP_URL = process.env.TG_CDP_URL || 'http://127.0.0.1:9222';
const LEDGER = process.env.APPLY_LEDGER || path.join(ROOT, 'output', 'ledger.json');

function nudgeText(name) {
  const first = (name || '').trim().split(/\s+/)[0];
  const looksLikeName = /^[A-ZА-ЯЁ][a-zа-яё]+$/.test(first || '');
  const hi = looksLikeName ? `${first}, hi! ` : 'Hi! ';
  return hi + 'Following up on my application — did you get a chance to look at my resume? ' +
    'Happy to answer questions or hop on a quick call whenever suits you.';
}

(async () => {
  const days = parseInt(process.argv[2] || '4', 10);
  const cfg = loadConfig();
  const auto = isAutoSend(cfg);

  if (!fs.existsSync(LEDGER)) {
    console.log(`No ledger at ${LEDGER}. Create it (see the header of this file) to enable follow-ups.`);
    process.exit(0);
  }
  const rows = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  const due = rows.filter(r =>
    r.channel === 'telegram' && r.replied !== true &&
    r.appliedAt && new Date(r.appliedAt).getTime() <= cutoff && !r.nudgedAt
  );

  console.log(`${due.length} chat(s) with no reply after ${days} day(s).`);
  if (!due.length) process.exit(0);

  if (!auto) {
    due.forEach(r => console.log(`[DRY RUN] would nudge ${r.handle} (${r.name || 'unknown'})`));
    process.exit(0);
  }

  const limiter = makeRateLimiter(cfg);
  const browser = await connectBrowser(CDP_URL);
  const page = browser.contexts()[0].pages().find(p => /web\.telegram/i.test(p.url())) || browser.contexts()[0].pages()[0];
  page.on('dialog', d => d.dismiss().catch(() => {}));

  for (const r of due) {
    const gate = await limiter.take();
    if (!gate.ok) { console.log('Stopping: ' + gate.reason); break; }

    await page.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await sleep(3000);
    const search = page.getByPlaceholder('Search').first();
    await search.click({ force: true }).catch(() => {});
    await sleep(600);
    await page.keyboard.type(r.handle.replace(/^@/, ''), { delay: 60 });
    await sleep(4000);
    await page.keyboard.press('ArrowDown').catch(() => {});
    await page.keyboard.press('Enter').catch(() => {});
    await sleep(2500);

    // Guard: if ANY incoming message exists, they engaged — skip.
    const incoming = await page.evaluate(() => {
      const mc = document.querySelector('#MiddleColumn'); if (!mc) return -1;
      return [...mc.querySelectorAll('.Message')].filter(m => !m.classList.contains('own') && (m.innerText || '').trim().length > 1).length;
    });
    if (incoming !== 0) { console.log(`skip ${r.handle}: already engaged (${incoming})`); continue; }

    const text = nudgeText(r.name);
    const box = page.locator('#editable-message-text,[contenteditable="true"]').first();
    await box.click({ force: true }).catch(() => {});
    await sleep(300);
    await page.keyboard.type(text, { delay: 6 });
    await sleep(400);
    await page.keyboard.press('Enter');
    await sleep(2500);

    const ok = await page.evaluate(t => (document.querySelector('#MiddleColumn')?.innerText || '').includes(t.slice(0, 20)), text);
    const flood = await page.evaluate(() => /too many|flood|slow mode|A wait of|подожд|слишком много/i.test(document.body.innerText || ''));
    if (ok && !flood) {
      r.nudgedAt = new Date().toISOString();
      console.log(`nudged ${gate.n}/${gate.cap} -> ${r.handle}`);
    } else {
      console.log(`send failed for ${r.handle} (ok=${ok} flood=${flood}) — stopping to avoid limits.`);
      break;
    }
  }

  fs.writeFileSync(LEDGER, JSON.stringify(rows, null, 2));
  await browser.close();
  process.exit(0);
})();
