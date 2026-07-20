// TEMPLATE: Hirify channel — apply to a single vacancy inside its own flow.
//
// Anti-fraud / etiquette note (read this):
//   Apply to vacancies ONE at a time, inside the platform's normal apply flow,
//   like a human would. Do NOT bulk-scrape listings, harvest contact details, or
//   fire mass applications. That behaviour trips anti-fraud systems, gets
//   accounts limited, and is disrespectful to recruiters. This template is
//   deliberately per-vacancy and rate-limited for that reason.
//
// Connects over CDP to a browser YOU launched and logged into. Config-driven,
// dry-run aware. Selectors are placeholders — adapt them to the live site.
//
// Usage:
//   node engine/channels/hirify.js <vacancyUrl> [coverFile]
//   DRY=1 or config.autoSend=false => nothing is submitted.

const fs = require('fs');
const { loadConfig, sleep, makeRateLimiter, isAutoSend, connectBrowser } = require('../_common');

const CDP_URL = process.env.HIRIFY_CDP_URL || 'http://127.0.0.1:9222';

(async () => {
  const [vacancyUrl, coverFile] = process.argv.slice(2);
  if (!vacancyUrl) { console.error('usage: node engine/channels/hirify.js <vacancyUrl> [coverFile]'); process.exit(1); }

  const cfg = loadConfig();
  if (!cfg.channels?.hirify?.enabled) { console.log('channels.hirify.enabled is false in config; nothing to do.'); process.exit(0); }
  const auto = isAutoSend(cfg);
  const limiter = makeRateLimiter(cfg);
  const cover = coverFile && fs.existsSync(coverFile) ? fs.readFileSync(coverFile, 'utf8') : '';

  const browser = await connectBrowser(CDP_URL);
  const page = browser.contexts()[0].pages()[0] || await browser.contexts()[0].newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));

  await page.goto(vacancyUrl, { waitUntil: 'domcontentloaded', timeout: 40000 }).catch(() => {});
  await sleep(2000);

  if (!auto) {
    console.log(`[DRY RUN] Would open the apply flow at ${vacancyUrl}` +
      (cover ? ` and attach a ${cover.length}-char cover.` : '.') +
      ' No submission performed.');
    await browser.close();
    process.exit(0);
  }

  const gate = await limiter.take();
  if (!gate.ok) { console.log('Rate limit: ' + gate.reason); await browser.close(); process.exit(0); }

  // TODO: click the vacancy's "Apply" / "Respond" control, fill the cover field
  // if present, then submit. Left as a stub because the exact controls depend on
  // the live Hirify layout. Keep it to the in-flow, single-vacancy path.
  const applyBtn = await page.$('button:has-text("Apply"), button:has-text("Откликнуться"), [data-qa*="apply"]');
  if (!applyBtn) { console.log('Apply control not found — adapt the selector for the current layout.'); await browser.close(); process.exit(0); }
  console.log('TODO: complete the in-flow apply steps here (click apply, fill cover, submit).');

  await browser.close();
  process.exit(0);
})();
