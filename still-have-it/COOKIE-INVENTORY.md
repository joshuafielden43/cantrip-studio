# Cookie inventory — Still Have It (Rev 4 sharing review)

Two first-party cookies only. **No PII. No unique visitor ID. No custom message/duration in cookies.**

| Name | Purpose | Scope / Path | SameSite | Secure | Max-Age | What is stored |
| --- | --- | --- | --- | --- | --- | --- |
| `10hi_age` | Affirmative answer to “Are you 13 or older?” (policy versioned) | `/` | `Lax` | Yes on HTTPS | `31536000` (1 year) | `13v1.<unix_ts>` — no birthday, name, or account |
| `10hi_prefs` | Optional “Remember my choices” — item / look / background | `/still-have-it/` | `Lax` | Yes on HTTPS | `31536000` (1 year) | JSON `{v:1,remember:true,pack,item,bg}` — no invitation, duration, contacts, or unique ID |

## Migration

| Name | Status |
| --- | --- |
| `shi_pack` | **Expired** on load (path `/still-have-it/` and `/`). No longer read. |
| `shi_item` | **Expired** on load. No longer read. |
| `shi_skin` | **Expired** if present. |

Migration does **not** treat old pack/item cookies as consent for `10hi_prefs`. Remember starts **OFF** unless a valid `10hi_prefs` with `remember:true` already exists.

## Notes

- Age gates Share card and Save image until Yes.
- No does not unlock generation/sharing.
- URL path remains authoritative for pack/item on explicit deep links.
- Client JS cookies (not HttpOnly) so the affirm flow can read/write in-page.
- No analytics, ads, or third-party cookies from this cantrip. Fonts are self-hosted.
