# Cantrip Studio — approved landing direction

Updated 2026-09-27 from Joshua's explicit selection and deployment request. Supersedes the 2026-09-11 seasonal-banner lock and its obsolete repository/location references.

## Canonical project

- Local: `/Users/jcf/Projects/www`
- Repository: `https://github.com/joshuafielden43/cantrip-studio`
- Cloudflare Pages project: `cantrip-mill`; production branch: `main`
- Public URL: `https://cantrip-mill.pages.dev/`
- Build: `npm run build`; publish `dist/` only.

## Approved homepage

- Banner: **Little Works**, `assets/cantrip-little-works.png`, 2172 × 724. Joshua selected it unambiguously from three generated alternatives.
- Keep the current typographic `assets/10hi-logo-04.png` logo and its mailto link. It belongs with the new banner and does not need regeneration.
- Retain “Small things worth sending.” Homepage navigation must expose both Still Have It (`still-have-it/`) and Fortune Cookie (`fortune-cookie/`); stack their cards on narrow screens.
- Draw visual/style cues from `/Users/jcf/Documents/HoneyNeo/HoneyNEO/DESIGN.md`: royal blue, navy and vellum; disciplined typography. Cantrip is more playful and whimsical than the institutional 10hi work. Do not import castles, Gothic towers or heraldic pageantry.
- No seasonal tableau: the old ribbons, star and ornament-like objects read as Christmas to Joshua and a trusted audience reviewer.
- Sub-pages intentionally have their own self-referential visual styles. Do not force this homepage art direction onto Still Have It or Fortune Cookie.

## Asset records

Originals, exact prompts and structured Markdown metadata: `output/imagegen/cantrip-banner-options/`. Little Works is selected; An Inkling is retained for unspecified future use; A Small Surprise (Joshua's “Escher marble run”) is earmarked for reuse after polish. Not selected does not mean rejected. Preserve originals; give derivatives their own IDs and parent links.

The generation used the built-in image tool. Its underlying model identifier and embedded watermark were not independently verified. Do not invent provenance beyond the recorded receipt.

## Deployment checks

Before production: run build, existing Node tests and pytest; inspect desktop/mobile rendering, image/alt-text references and public-output exclusions. Confirm changes do not alter product subtrees or introduce scripts, endpoints or dependencies. After push: verify commit deployment and the public page/asset, then record the receipt in `DEPLOYMENT.md`. Selection alone is not deployment.
