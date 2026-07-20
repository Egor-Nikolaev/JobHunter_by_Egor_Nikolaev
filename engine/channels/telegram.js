// TEMPLATE: Telegram Web channel — open a chat by @username, attach a resume
// file, send a message, optionally move the chat into a folder.
//
// This is a driving skeleton, not a turnkey bot. Telegram Web's DOM changes over
// time; you own keeping the selectors current. It connects to a browser YOU
// launched and logged into (docs/browser-setup.md) via CDP — it never stores or
// handles your Telegram credentials.
//
// Safety: honours config.rateLimits and config.autoSend. With autoSend=false
// (default) it logs exactly what WOULD be sent and sends nothing.
//
// Usage:
//   node engine/channels/telegram.js <@handle> "<message>" [path/to/cv.pdf]
//   DRY=1 forces dry-run regardless of config.

const { loadConfig, sleep, makeRateLimiter, isAutoSend, connectBrowser } = require('../_common');

const CDP_URL = process.env.TG_CDP_URL || 'http://127.0.0.1:9222';

async function openChat(page, handle) {
  await page.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await sleep(3000);
  const search = page.getByPlaceholder('Search').first();
  await search.click({ force: true }).catch(() => {});
  await sleep(600);
  await page.keyboard.type(handle.replace(/^@/, ''), { delay: 60 });
  await sleep(4000);
  await page.keyboard.press('ArrowDown').catch(() => {});
  await page.keyboard.press('Enter').catch(() => {});
  for (let i = 0; i < 12; i++) {
    await sleep(600);
    const ready = await page.evaluate(() => !!document.querySelector('[contenteditable="true"]'));
    if (ready) return true;
  }
  return false;
}

async function typeMessage(page, text) {
  const box = page.locator('#editable-message-text,[contenteditable="true"]').first();
  await box.click({ force: true }).catch(() => {});
  await sleep(300);
  await page.keyboard.type(text, { delay: 8 });
  await sleep(400);
}

(async () => {
  const [handle, message, filePath] = process.argv.slice(2);
  if (!handle || !message) {
    console.error('usage: node engine/channels/telegram.js <@handle> "<message>" [cv.pdf]');
    process.exit(1);
  }
  const cfg = loadConfig();
  if (!cfg.channels?.telegram?.enabled) {
    console.log('channels.telegram.enabled is false in config; nothing to do.');
    process.exit(0);
  }
  const limiter = makeRateLimiter(cfg);
  const auto = isAutoSend(cfg);

  const browser = await connectBrowser(CDP_URL);
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => /web\.telegram/i.test(p.url())) || await ctx.newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));

  const opened = await openChat(page, handle);
  if (!opened) { console.log('Could not open chat for ' + handle); await browser.close(); process.exit(1); }

  if (!auto) {
    console.log(`[DRY RUN] Would send to ${handle}${filePath ? ' (with attachment ' + filePath + ')' : ''}:`);
    console.log('---\n' + message + '\n---');
    await browser.close();
    process.exit(0);
  }

  const gate = await limiter.take();
  if (!gate.ok) { console.log('Rate limit: ' + gate.reason + ' (cap ' + gate.cap + ')'); await browser.close(); process.exit(0); }

  // NOTE: file attachment via the paperclip menu is intentionally left as a
  // documented stub — the exact selectors depend on your Telegram Web build.
  // Fill in the attach flow here, then type the caption/message and send.
  if (filePath) console.log('TODO: attach ' + filePath + ' via the composer paperclip, then send with caption.');

  await typeMessage(page, message);
  await page.keyboard.press('Enter');
  await sleep(2500);
  const ok = await page.evaluate(t => (document.querySelector('#MiddleColumn')?.innerText || '').includes(t.slice(0, 24)), message);
  console.log(`send ${gate.n}/${gate.cap} -> ${handle}: ${ok ? 'confirmed in thread' : 'not confirmed, check manually'}`);

  await browser.close();
  process.exit(0);
})();
