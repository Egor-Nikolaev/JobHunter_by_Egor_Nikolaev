---
name: onboard
description: Onboard a new user of JobHunter. Interview them about who they are, target roles, seniority, location/work-format and channels; then help them write their MASTER_RESUME, fill their skills-bank, and create config/config.json. Trigger when the repo is opened for the first time, when the user says "onboard me", "set up JobHunter", "get me started", or when config/config.json is missing.
---

# Onboarding a new JobHunter user

Goal: turn a fresh clone into a working setup — `config/config.json`,
`profile/MASTER_RESUME.md`, and `config/skills-bank.json` — all filled with the
user's OWN data. Never invent facts about them; ask.

## 0. Orient
- Check whether `config/config.json` exists. If it does, ask whether they want to
  re-onboard or just update a section.
- Read `profile/MASTER_RESUME.example.md` and `config/config.example.json` so you
  know the target shapes. Do NOT treat the example persona ("Alex Doe") as real.

## 1. Interview (one topic at a time, keep it short)
Ask, and wait for answers, in this order:
1. Name, contact email, portfolio URL, LinkedIn URL.
2. Target roles and seniority (e.g. "Senior Product Manager"; "mid–senior").
3. Locations and work format (remote / hybrid / onsite; time zones).
4. Domains they want (or want to avoid).
5. Which channels they will use: Telegram job chats, hh.ru, Hirify. For each,
   note the handle/account. Do not ask for passwords — logins happen in their
   own browser (see `engine/browser-setup.md`).
6. Whether they need a proxy for regional access (optional).
7. API: will they run resume tailoring inside Claude Code (default), or supply an
   Anthropic API key for scripted use?

## 2. Build MASTER_RESUME
- Copy `profile/MASTER_RESUME.example.md` to `profile/MASTER_RESUME.md`.
- Interview them through each section: summary, every role (with a defensible
  metric per bullet), skills, education. Push back on vague or unverifiable
  claims — the resume must survive an interview.
- Write only what they confirm. Leave clearly-marked TODOs for gaps.

## 3. Build the skills-bank
- Copy `config/skills-bank.example.json` to `config/skills-bank.json`.
- Add/remove skills so it is an HONEST superset of what they actually have. Add
  synonyms in their working languages. This bank is the only source the ATS
  matcher draws from — nothing is fabricated downstream.

## 4. Write config
- Copy `config/config.example.json` to `config/config.json` and fill every field
  from the interview. Leave `<YOUR_*>` placeholders where a value is not ready.
- Keep `autoSend: false` and the default rate limits for now. Explain both.

## 5. Confirm and hand off
- Summarise what was written (files + key fields), flag remaining TODOs.
- Point them to `docs/SETUP.md` for prerequisites (Node, tectonic, Playwright)
  and to the `tailor-resume` skill for their first tailored resume.
- Remind them: review every generated message before sending; nothing is sent
  automatically while `autoSend` is false.

## Guardrails
- Secrets (API keys, proxy keys, cookies) go only in `config/config.json` or a
  `.env`/`*.local.*` file — never in CLAUDE.md, chat, or committed files.
- Do not enable auto-send or raise rate limits on the user's behalf without an
  explicit request, and explain the risk when they ask.
