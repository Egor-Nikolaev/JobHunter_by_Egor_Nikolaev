# Bring your own proxy (optional)

Some job platforms are only reachable, or only behave normally, from a specific
region. If that is your situation, route the browser you drive through a proxy
using **your own** subscription. JobHunter ships no servers, keys, or accounts —
you supply everything.

This is entirely optional. If you can reach your target platforms directly,
skip this folder and set `proxy.enabled: false` in `config/config.json`.

## What you need

- Your own proxy subscription (from a provider you pay for, or your own server).
- A local proxy client: [Xray-core](https://github.com/XTLS/Xray-core) or
  [sing-box](https://github.com/SagerNet/sing-box). Install via your package
  manager or their releases. Do not commit their binaries.

## Setup

1. Copy the template and fill in **your** server details:

   ```bash
   cp engine/proxy/xray.example.json engine/proxy/xray.local.json
   # edit xray.local.json — replace every <YOUR_*> placeholder
   ```

   `*.local.*` is gitignored, so your real config never lands in git.

2. Start the client, which opens a local SOCKS inbound (default `127.0.0.1:10808`):

   ```bash
   xray run -c engine/proxy/xray.local.json
   ```

3. Launch the browser through that SOCKS proxy (see `docs/browser-setup.md`),
   e.g. Chrome for Testing with
   `--proxy-server=socks5://127.0.0.1:10808 --remote-debugging-port=9222`.

4. The channel scripts connect to that browser over CDP as usual.

## Rules

- Use only a subscription you are entitled to use. Respect the provider's terms.
- Never paste real server addresses, UUIDs, or keys into any file that is
  tracked by git, or into config, CLAUDE.md, chat, or issues.
- A proxy does not exempt you from a platform's Terms of Service. See
  `docs/SAFETY.md`.
