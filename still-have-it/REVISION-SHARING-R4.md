# Revision note — Still Have It sharing R4

**Date:** 2026-09-13
**Status:** Published to production 2026-09-13 (Joshua/PM authorized). Featured still out of scope until Joshua says.

## Vs prior icon-pack build

- Duration: numeric + Months/Years (≥44px), 1–999, preserve number across units, singular/plural phrase in export
- Editable short invitation (headline still from item); locked defaults preserved
- Local PG filter: bundled MIT `obscenity` from Writer FILTER-POLICY (debounced + hard gate on Share/Save)
- Light/dark opaque 1080×1350 PNG; default light; LL **10HI** watermark; preview ≡ export; stale async discarded
- Dark canvas strips near-white pack plate (no postage stamp)
- Share card: prepare File before tap; `canShare({files})`; AbortError quiet; no cancel→download; no false “Shared”
- Save image: `still-have-it-{item}-{light\|dark}.png`
- Age 13+: “Are you 13 or older?” Yes/No unselected; No does not unlock
- Cookies: only `10hi_age` + `10hi_prefs`; expire `shi_pack`/`shi_item`; Remember off by default
- Self-hosted Fraunces + DM Sans (no Google Fonts request)
- Privacy draft at `/still-have-it/privacy/`

## Filter

- Package: `obscenity` (npm, bundled to `vendor/shi-filter.js`)
- Config: Writer curated block + allowlist — not library default dump
- Message: `Keep it friendly—please change this wording.`

## Open stubs

See `STUBS.md` (spaced evasion edge case; Writer review of dick allowlist tradeoff; physical phone QA).
