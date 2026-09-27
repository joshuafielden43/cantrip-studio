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

The public address is `https://cantrip-mill.pages.dev/`. The project is connected to `joshuafielden43/cantrip-studio`; pushes to `main` trigger production deployments.

`_redirects` preserves nested routes using build-generated shell and privacy copies outside the matched prefix, avoiding Pages' HTML normalization loops. Fortune Cookie privacy is served directly from its directory. `_headers` carries the lab's security headers, including generated-image previews.

- **Existing lab site:** `https://www.sawfish-cloud.ts.net/`
- **Products:** `/still-have-it/` and `/fortune-cookie/`
- **Edge config:** `ops/Caddyfile`; it preserves Still Have It’s fallback routes and the generated-image CSP requirement.
- **Creative archive:** `/creative/` is preserved in the recovery artifact and excluded from the served site.

## Homepage design and asset library

[Approved landing direction](LANDING-LOCK.md) records the Little Works banner, existing 10hi logo, HoneyNEO visual cues and intentionally independent product-page styles. [Asset records](output/imagegen/cantrip-banner-options/prompts.md) retain all three candidates, exact prompts, file hashes and Joshua's selection/reuse notes. Each image has a Markdown sidecar with versioned YAML metadata and a stable asset ID for future database import. These private working records are excluded from the public build.

[Deployment receipt](DEPLOYMENT.md) records the latest verified release. Cloudflare production is Git-connected: pushing `main` publishes the build. Keep generated originals and metadata in Git, but publish only `dist/`.
