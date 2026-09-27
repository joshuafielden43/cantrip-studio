# Little Works deployment

Requested by Joshua on 2026-09-27. Target: Cloudflare Pages `cantrip-mill`, production branch `main`, https://cantrip-mill.pages.dev/.

Change: homepage banner replaced with `assets/cantrip-little-works.png`; accessibility description updated. Existing logo, copy and independent product sub-pages preserved. All three generated originals and asset records retained.

Status: local checks passed; production verification pending.

Local checks: `npm run build`, `npm test`, `python3 -m pytest -q` (3 passed), `git diff --check`; desktop and 390px mobile visual inspection. Banner matches the approved original byte-for-byte. Product subtrees unchanged. Security pass: no new script, dependency, external endpoint or credential; private working metadata is excluded from dist.
