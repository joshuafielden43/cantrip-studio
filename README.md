# Cantrip Studio — www

Static Cantrip Studio site. GitHub is the source; Cloudflare Pages publishes the built assets.

## Build and check

Run `npm run build`, `npm test`, and `pytest -q` (install pytest first). The build needs only Node.js and copies public files into `dist/`. Upload only `dist/`; the repository root contains recovery artifacts and operational files that must not be published.

## Cloudflare Pages GitHub deployment

Create a Pages project using **Import an existing Git repository**, select this repository, and use:

- Project name: `cantrip-mill`
- Production branch: `main`
- Framework preset: None
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: leave blank

The intended address is `https://cantrip-mill.pages.dev/`. GitHub pushes trigger deployments once the repository is connected. A direct-upload project is not the intended setup.

`_redirects` preserves nested routes; `_headers` carries the lab's security headers, including generated-image previews.

- **Existing lab site:** `https://www.sawfish-cloud.ts.net/`
- **Products:** `/still-have-it/` and `/fortune-cookie/`
- **Edge config:** `ops/Caddyfile`; it preserves Still Have It’s fallback routes and the generated-image CSP requirement.
- **Creative archive:** `/creative/` is preserved in the recovery artifact and excluded from the served site.
