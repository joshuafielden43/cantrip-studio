# Fortune Cookie Workshop

Working title only (not taste-approved). Visitor-facing name: **Fortune Cookie**.

Static Cantrip Studio playable: create → closed-cookie link → crack/reveal → save slip / make one back.

## Run locally

From the `10hi-site` root (so `/assets`, `/still-have-it/vendor/shi-filter.js`, and `/fortune-cookie/` resolve):

```bash
npx --yes serve -l 4173 .
# open http://localhost:4173/fortune-cookie/
```

Or any static server that serves the site root. No build step. Vanilla HTML/CSS/JS.

## Hash encoding

Shared links put the fortune in `location.hash` only:

`#v1.` + base64url(UTF-8 JSON `{ "t": "<fortune>" }`)

- Opens in **closed** mode (no auto-reveal).
- OG/Twitter meta stay **generic** — fortune never written into `<head>`.
- Not encryption; see `privacy/`.

## Review deploy note

Do **not** deploy from this box unless Joshua/PM asks. Do not modify production homepage `index.html` or add a landing card. Nested path redirects live in `/_redirects` (privacy). Review candidate only — no Featured / campaign chrome.

## Files

| Path | Role |
| --- | --- |
| `index.html` | SPA shell + generic OG |
| `styles.css` | Cream/kraft + CSS cookie |
| `app.js` | Create / share / crack / save slip |
| `fortunes.js` | Writer `FC_STARTERS` |
| `privacy/index.html` | Honest link + filter limits |
| `STUBS.md` | Creative + residual stubs |

Custom fortunes cap at **180** characters. Link hash carries the fortune (not encrypted). OG card uses closed-cookie art only.
