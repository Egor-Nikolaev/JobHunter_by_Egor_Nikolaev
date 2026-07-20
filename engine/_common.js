// Shared helpers for the channel scripts: config loading, a simple rate limiter,
// and a dry-run gate. No secrets live here; everything comes from config/config.json.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function loadConfig() {
  const p = path.join(ROOT, 'config', 'config.json');
  if (!fs.existsSync(p)) {
    console.error('config/config.json not found. Copy config/config.example.json and fill it in.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// A per-run send budget + minimum spacing. Reads limits from config; env can only
// tighten, never loosen (safety). Returns a guard you call before every send.
function makeRateLimiter(cfg) {
  const rl = cfg.rateLimits || {};
  const cap = Math.max(1, rl.perDayTotal || 25);
  const gapMs = Math.max(1000, (rl.minSecondsBetweenSends || 90) * 1000);
  let sent = 0, last = 0;
  return {
    remaining: () => cap - sent,
    async take() {
      if (sent >= cap) return { ok: false, reason: 'cap-reached', cap };
      const wait = Math.max(0, gapMs - (Date.now() - last));
      if (wait > 0) await sleep(wait);
      sent++; last = Date.now();
      return { ok: true, n: sent, cap };
    }
  };
}

// autoSend must be explicitly true in config. Anything else = dry run.
function isAutoSend(cfg) {
  return cfg.autoSend === true && process.env.DRY !== '1';
}

// Connect to a user-launched Chrome that exposes a CDP endpoint (see docs/
// browser-setup.md). We never launch or log into anything ourselves.
async function connectBrowser(cdpUrl) {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) {
    console.error('playwright is not installed. Run: npm install');
    process.exit(1);
  }
  const url = cdpUrl || process.env.CDP_URL || 'http://127.0.0.1:9222';
  try {
    const browser = await chromium.connectOverCDP(url);
    return browser;
  } catch (e) {
    console.error(`Could not connect to a browser at ${url}. Launch Chrome with --remote-debugging-port first (docs/browser-setup.md).`);
    process.exit(1);
  }
}

module.exports = { ROOT, loadConfig, sleep, makeRateLimiter, isAutoSend, connectBrowser };
