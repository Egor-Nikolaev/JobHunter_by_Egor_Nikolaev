# JobHunter — instructions for Claude Code

This repo is a job-application autopilot the user runs inside Claude Code. Your
job is to onboard them, tailor resumes to specific vacancies, and help drive the
channel scripts — safely, with the user in control.

## First contact
- If `config/config.json` is missing, the user is new: run the **onboard** skill
  (`.claude/skills/onboard`). Do not skip straight to applying.
- Never treat the example persona "Alex Doe" in `profile/MASTER_RESUME.example.md`
  as a real person. Real data lives in `profile/MASTER_RESUME.md` (gitignored).

## The pipeline (stages)
1. **Onboard** — interview the user, write `config/config.json`,
   `profile/MASTER_RESUME.md`, `config/skills-bank.json`. Skill: `onboard`.
2. **Tailor** — per vacancy, produce a resume PDF + cover. Skill: `tailor-resume`
   → `node resume/tailor.js <slug> <en|ru> <jd.txt> "<headline>"`.
3. **Apply** — drive a channel to submit:
   - Telegram job chats: `node engine/channels/telegram.js <@handle> "<msg>" [cv.pdf]`
   - hh.ru: `node engine/channels/hh.js apply <vacancyId> "<resume title>" [cover]`
   - Hirify: `node engine/channels/hirify.js <vacancyUrl> [cover]`
4. **Follow up** — nudge non-responders: `node engine/followup.js [days]`.
5. **Forms** — auto-fill common application forms: `node engine/forms.js <url>`.

The channel scripts attach to a browser the user launched and logged into (see
`engine/browser-setup.md`). They never handle credentials.

## The golden rule: filename == application identity
Use one short, filename-safe **slug** per vacancy (e.g. `acme-pm`). That slug is
the name of the output folder (`output/<slug>/`), the resume file, and the key in
any tracking/ledger. Keep it identical everywhere so a reply can always be traced
back to the exact resume that was sent. Do not rename mid-flow.

## Safety rules (enforce these)
- **Review before send.** Never send a message, submit an application, or submit
  a form without showing the user the exact content first — UNLESS
  `config.autoSend` is `true`. Default is `false`; keep it that way unless the
  user explicitly asks otherwise and understands the risk.
- **Rate limits are real.** Respect `config.rateLimits` (`perDayTotal`,
  `minSecondsBetweenSends`). Do not raise them silently or add parallelism to
  send faster. If a flood/limit signal appears, stop.
- **One vacancy at a time.** No bulk scraping or mass-blasting. It gets accounts
  limited and wastes recruiters' time.
- **Truthful resumes.** The ATS matcher only surfaces skills that are BOTH in the
  user's bank AND in the JD. Never fabricate skills, metrics, or experience to
  raise coverage. If the user lacks something the JD wants, say so.

## Secrets
API keys, proxy keys, cookies, tokens go only in `config/config.json`, a `.env`,
or `*.local.*` files — all gitignored. Never write them into this file, chat,
committed files, or issues. If a secret shows up somewhere it should not, warn
the user that it is compromised.
