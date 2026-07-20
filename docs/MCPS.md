# Which MCP servers to connect, and why

JobHunter works with plain CLI scripts, but connecting a few MCP servers lets
Claude drive more of the loop interactively. Connect these in your Claude Code
settings. None are required to onboard or tailor resumes.

## Connect first

- **Browser automation MCP** (e.g. Playwright/Chrome MCP) — the highest-value
  one. Lets Claude open vacancy pages, read job descriptions, and operate the
  channels through a browser you control, instead of you copy-pasting. The bundled
  `engine/channels/*` scripts already speak CDP, so a browser MCP complements
  rather than replaces them.

- **Filesystem / this repo** — Claude reads your `MASTER_RESUME.md`,
  `skills-bank.json`, and writes tailored output. This is the local project, no
  extra server needed, but keep the repo trusted.

## Nice to have

- **Fetch / web MCP** — pull a job description from a URL so you do not paste it.
  Respect each site's terms; some block automated fetches.
- **A notes / tracker MCP** (Notion, etc.) — log applications by their slug so
  the "filename == application identity" chain extends into your tracker.

## Not needed / avoid

- You do NOT need any MCP that stores your platform passwords. Logins happen in
  your own browser (`engine/browser-setup.md`); JobHunter never handles them.
- Avoid MCPs that bulk-scrape job boards. Single-vacancy, human-paced flows keep
  your accounts healthy (see `docs/SAFETY.md`).

## Setup pointers

- Connect servers via `claude mcp` or `/mcp` in an interactive Claude Code
  session, or through your claude.ai connector settings for hosted connectors.
- After connecting a browser MCP, launch your debug browser and log in once
  before asking Claude to apply anywhere.
