# Safety, rate limits, and etiquette

## Disclaimer

JobHunter is an automation aid. You are responsible for complying with each
platform's Terms of Service. Automated messaging and applications can lead to
account limits or bans. Always review generated messages before sending them. Be
respectful of recruiters' time. Rate limits exist for a reason. This project does
not help you spam anyone or bypass any platform's protections, and nothing here
should be read as encouragement to do so.

## Review before send

- Default configuration is `autoSend: false`. Every channel script then runs as a
  **dry run**: it prints exactly what it would send and sends nothing.
- Only set `autoSend: true` when you have read the message and want it delivered.
  Even then, prefer to review each batch.

## Rate limits

Configured in `config/config.json`:
- `perDayTotal` — the maximum sends per run/day (default 25). Keep it modest.
- `minSecondsBetweenSends` — minimum spacing between sends (default 90s).

The scripts enforce these and can only be tightened, not loosened, by env vars.
If a platform shows a flood/slow-mode/limit warning, the scripts stop. Do not
work around that — it is the platform telling you to slow down.

## Etiquette

- **One vacancy at a time.** Apply inside the platform's normal flow. No bulk
  scraping of listings or contact details.
- **One follow-up, then stop.** `followup.js` nudges a silent thread once and
  skips anyone who replied (including rejections). Do not badger.
- **Tailor honestly.** The matcher only surfaces skills you actually listed and
  the JD actually asked for. Never inflate a resume to beat a filter — it fails
  in the interview and burns the relationship.

## Your data

- Secrets (API keys, proxy keys, cookies, tokens) live only in
  `config/config.json`, `.env`, or `*.local.*` files, all gitignored. Never paste
  them into shared files, chat, or issues.
- Your real resume (`profile/MASTER_RESUME.md`) and outreach ledger
  (`output/ledger.json`) are gitignored. Keep them that way before you push.
- Before publishing this repo, run a secret scan. The author (see README) ships
  only placeholders; keep it that way in your fork.
