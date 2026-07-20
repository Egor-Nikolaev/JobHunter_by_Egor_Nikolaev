# Browser setup for the channel scripts

The channel scripts (`engine/channels/*.js`, `engine/followup.js`, `engine/forms.js`)
do **not** launch a browser or log into anything. They attach to a Chrome that
**you** started and signed into, over the Chrome DevTools Protocol (CDP). This
keeps your sessions and credentials entirely in your hands.

## 1. Get a controllable Chrome

Use a dedicated Chrome (or [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing))
so you are not exposing your everyday browser profile.

```bash
# macOS example — Chrome for Testing
npx @puppeteer/browsers install chrome@stable
```

## 2. Launch it with remote debugging

Pick a fresh user-data dir and a debugging port (the scripts default to 9222):

```bash
"/path/to/chrome" \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.jobhunter-chrome" \
  https://web.telegram.org/a/
```

If you use a proxy (see `engine/proxy/`), add:

```bash
  --proxy-server=socks5://127.0.0.1:10808
```

## 3. Log in manually, once

In that window, sign into the platforms you use (Telegram Web, hh.ru, Hirify).
Your session lives in the `--user-data-dir` you chose. Do this yourself; no
script ever sees your password.

## 4. Point scripts at the port

The scripts read `http://127.0.0.1:9222` by default. Override per channel with
env vars if you run several browsers:

```bash
TG_CDP_URL=http://127.0.0.1:9223 node engine/channels/telegram.js @handle "hi"
HH_CDP_URL=http://127.0.0.1:9222 node engine/channels/hh.js read
```

## Notes

- Keep the debugging port bound to `127.0.0.1`. Anything that can reach the port
  can drive your logged-in browser.
- Close the debug browser when you are done.
- Selectors in the templates reflect each site at the time of writing; update
  them when a site changes its markup.
