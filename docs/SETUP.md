# Setup

## Prerequisites
- **Node.js 18+** — runs the matcher, tailoring, and channel scripts.
- **Claude Code** — the onboarding and tailoring skills run here.
- **tectonic** — compiles the LaTeX resume to PDF. `brew install tectonic`
  (macOS) or see the [tectonic install docs](https://tectonic-typesetting.github.io/).
  Optional: without it, `tailor.js` still writes the `.tex`, you compile later.
- **Playwright** — drives the browser for the channel scripts. Installed via
  `npm install` (below). You do not need `playwright install` browsers, because
  the scripts attach to a browser you launch yourself.

## Install
```bash
npm install
```

## First run (in Claude Code)
1. Open this folder in Claude Code.
2. Say "onboard me" (or the `onboard` skill triggers when `config/config.json` is
   missing). Answer the interview. It writes:
   - `config/config.json`
   - `profile/MASTER_RESUME.md`
   - `config/skills-bank.json`
3. Tailor your first resume: paste a job description and say "tailor my resume for
   this". Or run it directly:
   ```bash
   node resume/tailor.js acme-pm en examples/sample_jd.txt "Product Manager (AI)"
   ```
   Output lands in `output/acme-pm/`.

## Connect MCP servers first
See `docs/MCPS.md`. At minimum, connect a browser-automation MCP if you want
Claude to drive the channels interactively rather than via the CLI scripts.

## Applying (optional, later)
1. Read `engine/browser-setup.md` and launch a debug Chrome you log into.
2. Keep `autoSend: false` in config and run any channel script — it dry-runs and
   prints exactly what it would send. Flip to `true` only when you are ready.

## Config quick reference
`config/config.example.json` documents every field. Copy it to
`config/config.json` (gitignored) and fill it in. Secrets never leave that file.
