# Stubs — Fortune Cookie Workshop

Working title **Fortune Cookie Workshop**; visitor title **Fortune Cookie** (Writer lock 2026-09-14).

| Stub | Reality |
| --- | --- |
| Creative visual lock | **A Lacquer Tray theme locked on review** (Joshua 2026-09-14) — dark wood stage (`#3D342C` / `#4A3F36` → `#2E2822`), literal lacquer tray (gold rim `#C9A227`, sheen, inset well) under fortune-wafer art. Brand Georgia `#D4B483`. Tokens: `creative/theme/A-lacquer-tray.html`. Packing Stamp kraft is **not** page bg. |
| Cookie art | **fortune-wafer v3** — Creative true-alpha SoT (`assets/fortune-wafer-closed.png` / `cracked` / `slip-stage`) — RGBA corners transparent; no white plate on lacquer. Proofs: `creative/assets/verify/*-on-black.png`.
| Peek slip (create) | Optional sender-only checkbox — **default OFF**. Closed cookie preview by default. |
| Writer fortunes | **v0.1 · 14 starters** in `fortunes.js` (primary grid). Do not revert to 16. |
| Writer VISITOR-CHROME | Wired in `index.html` / `app.js` (title, soft line, sections, CTAs, filter, crack hints, reveal, empties/fails). Taste sample in mocks: #10 “Keep the joke…”. |
| OG honesty | Static generic `og:` / `twitter:` + closed art `/fortune-cookie/og-closed.png`. Fortune never injected into meta. OG kept existing paper+closed wafer. |
| Secrecy claims | Forbidden. Privacy page states hash is visible to anyone with the link; not encryption. |
| Featured / campaign | **Out** — review candidate only. No homepage card. No campaign chrome. |
| 10hi mark | Light UL stamp on dark (`assets/logo-10hi-mark-light.svg`, cream border `#EFE2CD` on `#2E2822`) → `/`. Understated `10hi` watermark on receive after reveal. |
| SHI filter | Reused via `/still-have-it/vendor/shi-filter.js` — local PG-oriented, not a safety cert. Quiet crimson only for filter/errors. |
| Taste-approved name | Workshop = working title only. Theme = **A Lacquer Tray** (Joshua-locked review). Name / peek default still open. |
| Physical phone QA | Share sheet / clipboard / crack gesture — handoff to QA/Joshua. |
| Reduced motion | Crack ~320ms skipped under `prefers-reduced-motion: reduce` → instant split + slip, no shake. |

## Not in scope

- Accounts / DB / server-side fortune storage
- Production (`cantrip-studio`) — review only (`cantrip-studio-review`)
- Homepage `index.html` edits

## Documented limits (QA notes · non-blocking)
- Custom fortune **maxlength 180** (UI char count + app).
- Save slip (1080×1350) — cracked wafer + fortune on Packing Stamp paper `#EFE2CD` per `creative/SAVE-SLIP-COMPOSE.md` — **not** restyled to lacquer; Joshua keep Save slip compose.
- FC sets **no cookies**; any `10hi_age` on host is Still Have It leftover.
- OG image: closed **wafer** art only (`og-closed.png` 1200×630, Packing Stamp `#EFE2CD` + centered closed wafer); absolute URL on review host. fortune-wafer v3.
